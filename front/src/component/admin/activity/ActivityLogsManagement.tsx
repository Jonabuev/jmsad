import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import { getActivityLogs } from '@/api/adminApi';
import ActivityFilters from './ActivityFilters';
import ActivityLogsTable from './ActivityLogsTable';
import { useAdminNotifications } from '@/component/hooks/useAdminNotifications';
import { logger } from '@/utils/logger';
import styles from './ActivityLogsManagement.module.scss';

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
  metadata: Record<string, unknown>;
  created_at: string;
}

interface PaginationInfo {
  count: number;
  next: string | null;
  previous: string | null;
  page: number;
  page_size: number;
}

const ActivityLogsManagement: React.FC = () => {
  const { t } = useTranslation('common');
  const { addNotification } = useAdminNotifications();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    count: 0,
    next: null,
    previous: null,
    page: 1,
    page_size: 20
  });

  const [filters, setFilters] = useState({
    action_type: '',
    user: '',
    target_object_type: '',
    date_from: '',
    date_to: '',
    search: '',
    ordering: '-created_at'
  });

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page,
        page_size: pagination.page_size
      };
      
      const response = await getActivityLogs(params);
      setLogs(response.data.results);
      setPagination({
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous,
        page,
        page_size: pagination.page_size
      });
    } catch (error) {
      logger.error('Error fetching activity logs:', error);
      addNotification('error', t('admin.activity.error_loading'));
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page_size, addNotification, t]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handlePageChange = (page: number) => {
    fetchLogs(page);
  };

  return (
    <div className={styles.activityLogsManagement}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          {t('admin.activity.title')}
        </h1>
        <p className={styles.pageSubtitle}>
          {t('admin.activity.subtitle')}
        </p>
      </div>

      <ActivityFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={() => setFilters({
          action_type: '',
          user: '',
          target_object_type: '',
          date_from: '',
          date_to: '',
          search: '',
          ordering: '-created_at'
        })}
      />

      <ActivityLogsTable 
        logs={logs}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default ActivityLogsManagement;
