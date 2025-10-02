import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import FAQTable from './FAQTable';
import FAQFiltersComponent from './FAQFilters';
import { getFAQ, deleteFAQ } from '@/api/adminApi';
import { useAdminNotifications } from '@/component/hooks/useAdminNotifications';
import styles from './FAQManagement.module.scss';

interface FAQ {
  id: number;
  question_ru: string;
  answer_ru: string;
  question_kz?: string;
  answer_kz?: string;
  question_en?: string;
  answer_en?: string;
  category: string;
  user_type: string;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
  created_by_username: string;
}

interface FAQFilters {
  category?: string;
  user_type?: string;
  is_active?: string;
  search?: string;
}

const FAQManagement: React.FC = () => {
  const { t } = useTranslation('common');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FAQFilters>({});
  const { addNotification } = useAdminNotifications();

  const fetchFAQs = async (filterParams: FAQFilters = {}) => {
    try {
      setLoading(true);
      const response = await getFAQ(filterParams);
      setFaqs(response.data);
    } catch (error: any) {
      console.error('Error fetching FAQs:', error);
      addNotification('error', t('admin.settings.faq.error_loading'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('admin.settings.faq.confirm_delete'))) {
      try {
        await deleteFAQ(id);
        addNotification('success', t('admin.settings.faq.deleted_successfully'));
        fetchFAQs(filters);
      } catch (error: any) {
        console.error('Error deleting FAQ:', error);
        addNotification('error', t('admin.settings.faq.error_deleting'));
      }
    }
  };

  useEffect(() => {
    fetchFAQs();
  }, []);

  return (
    <div className={styles.faqManagement}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerInfo}>
            <h1 className={styles.pageTitle}>
              {t('admin.settings.faq.title')}
            </h1>
            <p className={styles.pageSubtitle}>
              {t('admin.settings.faq.subtitle')}
            </p>
          </div>
          <Link
            href="/admin/settings/faq/create"
            className={styles.createButton}
          >
            <svg className={styles.createButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>{t('admin.settings.faq.create')}</span>
          </Link>
        </div>
      </div>

      <FAQFiltersComponent 
        onFilterChange={setFilters}
        currentFilters={filters}
        onApplyFilters={fetchFAQs}
      />

      <FAQTable 
        faqs={faqs}
        loading={loading}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default FAQManagement;
