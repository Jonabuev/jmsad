import { useState, useEffect, useCallback } from 'react';
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

  const fetchData = useCallback(async (requestConfig: AxiosRequestConfig = {}) => {
    const finalUrl = requestConfig.url || url;
    if (!finalUrl) {
      console.error('URL не указан');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log('API запрос:', { finalUrl, config, requestConfig });
      const response = await api.request<T>({
        url: finalUrl,
        ...config,
        ...requestConfig,
      });
      console.log('API ответ:', response.data);
      setData(response.data);
      return response.data;
    } catch (err) {
      console.error('API ошибка:', err);
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
  }, [fetchData, options.manual, options.skip, url]);

  return { data, loading, error, fetchData };
}; 