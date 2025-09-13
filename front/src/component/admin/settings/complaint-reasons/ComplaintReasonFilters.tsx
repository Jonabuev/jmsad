import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ComplaintReasonFilters {
  type?: string;
  is_default?: string;
  search?: string;
}

interface ComplaintReasonFiltersProps {
  onFilterChange: (filters: ComplaintReasonFilters) => void;
  currentFilters: ComplaintReasonFilters;
  onApplyFilters: (filters: ComplaintReasonFilters) => void;
}

const ComplaintReasonFilters: React.FC<ComplaintReasonFiltersProps> = ({
  onFilterChange,
  currentFilters,
  onApplyFilters,
}) => {
  const { t } = useTranslation('common');
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<ComplaintReasonFilters>(currentFilters);

  const typeOptions = [
    { value: '', label: t('admin.settings.complaintReasons.filters.all_types') },
    { value: 'tenant', label: t('admin.settings.complaintReasons.types.tenant') },
    { value: 'landlord', label: t('admin.settings.complaintReasons.types.landlord') },
  ];

  const defaultOptions = [
    { value: '', label: t('admin.settings.complaintReasons.filters.all_defaults') },
    { value: 'true', label: t('admin.settings.complaintReasons.default') },
    { value: 'false', label: t('admin.settings.complaintReasons.custom') },
  ];

  const handleFilterChange = (key: keyof ComplaintReasonFilters, value: string) => {
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
              {t('admin.settings.complaintReasons.filters.title')}
            </h3>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-green-600 hover:text-green-800 text-sm font-medium"
          >
            {isExpanded ? t('admin.settings.complaintReasons.filters.hide') : t('admin.settings.complaintReasons.filters.show')}
          </button>
        </div>

        {/* Поиск */}
        <div className="mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.settings.complaintReasons.filters.search_placeholder')}
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Расширенные фильтры */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Тип */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.settings.complaintReasons.type')}
              </label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* По умолчанию */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.settings.complaintReasons.is_default')}
              </label>
              <select
                value={filters.is_default || ''}
                onChange={(e) => handleFilterChange('is_default', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {defaultOptions.map((option) => (
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
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              {t('admin.settings.complaintReasons.filters.apply')}
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                {t('admin.settings.complaintReasons.filters.clear')}
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
                  case 'type':
                    const typeOption = typeOptions.find(opt => opt.value === value);
                    label = `Тип: ${typeOption?.label}`;
                    break;
                  case 'is_default':
                    const defaultOption = defaultOptions.find(opt => opt.value === value);
                    label = `По умолчанию: ${defaultOption?.label}`;
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
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                  >
                    {label}
                    <button
                      onClick={() => handleFilterChange(key as keyof ComplaintReasonFilters, '')}
                      className="ml-2 text-green-600 hover:text-green-800"
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

export default ComplaintReasonFilters;
