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
    if (!url) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.request<T>({
        url,
        ...config,
        ...requestConfig,
      });
      setData(response.data);
      return response.data;
    } catch (err) {
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