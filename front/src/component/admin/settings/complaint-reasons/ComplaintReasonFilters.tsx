import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import styles from './ComplaintReasonFilters.module.scss';

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
    <div className={styles.filtersContainer}>
      <div className={styles.filtersCard}>
        <div className={styles.filtersHeader}>
          <div className={styles.filtersHeaderContent}>
            <FunnelIcon className={styles.filtersIcon} />
            <h3 className={styles.filtersTitle}>
              {t('admin.settings.complaintReasons.filters.title')}
            </h3>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={styles.toggleButton}
          >
            {isExpanded ? t('admin.settings.complaintReasons.filters.hide') : t('admin.settings.complaintReasons.filters.show')}
          </button>
        </div>

        {/* Поиск */}
        <div className={styles.searchSection}>
          <div className={styles.searchContainer}>
            <MagnifyingGlassIcon className={styles.searchIcon} />
            <input
              type="text"
              placeholder={t('admin.settings.complaintReasons.filters.search_placeholder')}
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Расширенные фильтры */}
        {isExpanded && (
          <div className={styles.advancedFilters}>
            {/* Тип */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                {t('admin.settings.complaintReasons.type')}
              </label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className={styles.filterSelect}
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* По умолчанию */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                {t('admin.settings.complaintReasons.is_default')}
              </label>
              <select
                value={filters.is_default || ''}
                onChange={(e) => handleFilterChange('is_default', e.target.value)}
                className={styles.filterSelect}
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
        <div className={styles.actionsContainer}>
          <div className={styles.actionsButtons}>
            <button
              onClick={handleApplyFilters}
              className={styles.applyButton}
            >
              {t('admin.settings.complaintReasons.filters.apply')}
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className={styles.clearButton}
              >
                {t('admin.settings.complaintReasons.filters.clear')}
              </button>
            )}
          </div>
        </div>

        {/* Активные фильтры */}
        {hasActiveFilters && (
          <div className={styles.activeFiltersSection}>
            <div className={styles.activeFiltersList}>
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
                    className={styles.activeFilterBadge}
                  >
                    {label}
                    <button
                      onClick={() => handleFilterChange(key as keyof ComplaintReasonFilters, '')}
                      className={styles.removeFilterButton}
                    >
                      <XMarkIcon className={styles.removeFilterIcon} />
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
