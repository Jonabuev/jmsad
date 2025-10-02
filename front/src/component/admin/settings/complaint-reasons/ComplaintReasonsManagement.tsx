import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import ComplaintReasonTable from './ComplaintReasonTable';

import { getComplaintReasons, deleteComplaintReason } from '@/api/adminApi';
import { useAdminNotifications } from '@/component/hooks/useAdminNotifications';
import ComplaintReasonFiltersComponent from './ComplaintReasonFilters';
import styles from './ComplaintReasonsManagement.module.scss';

interface ComplaintReason {
  id: number;
  reason: string;
  reason_kz?: string;
  reason_en?: string;
  type: string;
  is_default: boolean;
  order: number;
}

interface ComplaintReasonFilters {
  type?: string;
  is_default?: string;
  search?: string;
}

const ComplaintReasonsManagement: React.FC = () => {
  const { t } = useTranslation('common');
  const [reasons, setReasons] = useState<ComplaintReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ComplaintReasonFilters>({});
  const { addNotification } = useAdminNotifications();

  const fetchReasons = async (filterParams: ComplaintReasonFilters = {}) => {
    try {
      setLoading(true);
      const response = await getComplaintReasons(filterParams);
      setReasons(response.data);
    } catch (error: any) {
      console.error('Error fetching complaint reasons:', error);
      addNotification('error', t('admin.settings.complaintReasons.error_loading'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('admin.settings.complaintReasons.confirm_delete'))) {
      try {
        await deleteComplaintReason(id);
        addNotification('success', t('admin.settings.complaintReasons.deleted_successfully'));
        fetchReasons(filters);
      } catch (error: any) {
        console.error('Error deleting complaint reason:', error);
        addNotification('error', t('admin.settings.complaintReasons.error_deleting'));
      }
    }
  };

  useEffect(() => {
    fetchReasons();
  }, []);

  return (
    <div className={styles.complaintReasonsManagement}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerInfo}>
            <h1 className={styles.pageTitle}>
              {t('admin.settings.complaintReasons.title')}
            </h1>
            <p className={styles.pageSubtitle}>
              {t('admin.settings.complaintReasons.subtitle')}
            </p>
          </div>
          <Link
            href="/admin/settings/complaint-reasons/create"
            className={styles.createButton}
          >
            <svg className={styles.createButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>{t('admin.settings.complaintReasons.create')}</span>
          </Link>
        </div>
      </div>

      <ComplaintReasonFiltersComponent 
        onFilterChange={setFilters}
        currentFilters={filters}
        onApplyFilters={fetchReasons}
      />

      <ComplaintReasonTable 
        reasons={reasons}
        loading={loading}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default ComplaintReasonsManagement;
