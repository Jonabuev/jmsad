import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { RootState } from '@/component/store/store';
import { getValidAccessToken } from '@/utils/tokenUtils';

/**
 * Хук для защиты страниц, которые должны быть доступны только неавторизованным пользователям
 * (например, страницы логина и регистрации)
 * 
 * Если пользователь уже авторизован, он будет перенаправлен на страницу профиля
 */
export const useGuestOnly = (redirectTo: string = '/profile') => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  
  const { profile, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const checkAuth = () => {
      // Проверяем, что мы на клиенте
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      // Проверяем токен
      const token = getValidAccessToken();
      
      // Если есть валидный токен или пользователь авторизован в Redux
      if (token || isAuthenticated || profile) {
        // Перенаправляем на страницу профиля или указанную страницу
        router.push(redirectTo);
        setIsGuest(false);
      } else {
        // Пользователь не авторизован - можно показать страницу
        setIsGuest(true);
      }
      
      setLoading(false);
    };

    // Добавляем небольшую задержку для стабилизации состояния
    const timeoutId = setTimeout(() => {
      checkAuth();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [router, redirectTo, isAuthenticated, profile]);

  return {
    loading,
    isGuest,
  };
};

