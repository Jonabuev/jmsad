import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/component/store/store';
import { getValidAccessToken } from '@/utils/tokenUtils';
import { fetchUserProfile } from '@/component/store/auth/authSlice';

export const useAdminAuth = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { profile: user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const checkAdminAccess = async () => {
      // Проверяем, что мы на клиенте
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      console.log('🔍 AdminAuth Debug:', { 
        isAuthenticated, 
        user: user ? { 
          id: user.id, 
          username: user.username, 
          is_superuser: user.user?.is_superuser,
          role: user.user?.role 
        } : null 
      });

      // Проверяем токен
      const token = getValidAccessToken();
      if (!token) {
        console.log('❌ No valid token found, redirecting to login');
        router.push('/login');
        return;
      }

      // Если пользователь не аутентифицирован, пытаемся загрузить профиль
      if (!isAuthenticated || !user) {
        console.log('⏳ User not authenticated or not loaded, fetching profile...');
        try {
          await dispatch(fetchUserProfile());
          // После загрузки профиля, useEffect сработает снова
          return;
        } catch (error) {
          console.error('Error fetching user profile:', error);
          router.push('/login');
          return;
        }
      }

      // Проверяем права администратора
      console.log('👤 User loaded:', { 
        is_superuser: user.user?.is_superuser, 
        role: user.user?.role 
      });
      
      if (user.user?.is_superuser === true) {
        console.log('✅ User is admin, allowing access');
        setIsAdmin(true);
        setLoading(false);
      } else {
        console.log('❌ User is not admin, redirecting to profile');
        router.push('/profile');
      }
    };

    // Добавляем небольшую задержку для стабилизации состояния
    const timeoutId = setTimeout(() => {
      checkAdminAccess();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isAuthenticated, user, router, dispatch]);

  return {
    isAdmin,
    loading,
    user,
  };
};
