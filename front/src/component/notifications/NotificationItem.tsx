import React from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { 
  Notification, 
  markNotificationAsRead, 
  getNotificationIcon, 
  getPriorityColor,
  getTypeColor 
} from '../../api/notificationsApi';

interface NotificationItemProps {
  notification: Notification;
  compact?: boolean;
  onUpdate?: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  compact = false,
  onUpdate,
}) => {
  const { t } = useTranslation('common');
  const router = useRouter();

  // Обработчик клика на уведомление
  const handleClick = async () => {
    try {
      // Отмечаем как прочитанное, если еще не прочитано
      if (!notification.is_read) {
        await markNotificationAsRead(notification.id);
        onUpdate?.();
      }

      // Переходим по ссылке, если есть
      if (notification.action_url) {
        router.push(notification.action_url);
      }
    } catch (error) {
      console.error('Ошибка при обработке уведомления:', error);
    }
  };

  // Получаем иконку и цвета
  const icon = getNotificationIcon(notification.type);
  const priorityColor = getPriorityColor(notification.priority);
  const typeColor = getTypeColor(notification.type);

  return (
    <div
      onClick={handleClick}
      className={`
        px-4 py-3 cursor-pointer transition-colors duration-200 hover:bg-gray-50
        ${!notification.is_read ? 'bg-blue-50 border-l-4 border-blue-400' : ''}
        ${compact ? 'py-2' : 'py-3'}
      `}
    >
      <div className="flex items-start space-x-3">
        {/* Иконка */}
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${typeColor}`}>
            {icon}
          </div>
        </div>

        {/* Контент */}
        <div className="flex-1 min-w-0">
          {/* Заголовок */}
          <div className="flex items-center justify-between">
            <h4 className={`
              font-medium text-gray-900 truncate
              ${!notification.is_read ? 'font-semibold' : ''}
              ${compact ? 'text-sm' : 'text-base'}
            `}>
              {notification.title}
            </h4>
            
            {/* Индикатор непрочитанного */}
            {!notification.is_read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
            )}
          </div>

          {/* Сообщение */}
          <p className={`
            text-gray-600 mt-1 line-clamp-2
            ${compact ? 'text-xs' : 'text-sm'}
          `}>
            {notification.message}
          </p>

          {/* Метаданные */}
          <div className="flex items-center justify-between mt-2">
            {/* Время */}
            <span className="text-gray-500 text-xs">
              {notification.time_ago}
            </span>

            {/* Приоритет и тип */}
            <div className="flex items-center space-x-2">
              <span className={`
                inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                ${priorityColor}
              `}>
                {notification.priority_display}
              </span>
              
              {!compact && (
                <span className="text-xs text-gray-500">
                  {notification.type_display}
                </span>
              )}
            </div>
          </div>

          {/* Кнопка действия, если есть ссылка */}
          {notification.action_url && !compact && (
            <div className="mt-2">
              <span className="text-blue-600 text-xs font-medium">
                {t('notifications.item.click_to_action', 'Нажмите для перехода')} →
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
