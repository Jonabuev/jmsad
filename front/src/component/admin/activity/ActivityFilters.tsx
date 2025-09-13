import React from 'react';
import { useTranslation } from 'next-i18next';

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Тип действия */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.activity.filters.action_type')}
          </label>
          <select
            value={filters.action_type}
            onChange={(e) => onFilterChange({ action_type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.activity.filters.user')}
          </label>
          <input
            type="text"
            value={filters.user}
            onChange={(e) => onFilterChange({ user: e.target.value })}
            placeholder={t('admin.activity.filters.user_placeholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Тип объекта */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.activity.filters.target_object_type')}
          </label>
          <select
            value={filters.target_object_type}
            onChange={(e) => onFilterChange({ target_object_type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.activity.filters.date_from')}
          </label>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => onFilterChange({ date_from: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {/* Дата до */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.activity.filters.date_to')}
          </label>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => onFilterChange({ date_to: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Сортировка */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.activity.filters.ordering')}
          </label>
          <select
            value={filters.ordering}
            onChange={(e) => onFilterChange({ ordering: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="-created_at">{t('admin.activity.filters.newest_first')}</option>
            <option value="created_at">{t('admin.activity.filters.oldest_first')}</option>
            <option value="action_type">{t('admin.activity.filters.by_action_type')}</option>
            <option value="-action_type">{t('admin.activity.filters.by_action_type_desc')}</option>
          </select>
        </div>

        {/* Кнопка сброса */}
        <div className="flex items-end">
          <button
            onClick={onReset}
            className="w-full px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t('admin.activity.filters.reset')}
          </button>
        </div>
      </div>

      {/* Поиск */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('admin.activity.filters.search')}
        </label>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          placeholder={t('admin.activity.filters.search_placeholder')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};

export default ActivityFilters;
