import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { checkAndCleanExpiredTokens, getValidAccessToken, isTokenExpiringSoon, autoRefreshToken } from '@/utils/tokenUtils';

export const useTokenValidation = () => {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Проверяем, что мы на клиенте
    if (typeof window === 'undefined') return;

    const checkAndRefreshTokens = async () => {
      // Проверяем токены при загрузке
      checkAndCleanExpiredTokens();
      
      const token = getValidAccessToken();
      if (!token) {
        // Если нет валидного токена, перенаправляем на логин
        // Но только если мы не на страницах логина/регистрации и не на защищенных страницах
        // Для защищенных страниц пусть сами компоненты решают, что делать
        if (router.pathname !== '/login' && 
            router.pathname !== '/register' && 
            router.pathname !== '/search' && 
            router.pathname !== '/profile') {
          console.log('No valid token found, redirecting to login');
          router.push('/login');
        }
        return;
      }

      // Проверяем, не истекает ли токен в ближайшие 5 минут
      if (isTokenExpiringSoon(token, 5)) {
        console.log('Токен истекает в ближайшие 5 минут');
        // Автоматически обновляем токен
        await autoRefreshToken();
      }
    };

    // Добавляем небольшую задержку для восстановления Redux состояния
    const timeoutId = setTimeout(() => {
      checkAndRefreshTokens();
    }, 100);

    // Устанавливаем интервал для периодической проверки токенов (каждые 5 минут)
    intervalRef.current = setInterval(async () => {
      checkAndCleanExpiredTokens();
      
      const currentToken = getValidAccessToken();
      if (!currentToken) {
        // Если токен стал невалидным, перенаправляем на логин
        // Но только если мы не на защищенных страницах
        if (router.pathname !== '/login' && 
            router.pathname !== '/register' && 
            router.pathname !== '/search' && 
            router.pathname !== '/profile') {
          console.log('Token became invalid during interval check, redirecting to login');
          router.push('/login');
        }
      } else {
        // Проверяем, нужно ли обновить токен
        if (isTokenExpiringSoon(currentToken, 5)) {
          await autoRefreshToken();
        }
      }
    }, 5 * 60 * 1000); // 5 минут

    return () => {
      clearTimeout(timeoutId);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [router]);

  return {
    isValidToken: !!getValidAccessToken(),
  };
}; 