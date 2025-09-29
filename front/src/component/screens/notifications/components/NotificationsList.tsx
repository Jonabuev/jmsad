import React from 'react';
import { useTranslation } from 'next-i18next';
import { Notification } from '../../../api/notificationsApi';
import { NotificationItem } from '../../../notifications';
import NotificationsPagination from './NotificationsPagination';
import styles from './NotificationsList.module.scss';

interface NotificationsListProps {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  selectedNotifications: number[];
  onToggleSelection: (id: number) => void;
  onUpdate: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  currentPage: number;
  onPageChange: (page: number, reset: boolean) => void;
}

const NotificationsList: React.FC<NotificationsListProps> = ({
  notifications,
  loading,
  error,
  selectedNotifications,
  onToggleSelection,
  onUpdate,
  hasNext,
  hasPrevious,
  currentPage,
  onPageChange,
}) => {
  const { t } = useTranslation('common');

  if (loading) {
    return (
      <div className={styles.listContainer}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>{t('notifications.loading', 'Загрузка...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.listContainer}>
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>{error}</p>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className={styles.listContainer}>
        <div className={styles.emptyContainer}>
          <div className={styles.emptyIcon}>
            <svg className={styles.emptyIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>
            {t('notifications.empty.title', 'Нет уведомлений')}
          </h3>
          <p className={styles.emptyDescription}>
            {t('notifications.empty.description', 'У вас пока нет уведомлений')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.listContainer}>
      <div className={styles.notificationsList}>
        <div className={styles.notificationsDivider}>
          {notifications.map((notification) => (
            <div key={notification.id} className={styles.notificationItem}>
              {selectedNotifications.length > 0 && (
                <div className={styles.checkboxContainer}>
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={() => onToggleSelection(notification.id)}
                    className={styles.checkbox}
                  />
                </div>
              )}
              <div className={selectedNotifications.length > 0 ? styles.notificationWithCheckbox : styles.notificationContent}>
                <NotificationItem
                  notification={notification}
                  onUpdate={onUpdate}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Пагинация */}
        {(hasNext || hasPrevious) && (
          <NotificationsPagination
            hasNext={hasNext}
            hasPrevious={hasPrevious}
            currentPage={currentPage}
            onPageChange={onPageChange}
          />
        )}
      </div>
    </div>
  );
};

export default NotificationsList;
