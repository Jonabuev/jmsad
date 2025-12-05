/**
 * SWR Hook для поиска пользователей
 * 
 * Кэширует результаты поиска с дебаунсингом
 */

import useSWR from 'swr';
import { fetcher, swrConfig } from './useSWRConfig';
import api from '@/service/api';

export interface SearchParams {
  full_name?: string;
  iin?: string;
  start_date?: string;
  end_date?: string;
  address?: string;
  court_score?: string;
  reasons?: number[];
  is_verified?: boolean;
}

export interface UseSearchOptions {
  params: SearchParams;
  enabled?: boolean;
  type?: 'tenants' | 'landlords';
}

/**
 * Hook для поиска арендаторов
 */
export function useTenantSearch(options: UseSearchOptions) {
  const { params, enabled = true, type = 'tenants' } = options;
  
  // Создаем ключ для кэша на основе параметров
  const searchKey = enabled && Object.keys(params).length > 0
    ? `/tenant-registry1/?${new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              value.forEach(v => acc.append(key, String(v)));
            } else {
              acc.append(key, String(value));
            }
          }
          return acc;
        }, new URLSearchParams())
      ).toString()}`
    : null;

  const { data, error, isLoading, mutate } = useSWR(
    searchKey,
    async (url: string) => {
      // Используем api instance, который автоматически добавляет токен
      const response = await api.get(url);
      return response.data;
    },
    {
      ...swrConfig,
      revalidateOnMount: false, // Не загружать автоматически
      revalidateOnFocus: false,
    }
  );

  return {
    results: data,
    loading: isLoading,
    error,
    mutate,
  };
}

/**
 * Hook для получения причин жалоб
 */
export function useComplaintReasons(locale: string = 'ru', type?: string) {
  const params = new URLSearchParams({ locale });
  if (type) params.append('type', type);
  
  const key = `/all-complaint-reasons/?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    fetcher,
    {
      ...swrConfig,
      revalidateOnMount: true,
      // Кэшировать причины жалоб дольше, так как они редко меняются
      dedupingInterval: 60000, // 1 минута
    }
  );

  return {
    reasons: data,
    loading: isLoading,
    error,
    mutate,
  };
}

