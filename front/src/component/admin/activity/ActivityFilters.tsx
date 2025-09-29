import React from 'react';
import { useTranslation } from 'next-i18next';
import styles from './ActivityFilters.module.scss';

interface ActivityFiltersProps {
  filters: {
    action_type: string;
    user: string;
    target_object_type: string;
    date_from: string;
    date_to: string;
    search: string;
    ordering: string;
  };
  onFilterChange: (filters: Partial<ActivityFiltersProps['filters']>) => void;
  onReset: () => void;
}

const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  filters,
  onFilterChange,
  onReset
}) => {
  const { t } = useTranslation('common');

  const actionTypes = [
    { value: 'user_register', label: t('admin.activity.actions.user_register') },
    { value: 'user_login', label: t('admin.activity.actions.user_login') },
    { value: 'user_logout', label: t('admin.activity.actions.user_logout') },
    { value: 'user_ban', label: t('admin.activity.actions.user_ban') },
    { value: 'user_unban', label: t('admin.activity.actions.user_unban') },
    { value: 'user_verify', label: t('admin.activity.actions.user_verify') },
    { value: 'user_make_admin', label: t('admin.activity.actions.user_make_admin') },
    { value: 'user_remove_admin', label: t('admin.activity.actions.user_remove_admin') },
    { value: 'complaint_create', label: t('admin.activity.actions.complaint_create') },
    { value: 'complaint_moderate', label: t('admin.activity.actions.complaint_moderate') },
    { value: 'complaint_resolve', label: t('admin.activity.actions.complaint_resolve') },
    { value: 'faq_create', label: t('admin.activity.actions.faq_create') },
    { value: 'faq_update', label: t('admin.activity.actions.faq_update') },
    { value: 'faq_delete', label: t('admin.activity.actions.faq_delete') },
    { value: 'complaint_reason_create', label: t('admin.activity.actions.complaint_reason_create') },
    { value: 'complaint_reason_update', label: t('admin.activity.actions.complaint_reason_update') },
    { value: 'complaint_reason_delete', label: t('admin.activity.actions.complaint_reason_delete') },
    { value: 'rental_create', label: t('admin.activity.actions.rental_create') },
    { value: 'rental_confirm', label: t('admin.activity.actions.rental_confirm') },
    { value: 'rental_reject', label: t('admin.activity.actions.rental_reject') },
    { value: 'comment_create', label: t('admin.activity.actions.comment_create') },
    { value: 'system_error', label: t('admin.activity.actions.system_error') },
  ];

  const objectTypes = [
    { value: 'customuser', label: t('admin.activity.object_types.user') },
    { value: 'rentalcomplaint', label: t('admin.activity.object_types.complaint') },
    { value: 'faq', label: t('admin.activity.object_types.faq') },
    { value: 'complaintreason', label: t('admin.activity.object_types.complaint_reason') },
    { value: 'rental', label: t('admin.activity.object_types.rental') },
    { value: 'comment', label: t('admin.activity.object_types.comment') },
  ];

  return (
    <div className={styles.filtersCard}>
      <div className={styles.filtersGrid}>
        {/* Тип действия */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            {t('admin.activity.filters.action_type')}
          </label>
          <select
            value={filters.action_type}
            onChange={(e) => onFilterChange({ action_type: e.target.value })}
            className={styles.filterSelect}
          >
            <option value="">{t('admin.activity.filters.all_types')}</option>
            {actionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Пользователь */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            {t('admin.activity.filters.user')}
          </label>
          <input
            type="text"
            value={filters.user}
            onChange={(e) => onFilterChange({ user: e.target.value })}
            placeholder={t('admin.activity.filters.user_placeholder')}
            className={styles.filterInput}
          />
        </div>

        {/* Тип объекта */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            {t('admin.activity.filters.target_object_type')}
          </label>
          <select
            value={filters.target_object_type}
            onChange={(e) => onFilterChange({ target_object_type: e.target.value })}
            className={styles.filterSelect}
          >
            <option value="">{t('admin.activity.filters.all_objects')}</option>
            {objectTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Дата от */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            {t('admin.activity.filters.date_from')}
          </label>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => onFilterChange({ date_from: e.target.value })}
            className={styles.filterInput}
          />
        </div>
      </div>

      <div className={styles.filtersGridSecond}>
        {/* Дата до */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            {t('admin.activity.filters.date_to')}
          </label>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => onFilterChange({ date_to: e.target.value })}
            className={styles.filterInput}
          />
        </div>

        {/* Сортировка */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            {t('admin.activity.filters.ordering')}
          </label>
          <select
            value={filters.ordering}
            onChange={(e) => onFilterChange({ ordering: e.target.value })}
            className={styles.filterSelect}
          >
            <option value="-created_at">{t('admin.activity.filters.newest_first')}</option>
            <option value="created_at">{t('admin.activity.filters.oldest_first')}</option>
            <option value="action_type">{t('admin.activity.filters.by_action_type')}</option>
            <option value="-action_type">{t('admin.activity.filters.by_action_type_desc')}</option>
          </select>
        </div>

        {/* Кнопка сброса */}
        <div className={styles.resetButtonContainer}>
          <button
            onClick={onReset}
            className={styles.resetButton}
          >
            {t('admin.activity.filters.reset')}
          </button>
        </div>
      </div>

      {/* Поиск */}
      <div className={styles.searchSection}>
        <label className={styles.searchLabel}>
          {t('admin.activity.filters.search')}
        </label>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          placeholder={t('admin.activity.filters.search_placeholder')}
          className={styles.searchInput}
        />
      </div>
    </div>
  );
};

export default ActivityFilters;
