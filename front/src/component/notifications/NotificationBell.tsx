import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'next-i18next';
import { getUnreadCount, getNotifications, Notification } from '../../api/notificationsApi';
import NotificationDropdown from './NotificationDropdown';

interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const { t } = useTranslation('common');
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Загружаем количество непрочитанных уведомлений
  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadCount();
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Ошибка загрузки количества уведомлений:', error);
    }
  };

  // Загружаем последние уведомления для dropdown
  const fetchRecentNotifications = async () => {
    try {
      setLoading(true);
      const response = await getNotifications({ page_size: 5 });
      setRecentNotifications(response.data.results);
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
    } finally {
      setLoading(false);
    }
  };

  // Загружаем данные при монтировании компонента
  useEffect(() => {
    fetchUnreadCount();
    fetchRecentNotifications();
  }, []);

  // Обновляем данные каждые 30 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Обработчик клика на колокольчик
  const handleBellClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (!isDropdownOpen) {
      fetchRecentNotifications();
    }
  };

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Обработчик обновления уведомления (например, после отметки как прочитанное)
  const handleNotificationUpdate = () => {
    fetchUnreadCount();
    fetchRecentNotifications();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Кнопка колокольчика */}
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={t('notifications.bell.aria_label', 'Уведомления')}
      >
        {/* Иконка колокольчика */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Счетчик непрочитанных */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown с уведомлениями */}
      {isDropdownOpen && (
        <NotificationDropdown
          notifications={recentNotifications}
          loading={loading}
          onNotificationUpdate={handleNotificationUpdate}
          onClose={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
