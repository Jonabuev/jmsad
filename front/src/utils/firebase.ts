import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { FCMToken } from '@/types/notifications';

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "your-app-id"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Инициализация Firebase Messaging
let messaging: any = null;

// Проверяем, что мы в браузере и поддерживается Service Worker
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error('Firebase Messaging initialization error:', error);
  }
}

// Интерфейс для уведомлений
export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    type: string;
    priority: string;
    notification_id: number;
    action_url?: string;
    timestamp: string;
  };
}

// Функция для получения FCM токена
export const getFCMToken = async (): Promise<string | null> => {
  if (!messaging) {
    console.warn('Firebase Messaging не инициализирован');
    return null;
  }

  try {
    // Проверяем, есть ли Service Worker
    if ('serviceWorker' in navigator) {
      // Регистрируем Service Worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker зарегистрирован:', registration);
    }

    // Запрашиваем разрешение на уведомления
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Получаем токен
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'your-vapid-key'
      });
      
      if (token) {
        console.log('FCM токен получен:', token);
        return token;
      } else {
        console.warn('Не удалось получить FCM токен');
        return null;
      }
    } else {
      console.warn('Разрешение на уведомления не предоставлено:', permission);
      return null;
    }
  } catch (error) {
    console.error('Ошибка получения FCM токена:', error);
    return null;
  }
};

// Функция для регистрации FCM токена на сервере
export const registerFCMToken = async (token: string, deviceType: string = 'web'): Promise<FCMToken | null> => {
  try {
    const response = await fetch('/api/fcm/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({
        token,
        device_type: deviceType,
        device_info: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screen: {
            width: window.screen.width,
            height: window.screen.height
          }
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('FCM токен зарегистрирован:', data);
      return data.token;
    } else {
      console.error('Ошибка регистрации FCM токена:', response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Ошибка регистрации FCM токена:', error);
    return null;
  }
};

// Функция для удаления FCM токена с сервера
export const unregisterFCMToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/fcm/unregister/${token}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    if (response.ok) {
      console.log('FCM токен удален');
      return true;
    } else {
      console.error('Ошибка удаления FCM токена:', response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Ошибка удаления FCM токена:', error);
    return false;
  }
};

// Функция для прослушивания входящих сообщений
export const onMessageListener = (): Promise<PushNotificationData> => {
  return new Promise((resolve) => {
    if (!messaging) {
      resolve({
        title: '',
        body: '',
        data: {
          type: '',
          priority: '',
          notification_id: 0,
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    onMessage(messaging, (payload) => {
      console.log('Получено сообщение:', payload);
      
      const notification: PushNotificationData = {
        title: payload.notification?.title || '',
        body: payload.notification?.body || '',
        icon: payload.notification?.icon,
        badge: (payload.notification as any)?.badge,
        data: payload.data as any
      };
      
      resolve(notification);
    });
  });
};

// Функция для проверки поддержки уведомлений
export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 
         'Notification' in window && 
         'serviceWorker' in navigator;
};

// Функция для проверки разрешения на уведомления
export const getNotificationPermission = (): NotificationPermission => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  
  return Notification.permission;
};

// Функция для инициализации push уведомлений
export const initializePushNotifications = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    console.warn('Push уведомления не поддерживаются в этом браузере');
    return false;
  }

  try {
    // Получаем FCM токен
    const token = await getFCMToken();
    
    if (token) {
      // Регистрируем токен на сервере
      const registered = await registerFCMToken(token);
      
      if (registered) {
        console.log('Push уведомления успешно инициализированы');
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Ошибка инициализации push уведомлений:', error);
    return false;
  }
};

// Функция для отправки тестового push уведомления
export const sendTestPushNotification = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/fcm/test/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    if (response.ok) {
      console.log('Тестовое push уведомление отправлено');
      return true;
    } else {
      console.error('Ошибка отправки тестового push уведомления:', response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Ошибка отправки тестового push уведомления:', error);
    return false;
  }
};

export { messaging };
