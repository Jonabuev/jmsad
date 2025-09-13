import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FAQFilters {
  category?: string;
  user_type?: string;
  is_active?: string;
  search?: string;
}

interface FAQFiltersProps {
  onFilterChange: (filters: FAQFilters) => void;
  currentFilters: FAQFilters;
  onApplyFilters: (filters: FAQFilters) => void;
}

const FAQFilters: React.FC<FAQFiltersProps> = ({
  onFilterChange,
  currentFilters,
  onApplyFilters,
}) => {
  const { t } = useTranslation('common');
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FAQFilters>(currentFilters);

  const categoryOptions = [
    { value: '', label: t('admin.settings.faq.filters.all_categories') },
    { value: 'general', label: t('admin.settings.faq.categories.general') },
    { value: 'rental', label: t('admin.settings.faq.categories.rental') },
    { value: 'complaints', label: t('admin.settings.faq.categories.complaints') },
    { value: 'verification', label: t('admin.settings.faq.categories.verification') },
    { value: 'payments', label: t('admin.settings.faq.categories.payments') },
  ];

  const userTypeOptions = [
    { value: '', label: t('admin.settings.faq.filters.all_user_types') },
    { value: 'both', label: t('admin.settings.faq.user_type_both') },
    { value: 'tenants', label: t('admin.settings.faq.user_type_tenants') },
    { value: 'landlords', label: t('admin.settings.faq.user_type_landlords') },
  ];

  const statusOptions = [
    { value: '', label: t('admin.settings.faq.filters.all_statuses') },
    { value: 'true', label: t('admin.settings.faq.active') },
    { value: 'false', label: t('admin.settings.faq.inactive') },
  ];

  const handleFilterChange = (key: keyof FAQFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {};
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
    onApplyFilters(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900">
              {t('admin.settings.faq.filters.title')}
            </h3>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {isExpanded ? t('admin.settings.faq.filters.hide') : t('admin.settings.faq.filters.show')}
          </button>
        </div>

        {/* Поиск */}
        <div className="mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.settings.faq.filters.search_placeholder')}
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Расширенные фильтры */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Категория */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.settings.faq.category')}
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Тип пользователя */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.settings.faq.user_type')}
              </label>
              <select
                value={filters.user_type || ''}
                onChange={(e) => handleFilterChange('user_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {userTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Статус */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.settings.faq.is_active')}
              </label>
              <select
                value={filters.is_active || ''}
                onChange={(e) => handleFilterChange('is_active', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={handleApplyFilters}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('admin.settings.faq.filters.apply')}
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                {t('admin.settings.faq.filters.clear')}
              </button>
            )}
          </div>
        </div>

        {/* Активные фильтры */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => {
                if (!value) return null;

                let label = '';
                switch (key) {
                  case 'category':
                    const categoryOption = categoryOptions.find(opt => opt.value === value);
                    label = `Категория: ${categoryOption?.label}`;
                    break;
                  case 'user_type':
                    const userTypeOption = userTypeOptions.find(opt => opt.value === value);
                    label = `Тип: ${userTypeOption?.label}`;
                    break;
                  case 'is_active':
                    const statusOption = statusOptions.find(opt => opt.value === value);
                    label = `Статус: ${statusOption?.label}`;
                    break;
                  case 'search':
                    label = `Поиск: "${value}"`;
                    break;
                  default:
                    label = `${key}: ${value}`;
                }

                return (
                  <span
                    key={key}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {label}
                    <button
                      onClick={() => handleFilterChange(key as keyof FAQFilters, '')}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQFilters;
