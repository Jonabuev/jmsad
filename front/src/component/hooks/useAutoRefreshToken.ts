import { useEffect, useRef } from 'react';
import { autoRefreshToken } from '@/utils/tokenUtils';

export const useAutoRefreshToken = (checkInterval: number = 60000) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Проверяем, что мы на клиенте
    if (typeof window === 'undefined') return;

    // Первоначальная проверка
    autoRefreshToken();

    // Устанавливаем интервал для автоматического обновления токенов
    intervalRef.current = setInterval(async () => {
      await autoRefreshToken();
    }, checkInterval); // По умолчанию каждую минуту

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkInterval]);

  return {
    refreshToken: autoRefreshToken,
  };
}; 