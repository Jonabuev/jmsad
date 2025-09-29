import React from 'react';
import { useTranslation } from 'next-i18next';
import styles from './ActivityLogsTable.module.scss';

interface ActivityLog {
  id: number;
  user: number | null;
  user_username: string | null;
  user_email: string | null;
  action_type: string;
  action_type_display: string;
  action_description: string;
  target_object_type: string | null;
  target_object_id: number | null;
  ip_address: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

interface ActivityLogsTableProps {
  logs: ActivityLog[];
  loading: boolean;
  pagination: {
    count: number;
    next: string | null;
    previous: string | null;
    page: number;
    page_size: number;
  };
  onPageChange: (page: number) => void;
}

const ActivityLogsTable: React.FC<ActivityLogsTableProps> = ({
  logs,
  loading,
  pagination,
  onPageChange
}) => {
  const { t } = useTranslation('common');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionIcon = (actionType: string) => {
    const icons: Record<string, string> = {
      'user_register': '👤',
      'user_login': '🔑',
      'user_logout': '🚪',
      'user_ban': '🚫',
      'user_unban': '✅',
      'user_verify': '🔍',
      'user_make_admin': '👑',
      'user_remove_admin': '👤',
      'complaint_create': '📝',
      'complaint_moderate': '⚖️',
      'complaint_resolve': '✅',
      'faq_create': '❓',
      'faq_update': '✏️',
      'faq_delete': '🗑️',
      'complaint_reason_create': '📋',
      'complaint_reason_update': '✏️',
      'complaint_reason_delete': '🗑️',
      'rental_create': '🏠',
      'rental_confirm': '✅',
      'rental_reject': '❌',
      'comment_create': '💬',
      'system_error': '⚠️',
    };
    return icons[actionType] || '📋';
  };

  const getActionColor = (actionType: string) => {
    const colors: Record<string, string> = {
      'user_register': styles.actionBadgeGreen,
      'user_login': styles.actionBadgeBlue,
      'user_logout': styles.actionBadgeGray,
      'user_ban': styles.actionBadgeRed,
      'user_unban': styles.actionBadgeGreen,
      'user_verify': styles.actionBadgeBlue,
      'user_make_admin': styles.actionBadgePurple,
      'user_remove_admin': styles.actionBadgeOrange,
      'complaint_create': styles.actionBadgeOrange,
      'complaint_moderate': styles.actionBadgePurple,
      'complaint_resolve': styles.actionBadgeGreen,
      'faq_create': styles.actionBadgeIndigo,
      'faq_update': styles.actionBadgeYellow,
      'faq_delete': styles.actionBadgeRed,
      'complaint_reason_create': styles.actionBadgeIndigo,
      'complaint_reason_update': styles.actionBadgeYellow,
      'complaint_reason_delete': styles.actionBadgeRed,
      'rental_create': styles.actionBadgeBlue,
      'rental_confirm': styles.actionBadgeGreen,
      'rental_reject': styles.actionBadgeRed,
      'comment_create': styles.actionBadgeCyan,
      'system_error': styles.actionBadgeRed,
    };
    return colors[actionType] || styles.actionBadgeGray;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>{t('admin.activity.loading')}</p>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyContent}>
          <div className={styles.emptyIcon}>📋</div>
          <h3 className={styles.emptyTitle}>
            {t('admin.activity.no_logs')}
          </h3>
          <p className={styles.emptyDescription}>
            {t('admin.activity.no_logs_description')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th className={styles.tableHeader}>
                {t('admin.activity.table.action')}
              </th>
              <th className={styles.tableHeader}>
                {t('admin.activity.table.user')}
              </th>
              <th className={styles.tableHeader}>
                {t('admin.activity.table.description')}
              </th>
              <th className={styles.tableHeader}>
                {t('admin.activity.table.object')}
              </th>
              <th className={styles.tableHeader}>
                {t('admin.activity.table.ip')}
              </th>
              <th className={styles.tableHeader}>
                {t('admin.activity.table.date')}
              </th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {logs.map((log) => (
              <tr key={log.id} className={styles.tableRow}>
                <td className={styles.tableCell}>
                  <div className={styles.actionCell}>
                    <span className={styles.actionIcon}>{getActionIcon(log.action_type)}</span>
                    <span className={`${styles.actionBadge} ${getActionColor(log.action_type)}`}>
                      {log.action_type_display}
                    </span>
                  </div>
                </td>
                <td className={styles.tableCell}>
                  {log.user_username ? (
                    <div className={styles.userCell}>
                      <div className={styles.userName}>
                        {log.user_username}
                      </div>
                      <div className={styles.userEmail}>
                        {log.user_email}
                      </div>
                    </div>
                  ) : (
                    <span className={styles.systemText}>
                      {t('admin.activity.system')}
                    </span>
                  )}
                </td>
                <td className={styles.tableCellDescription}>
                  <div className={styles.descriptionCell}>
                    <div className={styles.descriptionText}>
                      {log.action_description}
                    </div>
                  </div>
                </td>
                <td className={styles.tableCell}>
                  {log.target_object_type && log.target_object_id ? (
                    <span className={styles.objectBadge}>
                      {log.target_object_type} #{log.target_object_id}
                    </span>
                  ) : (
                    <span className={styles.objectDash}>-</span>
                  )}
                </td>
                <td className={styles.tableCell}>
                  <span className={styles.ipCell}>
                    {log.ip_address || '-'}
                  </span>
                </td>
                <td className={styles.tableCell}>
                  <div className={styles.dateCell} title={new Date(log.created_at).toISOString()}>
                    {formatDate(log.created_at)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      <div className={styles.paginationContainer}>
        <div className={styles.paginationMobile}>
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={!pagination.previous}
            className={styles.paginationButtonMobile}
          >
            {t('admin.activity.pagination.previous')}
          </button>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.next}
            className={styles.paginationButtonMobile}
          >
            {t('admin.activity.pagination.next')}
          </button>
        </div>
        <div className={styles.paginationDesktop}>
          <div>
            <p className={styles.paginationInfo}>
              {t('admin.activity.pagination.showing')}{' '}
              <span className={styles.paginationInfoBold}>
                {(pagination.page - 1) * pagination.page_size + 1}
              </span>{' '}
              {t('admin.activity.pagination.to')}{' '}
              <span className={styles.paginationInfoBold}>
                {Math.min(pagination.page * pagination.page_size, pagination.count)}
              </span>{' '}
              {t('admin.activity.pagination.of')}{' '}
              <span className={styles.paginationInfoBold}>{pagination.count}</span>{' '}
              {t('admin.activity.pagination.results')}
            </p>
          </div>
          <div>
            <nav className={styles.paginationNav}>
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={!pagination.previous}
                className={styles.paginationButton}
              >
                {t('admin.activity.pagination.previous')}
              </button>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={!pagination.next}
                className={styles.paginationButton}
              >
                {t('admin.activity.pagination.next')}
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogsTable;
