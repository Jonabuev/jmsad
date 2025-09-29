import React from 'react';
import { useTranslation } from 'next-i18next';
import styles from './NotificationsFilters.module.scss';

interface Filters {
  type: string;
  priority: string;
  is_read: string;
  days: string;
  search: string;
}

interface NotificationsFiltersProps {
  filters: Filters;
  setFilters: (filters: Filters) => void;
}

const NotificationsFilters: React.FC<NotificationsFiltersProps> = ({
  filters,
  setFilters,
}) => {
  const { t } = useTranslation('common');

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filtersGrid}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            {t('notifications.filters.type', 'Тип')}
          </label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">{t('common.all', 'Все')}</option>
            <option value="complaint_received">{t('notifications.types.complaint_received', 'Получена жалоба')}</option>
            <option value="rental_confirmed">{t('notifications.types.rental_confirmed', 'Аренда подтверждена')}</option>
            <option value="system_update">{t('notifications.types.system_update', 'Обновление системы')}</option>
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            {t('notifications.filters.priority', 'Приоритет')}
          </label>
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">{t('common.all', 'Все')}</option>
            <option value="low">{t('notifications.priority.low', 'Низкий')}</option>
            <option value="normal">{t('notifications.priority.normal', 'Обычный')}</option>
            <option value="high">{t('notifications.priority.high', 'Высокий')}</option>
            <option value="urgent">{t('notifications.priority.urgent', 'Срочный')}</option>
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            {t('notifications.filters.status', 'Статус')}
          </label>
          <select
            value={filters.is_read}
            onChange={(e) => handleFilterChange('is_read', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">{t('common.all', 'Все')}</option>
            <option value="false">{t('notifications.status.unread', 'Непрочитанные')}</option>
            <option value="true">{t('notifications.status.read', 'Прочитанные')}</option>
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            {t('notifications.filters.days', 'Период')}
          </label>
          <select
            value={filters.days}
            onChange={(e) => handleFilterChange('days', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="7">{t('notifications.period.7_days', '7 дней')}</option>
            <option value="30">{t('notifications.period.30_days', '30 дней')}</option>
            <option value="90">{t('notifications.period.90_days', '90 дней')}</option>
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            {t('common.search', 'Поиск')}
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder={t('notifications.search_placeholder', 'Поиск по уведомлениям...')}
            className={styles.filterInput}
          />
        </div>
      </div>
    </div>
  );
};

export default NotificationsFilters;
