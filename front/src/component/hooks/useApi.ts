import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/service/api';
import { AxiosRequestConfig } from 'axios';

interface UseApiOptions {
  manual?: boolean;
  skip?: boolean;
}

export const useApi = <T>(url: string | null | undefined, config: AxiosRequestConfig = {}, options: UseApiOptions = {}) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!options.manual && !options.skip && !!url);
  const [error, setError] = useState<any | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (requestConfig: AxiosRequestConfig = {}) => {
    const finalUrl = requestConfig.url || url;
    if (!finalUrl) {
      if (process.env.NODE_ENV === 'development') {
        console.error('URL не указан');
      }
      return;
    }

    // Отменяем предыдущий запрос, если он еще выполняется
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Создаем новый AbortController для текущего запроса
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('API запрос:', { finalUrl, config, requestConfig });
      }
      const response = await api.request<T>({
        url: finalUrl,
        ...config,
        ...requestConfig,
        signal: abortControllerRef.current.signal,
      });
      if (process.env.NODE_ENV === 'development') {
        console.log('API ответ:', response.data);
      }
      setData(response.data);
      return response.data;
    } catch (err: any) {
      // Игнорируем ошибки отмены запроса
      if (err.name === 'AbortError' || err.name === 'CanceledError') {
        return;
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('API ошибка:', err);
      }
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(config)]);

  useEffect(() => {
    if (!options.manual && !options.skip && url) {
      fetchData();
    }

    // Cleanup: отменяем запрос при размонтировании компонента
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, options.manual, options.skip, url]);

  return { data, loading, error, fetchData };
}; 