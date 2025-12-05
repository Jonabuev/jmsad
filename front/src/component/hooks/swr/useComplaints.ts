/**
 * SWR Hook для списка жалоб
 * 
 * Кэширует список жалоб с возможностью фильтрации
 */

import useSWR from 'swr';
import { fetcher, swrConfig } from './useSWRConfig';

const COMPLAINTS_KEY = '/complaints/';

export interface UseComplaintsOptions {
  enabled?: boolean; // Включить/выключить запрос
}

export function useComplaints(options: UseComplaintsOptions = {}) {
  const { enabled = true } = options;

  const { data, error, isLoading, mutate } = useSWR(
    enabled ? COMPLAINTS_KEY : null, // null отключает запрос
    fetcher,
    {
      ...swrConfig,
      revalidateOnMount: true,
    }
  );

  return {
    complaints: data,
    loading: isLoading,
    error,
    mutate,
  };
}

/**
 * SWR Hook для конкретной жалобы по ID
 */
export function useComplaintById(id: string | number | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/complaints/${id}/` : null,
    fetcher,
    {
      ...swrConfig,
      revalidateOnMount: true,
    }
  );

  return {
    complaint: data,
    loading: isLoading,
    error,
    mutate,
  };
}

