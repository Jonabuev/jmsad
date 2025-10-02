import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import styles from './FAQFilters.module.scss';

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
    <div className={styles.filtersContainer}>
      <div className={styles.filtersCard}>
        <div className={styles.filtersHeader}>
          <div className={styles.filtersHeaderContent}>
            <FunnelIcon className={styles.filtersIcon} />
            <h3 className={styles.filtersTitle}>
              {t('admin.settings.faq.filters.title')}
            </h3>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={styles.toggleButton}
          >
            {isExpanded ? t('admin.settings.faq.filters.hide') : t('admin.settings.faq.filters.show')}
          </button>
        </div>

        {/* Поиск */}
        <div className={styles.searchSection}>
          <div className={styles.searchContainer}>
            <MagnifyingGlassIcon className={styles.searchIcon} />
            <input
              type="text"
              placeholder={t('admin.settings.faq.filters.search_placeholder')}
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Расширенные фильтры */}
        {isExpanded && (
          <div className={styles.advancedFilters}>
            {/* Категория */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                {t('admin.settings.faq.category')}
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className={styles.filterSelect}
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Тип пользователя */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                {t('admin.settings.faq.user_type')}
              </label>
              <select
                value={filters.user_type || ''}
                onChange={(e) => handleFilterChange('user_type', e.target.value)}
                className={styles.filterSelect}
              >
                {userTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Статус */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                {t('admin.settings.faq.is_active')}
              </label>
              <select
                value={filters.is_active || ''}
                onChange={(e) => handleFilterChange('is_active', e.target.value)}
                className={styles.filterSelect}
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
        <div className={styles.actionsContainer}>
          <div className={styles.actionsButtons}>
            <button
              onClick={handleApplyFilters}
              className={styles.applyButton}
            >
              {t('admin.settings.faq.filters.apply')}
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className={styles.clearButton}
              >
                {t('admin.settings.faq.filters.clear')}
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
                    className={styles.activeFilterBadge}
                  >
                    {label}
                    <button
                      onClick={() => handleFilterChange(key as keyof FAQFilters, '')}
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

export default FAQFilters;
