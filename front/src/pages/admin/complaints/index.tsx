import React from 'react';
import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import dynamic from 'next/dynamic';
import { useAdminAuth } from '@/component/hooks/useAdminAuth';
import styles from './AdminComplaintsPage.module.scss';

// ✅ Оптимизация: Ленивая загрузка тяжелых админ компонентов
const AdminLayout = dynamic(() => import('@/component/admin/AdminLayout'), {
  loading: () => (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingContent}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Загрузка...</p>
      </div>
    </div>
  ),
});

const ComplaintManagementWrapper = dynamic(() => import('@/component/admin/complaints/ComplaintManagementWrapper'), {
  loading: () => (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingContent}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Загрузка управления жалобами...</p>
      </div>
    </div>
  ),
});

const AdminComplaintsPage: React.FC = () => {
  const { t } = useTranslation('common');
  useAdminAuth();

  return (
    <AdminLayout>
      <div className={styles.adminComplaintsPage}>
        <div className={styles.container}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>
              {t('complaints.title')}
            </h1>
            <p className={styles.pageSubtitle}>
              {t('complaints.subtitle')}
            </p>
          </div>
          
          <ComplaintManagementWrapper />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminComplaintsPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {
      ...(await serverSideTranslations(context.locale ?? 'ru', ['common'])),
    },
  };
};
