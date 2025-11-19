import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getComplaintReasons } from '@/api/adminApi';

interface ComplaintFilters {
  status?: string;
  search?: string;
  ordering?: string;
  reason?: number;
  user_iin_bin?: string;
}

interface ComplaintFiltersProps {
  onFilterChange: (filters: ComplaintFilters) => void;
  currentFilters: ComplaintFilters;
}

interface ComplaintReason {
  id: number;
  reason: string;
  type: 'tenant' | 'landlord';
}

export const ComplaintFilters: React.FC<ComplaintFiltersProps> = ({
  onFilterChange,
  currentFilters,
}) => {
  const { t } = useTranslation('common');
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<ComplaintFilters>(currentFilters);
  const [complaintReasons, setComplaintReasons] = useState<ComplaintReason[]>([]);
  const [loadingReasons, setLoadingReasons] = useState(true);

  const statusOptions = [
    { value: '', label: t('complaints.filters.all_statuses') },
    { value: 'pending', label: t('complaints.filters.pending') },
    { value: 'reviewed', label: t('complaints.filters.reviewed') },
    { value: 'rejected', label: t('complaints.filters.rejected') },
  ];

  const orderingOptions = [
    { value: '-created_at', label: t('complaints.filters.newest_first') },
    { value: 'created_at', label: t('complaints.filters.oldest_first') },
    { value: '-updated_at', label: t('complaints.filters.recently_updated') },
    { value: 'status', label: t('complaints.filters.by_status') },
  ];

  // Загружаем причины жалоб
  useEffect(() => {
    const fetchReasons = async () => {
      try {
        const response = await getComplaintReasons();
        setComplaintReasons(response.data);
      } catch (error) {
        console.error('Error fetching complaint reasons:', error);
      } finally {
        setLoadingReasons(false);
      }
    };

    fetchReasons();
  }, []);

  const handleFilterChange = (key: keyof ComplaintFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: ComplaintFilters = {};
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value && value !== '');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {t('complaints.filters.title')}
        </h2>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
              <span>{t('complaints.filters.clear')}</span>
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <FunnelIcon className="w-4 h-4" />
            <span>{isExpanded ? t('complaints.filters.hide_filters') : t('complaints.filters.show_filters')}</span>
          </button>
        </div>
      </div>

      {/* Поиск */}
      <div className="mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('complaints.filters.search_placeholder')}
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Расширенные фильтры */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Статус */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('complaints.filters.status')}
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Сортировка */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('complaints.filters.ordering')}
            </label>
            <select
              value={filters.ordering || '-created_at'}
              onChange={(e) => handleFilterChange('ordering', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {orderingOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* ИИН/БИН пользователя */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('complaints.filters.user_iin_bin')}
            </label>
            <input
              type="text"
              placeholder={t('complaints.filters.user_iin_bin_placeholder')}
              value={filters.user_iin_bin || ''}
              onChange={(e) => handleFilterChange('user_iin_bin', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Причина жалобы */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('complaints.filters.reason')}
            </label>
            <select
              value={filters.reason || ''}
              onChange={(e) => handleFilterChange('reason', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loadingReasons}
            >
              <option value="">{t('complaints.filters.all_reasons')}</option>
              {complaintReasons.map((reason) => (
                <option key={reason.id} value={reason.id}>
                  {reason.reason} ({reason.type === 'tenant' ? t('complaints.filters.tenant') : t('complaints.filters.landlord')})
                </option>
              ))}
            </select>
          </div>

        </div>
      )}

      {/* Активные фильтры */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            if (!value || value === '') return null;
            
            let label = '';
            switch (key) {
              case 'status':
                const statusOption = statusOptions.find(opt => opt.value === value);
                label = `Статус: ${statusOption?.label}`;
                break;
              case 'ordering':
                const orderingOption = orderingOptions.find(opt => opt.value === value);
                label = `Сортировка: ${orderingOption?.label}`;
                break;
              case 'search':
                label = `Поиск: "${value}"`;
                break;
              case 'reason':
                const reason = complaintReasons.find(r => r.id.toString() === value);
                label = `Причина: ${reason ? reason.reason : value}`;
                break;
              case 'user_iin_bin':
                label = `ИИН/БИН: ${value}`;
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
                  onClick={() => handleFilterChange(key as keyof ComplaintFilters, '')}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
