import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { 
  getNotificationPermission, 
  isNotificationSupported,
  sendTestPushNotification 
} from '@/utils/firebase';
import { usePushNotifications } from '@/component/hooks/usePushNotifications';

interface PushNotificationPromptProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  showTestButton?: boolean;
}

const PushNotificationPrompt: React.FC<PushNotificationPromptProps> = ({
  onPermissionGranted,
  onPermissionDenied,
  showTestButton = false
}) => {
  const { t } = useTranslation('common');
  const { isSupported, isInitialized, isInitializing, error, initialize } = usePushNotifications();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (isSupported) {
      const currentPermission = getNotificationPermission();
      setPermission(currentPermission);
      
      // Показываем prompt только если разрешение не предоставлено и не инициализировано
      setShowPrompt(currentPermission === 'default' && !isInitialized);
    }
  }, [isSupported, isInitialized]);

  // Обновляем разрешение при инициализации
  useEffect(() => {
    if (isInitialized) {
      setPermission('granted');
      setShowPrompt(false);
      onPermissionGranted?.();
    }
  }, [isInitialized, onPermissionGranted]);

  const handleRequestPermission = async () => {
    if (!isSupported) {
      alert(t('notifications.push_prompt.not_supported'));
      return;
    }

    try {
      const success = await initialize();
      
      if (success) {
        setPermission('granted');
        setShowPrompt(false);
        onPermissionGranted?.();
      } else {
        setPermission('denied');
        onPermissionDenied?.();
      }
    } catch (error) {
      console.error('Ошибка запроса разрешения:', error);
      setPermission('denied');
      onPermissionDenied?.();
    }
  };

  const handleTestNotification = async () => {
    setIsTestLoading(true);
    
    try {
      await sendTestPushNotification();
    } catch (error) {
      console.error('Ошибка отправки тестового уведомления:', error);
    } finally {
      setIsTestLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  // Не показываем компонент, если уведомления не поддерживаются
  if (!isSupported) {
    return null;
  }

  // Не показываем prompt, если уже есть разрешение или пользователь отклонил
  if (!showPrompt || permission !== 'default') {
    return (
      <div className="flex items-center gap-2">
        {permission === 'granted' && (
          <div className="flex items-center gap-2 text-green-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">{t('notifications.push_prompt.enabled')}</span>
          </div>
        )}
        
        {permission === 'denied' && (
          <div className="flex items-center gap-2 text-red-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">{t('notifications.push_prompt.disabled')}</span>
          </div>
        )}
        
        {showTestButton && permission === 'granted' && (
          <button
            onClick={handleTestNotification}
            disabled={isTestLoading}
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isTestLoading ? t('common.loading') : t('notifications.push_prompt.test')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {t('notifications.push_prompt.enable_title')}
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            {t('notifications.push_prompt.enable_description')}
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleRequestPermission}
              disabled={isInitializing}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isInitializing ? t('common.loading') : t('notifications.push_prompt.enable')}
            </button>
            
            <button
              onClick={handleDismiss}
              className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
            >
              {t('notifications.push_prompt.later')}
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PushNotificationPrompt;
