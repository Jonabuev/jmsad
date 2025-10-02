import React from 'react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import styles from './FAQTable.module.scss';

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

interface FAQTableProps {
  faqs: FAQ[];
  loading: boolean;
  onDelete: (id: number) => void;
}

const FAQTable: React.FC<FAQTableProps> = ({ faqs, loading, onDelete }) => {
  const { t } = useTranslation('common');

  const getCategoryLabel = (category: string) => {
    const categories = {
      'general': t('admin.settings.faq.categories.general'),
      'rental': t('admin.settings.faq.categories.rental'),
      'complaints': t('admin.settings.faq.categories.complaints'),
      'verification': t('admin.settings.faq.categories.verification'),
      'payments': t('admin.settings.faq.categories.payments'),
    };
    return categories[category as keyof typeof categories] || category;
  };

  const getUserTypeLabel = (userType: string) => {
    const types = {
      'both': t('admin.settings.faq.user_type_both'),
      'tenants': t('admin.settings.faq.user_type_tenants'),
      'landlords': t('admin.settings.faq.user_type_landlords'),
    };
    return types[userType as keyof typeof types] || userType;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>{t('admin.settings.faq.loading')}</p>
        </div>
      </div>
    );
  }

  if (faqs.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyContent}>
          <svg className={styles.emptyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className={styles.emptyTitle}>{t('admin.settings.faq.no_faq')}</h3>
          <p className={styles.emptyDescription}>{t('admin.settings.faq.no_faq_description')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th className={styles.tableHeader}>
                {t('admin.settings.faq.question')}
              </th>
              <th className={styles.tableHeader}>
                🇰🇿 KZ
              </th>
              <th className={styles.tableHeader}>
                🇺🇸 EN
              </th>
              <th className={styles.tableHeader}>
                {t('admin.settings.faq.category')}
              </th>
              <th className={styles.tableHeader}>
                {t('admin.settings.faq.user_type')}
              </th>
              <th className={styles.tableHeader}>
                {t('admin.settings.faq.is_active')}
              </th>
              <th className={styles.tableHeader}>
                {t('admin.settings.faq.order')}
              </th>
              <th className={styles.tableHeader}>
                {t('admin.settings.faq.actions')}
              </th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {faqs.map((faq) => (
              <tr key={faq.id} className={styles.tableRow}>
                <td className={`${styles.tableCell} ${styles.tableCellQuestion}`}>
                  <div className={styles.questionText}>
                    {faq.question_ru}
                  </div>
                </td>
                <td className={styles.tableCell}>
                  {faq.question_kz ? (
                    <span className={`${styles.languageCheck} ${styles.languageCheckPresent}`}>✅</span>
                  ) : (
                    <span className={`${styles.languageCheck} ${styles.languageCheckMissing}`}>❌</span>
                  )}
                </td>
                <td className={styles.tableCell}>
                  {faq.question_en ? (
                    <span className={`${styles.languageCheck} ${styles.languageCheckPresent}`}>✅</span>
                  ) : (
                    <span className={`${styles.languageCheck} ${styles.languageCheckMissing}`}>❌</span>
                  )}
                </td>
                <td className={styles.tableCell}>
                  <span className={`${styles.badge} ${styles.badgeCategory}`}>
                    {getCategoryLabel(faq.category)}
                  </span>
                </td>
                <td className={styles.tableCell}>
                  <span className={`${styles.badge} ${styles.badgeUserType}`}>
                    {getUserTypeLabel(faq.user_type)}
                  </span>
                </td>
                <td className={styles.tableCell}>
                  <span className={`${styles.badge} ${faq.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                    {faq.is_active ? t('admin.settings.faq.active') : t('admin.settings.faq.inactive')}
                  </span>
                </td>
                <td className={styles.tableCell}>
                  <span className={styles.orderText}>{faq.order}</span>
                </td>
                <td className={styles.tableCell}>
                  <div className={styles.actionsContainer}>
                    <Link
                      href={`/admin/settings/faq/${faq.id}`}
                      className={styles.editLink}
                    >
                      {t('admin.settings.faq.edit')}
                    </Link>
                    <button
                      onClick={() => onDelete(faq.id)}
                      className={styles.deleteButton}
                    >
                      {t('admin.settings.faq.delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FAQTable;
