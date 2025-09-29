import React from 'react';
import { useTranslation } from 'next-i18next';
import styles from './NotificationsHeader.module.scss';

interface NotificationsHeaderProps {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  selectedCount: number;
  onBulkDelete: () => void;
  onMarkAllAsRead: () => void;
}

const NotificationsHeader: React.FC<NotificationsHeaderProps> = ({
  showFilters,
  setShowFilters,
  selectedCount,
  onBulkDelete,
  onMarkAllAsRead,
}) => {
  const { t } = useTranslation('common');

  return (
    <div className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>
            {t('notifications.page.title', 'Уведомления')}
          </h1>
          <p className={styles.subtitle}>
            {t('notifications.page.subtitle', 'Управляйте своими уведомлениями')}
          </p>
        </div>
        
        {/* Действия */}
        <div className={styles.actions}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={styles.filterButton}
          >
            {showFilters ? t('common.hide_filters', 'Скрыть фильтры') : t('common.show_filters', 'Показать фильтры')}
          </button>
          
          {selectedCount > 0 && (
            <button
              onClick={onBulkDelete}
              className={styles.deleteButton}
            >
              {t('notifications.actions.delete_selected', 'Удалить выбранные')} ({selectedCount})
            </button>
          )}
          
          <button
            onClick={onMarkAllAsRead}
            className={styles.markReadButton}
          >
            {t('notifications.actions.mark_all_read', 'Отметить все как прочитанные')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationsHeader;
