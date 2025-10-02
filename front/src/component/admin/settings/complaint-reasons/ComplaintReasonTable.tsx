import React from 'react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import styles from './ComplaintReasonTable.module.scss';

interface ComplaintReason {
  id: number;
  reason: string;
  reason_kz?: string;
  reason_en?: string;
  type: string;
  is_default: boolean;
  order: number;
}

interface ComplaintReasonTableProps {
  reasons: ComplaintReason[];
  loading: boolean;
  onDelete: (id: number) => void;
}

const ComplaintReasonTable: React.FC<ComplaintReasonTableProps> = ({ reasons, loading, onDelete }) => {
  const { t } = useTranslation('common');

  const getTypeLabel = (type: string) => {
    const types = {
      'tenant': t('admin.settings.complaintReasons.types.tenant'),
      'landlord': t('admin.settings.complaintReasons.types.landlord'),
    };
    return types[type as keyof typeof types] || type;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>{t('admin.settings.complaintReasons.loading')}</p>
        </div>
      </div>
    );
  }

  if (reasons.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyContent}>
          <svg className={styles.emptyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className={styles.emptyTitle}>{t('admin.settings.complaintReasons.no_reasons')}</h3>
          <p className={styles.emptyDescription}>{t('admin.settings.complaintReasons.no_reasons_description')}</p>
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
                {t('admin.settings.complaintReasons.reason')}
              </th>
              <th className={styles.tableHeader}>
                🇰🇿 KZ
              </th>
              <th className={styles.tableHeader}>
                🇺🇸 EN
              </th>
              <th className={styles.tableHeader}>
                {t('admin.settings.complaintReasons.type')}
              </th>
              <th className={styles.tableHeader}>
                {t('admin.settings.complaintReasons.is_default')}
              </th>
              <th className={styles.tableHeader}>
                {t('admin.settings.complaintReasons.order')}
              </th>
              <th className={styles.tableHeader}>
                {t('admin.settings.complaintReasons.actions')}
              </th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {reasons.map((reason) => (
              <tr key={reason.id} className={styles.tableRow}>
                <td className={`${styles.tableCell} ${styles.tableCellReason}`}>
                  <div className={styles.reasonText}>
                    {reason.reason}
                  </div>
                </td>
                <td className={styles.tableCell}>
                  {reason.reason_kz ? (
                    <span className={`${styles.languageCheck} ${styles.languageCheckPresent}`}>✅</span>
                  ) : (
                    <span className={`${styles.languageCheck} ${styles.languageCheckMissing}`}>❌</span>
                  )}
                </td>
                <td className={styles.tableCell}>
                  {reason.reason_en ? (
                    <span className={`${styles.languageCheck} ${styles.languageCheckPresent}`}>✅</span>
                  ) : (
                    <span className={`${styles.languageCheck} ${styles.languageCheckMissing}`}>❌</span>
                  )}
                </td>
                <td className={styles.tableCell}>
                  <span className={`${styles.badge} ${
                    reason.type === 'tenant' ? styles.badgeTenant : styles.badgeLandlord
                  }`}>
                    {getTypeLabel(reason.type)}
                  </span>
                </td>
                <td className={styles.tableCell}>
                  <span className={`${styles.badge} ${
                    reason.is_default ? styles.badgeDefault : styles.badgeCustom
                  }`}>
                    {reason.is_default ? t('admin.settings.complaintReasons.default') : t('admin.settings.complaintReasons.custom')}
                  </span>
                </td>
                <td className={styles.tableCell}>
                  <span className={styles.orderText}>{reason.order}</span>
                </td>
                <td className={styles.tableCell}>
                  <div className={styles.actionsContainer}>
                    <Link
                      href={`/admin/settings/complaint-reasons/${reason.id}`}
                      className={styles.editLink}
                    >
                      {t('admin.settings.complaintReasons.edit')}
                    </Link>
                    <button
                      onClick={() => onDelete(reason.id)}
                      className={styles.deleteButton}
                    >
                      {t('admin.settings.complaintReasons.delete')}
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

export default ComplaintReasonTable;
