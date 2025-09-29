import React from 'react';
import { useTranslation } from 'next-i18next';
import { Notification } from '../../../api/notificationsApi';
import styles from './NotificationsStats.module.scss';

interface NotificationsStatsProps {
  totalCount: number;
  unreadCount: number;
  notifications: Notification[];
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

const NotificationsStats: React.FC<NotificationsStatsProps> = ({
  totalCount,
  unreadCount,
  notifications,
  selectedCount,
  onSelectAll,
  onDeselectAll,
}) => {
  const { t } = useTranslation('common');

  return (
    <div className={styles.statsContainer}>
      <div className={styles.statsContent}>
        <div className={styles.statsInfo}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>
              {t('notifications.stats.total', 'Всего')}:
            </span>
            <span className={styles.statValue}>{totalCount}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>
              {t('notifications.stats.unread', 'Непрочитанные')}:
            </span>
            <span className={styles.unreadValue}>{unreadCount}</span>
          </div>
        </div>
        
        {notifications.length > 0 && (
          <div className={styles.selectionControls}>
            <button
              onClick={selectedCount === notifications.length ? onDeselectAll : onSelectAll}
              className={styles.selectButton}
            >
              {selectedCount === notifications.length 
                ? t('common.deselect_all', 'Снять выбор') 
                : t('common.select_all', 'Выбрать все')
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsStats;
