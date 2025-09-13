import React from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { Notification } from '../../api/notificationsApi';
import NotificationItem from './NotificationItem';

interface NotificationDropdownProps {
  notifications: Notification[];
  loading: boolean;
  onNotificationUpdate: () => void;
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  loading,
  onNotificationUpdate,
  onClose,
}) => {
  const { t } = useTranslation('common');
  const router = useRouter();

  // Переход к странице всех уведомлений
  const handleViewAll = () => {
    router.push('/notifications');
    onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      {/* Заголовок */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('notifications.dropdown.title', 'Уведомления')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            aria-label={t('common.close', 'Закрыть')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Контент */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          // Состояние загрузки
          <div className="px-4 py-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">
                {t('notifications.dropdown.loading', 'Загрузка...')}
              </span>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          // Пустое состояние
          <div className="px-4 py-6 text-center">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-gray-600 text-sm">
              {t('notifications.dropdown.empty', 'У вас нет новых уведомлений')}
            </p>
          </div>
        ) : (
          // Список уведомлений
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                compact={true}
                onUpdate={onNotificationUpdate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Футер с кнопкой "Показать все" */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleViewAll}
            className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
          >
            {t('notifications.dropdown.view_all', 'Показать все уведомления')}
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
