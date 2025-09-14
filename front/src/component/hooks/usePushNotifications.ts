import { useEffect, useState, useCallback } from 'react';
import { initializePushNotifications, setupMessageListener, isNotificationSupported } from '@/utils/firebase';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
  initialize: () => Promise<boolean>;
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Проверяем поддержку при инициализации
  useEffect(() => {
    setIsSupported(isNotificationSupported());
  }, []);

  // Функция инициализации
  const initialize = useCallback(async (): Promise<boolean> => {
    if (!isSupported || isInitialized || isInitializing) {
      return isInitialized;
    }

    setIsInitializing(true);
    setError(null);

    try {
      const success = await initializePushNotifications();
      setIsInitialized(success);
      
      if (!success) {
        setError('Не удалось инициализировать push-уведомления');
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      console.error('Ошибка инициализации push-уведомлений:', err);
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [isSupported, isInitialized, isInitializing]);

  // Настраиваем слушатель сообщений при инициализации
  useEffect(() => {
    if (isInitialized && isSupported) {
      setupMessageListener((notification) => {
        console.log('Received push notification:', notification);
        
        // Показываем уведомление в браузере
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.body,
            icon: notification.icon || '/icons/notification-icon.png',
            tag: `notification-${notification.data?.notification_id || Date.now()}`,
            data: notification.data,
            requireInteraction: notification.data?.priority === 'high'
          });
        }
      });
    }
  }, [isInitialized, isSupported]);

  return {
    isSupported,
    isInitialized,
    isInitializing,
    error,
    initialize
  };
};
