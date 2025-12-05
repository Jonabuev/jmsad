/**
 * SWR Configuration
 * 
 * Глобальная конфигурация для SWR с настройками кэширования
 */

import { SWRConfiguration } from 'swr';
import api from '@/service/api';

/**
 * Fetcher функция для SWR
 * Использует существующий axios instance с автоматической обработкой токенов
 */
export const fetcher = async (url: string) => {
  const response = await api.get(url);
  return response.data;
};

/**
 * Fetcher с параметрами для GET запросов
 */
export const fetcherWithParams = (params: Record<string, any>) => async (url: string) => {
  const response = await api.get(url, { params });
  return response.data;
};

/**
 * Глобальная конфигурация SWR
 */
export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false, // Не обновлять при фокусе окна
  revalidateOnReconnect: true, // Обновлять при восстановлении соединения
  dedupingInterval: 2000, // Дедупликация запросов в течение 2 секунд
  focusThrottleInterval: 5000, // Троттлинг обновлений при фокусе
  errorRetryCount: 3, // Количество попыток при ошибке
  errorRetryInterval: 5000, // Интервал между попытками
  shouldRetryOnError: (error: any) => {
    // Не повторять запросы при 401/403 ошибках
    return error?.response?.status !== 401 && error?.response?.status !== 403;
  },
};

