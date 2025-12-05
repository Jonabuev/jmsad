/**
 * SWR Hook для профиля пользователя
 * 
 * Кэширует данные профиля и автоматически обновляет их
 */

import useSWR from 'swr';
import { fetcher, swrConfig } from './useSWRConfig';
import { IProfileData } from '@/component/type/users.interface';

const PROFILE_KEY = '/profile/';

export function useUserProfile() {
  const { data, error, isLoading, mutate } = useSWR<IProfileData>(
    PROFILE_KEY,
    fetcher,
    {
      ...swrConfig,
      revalidateOnMount: true, // Всегда загружать при монтировании
    }
  );

  return {
    profile: data,
    loading: isLoading,
    error,
    mutate, // Функция для ручного обновления данных
  };
}

