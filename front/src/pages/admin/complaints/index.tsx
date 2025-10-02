import React from 'react';
import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ComplaintManagementWrapper from '@/component/admin/complaints/ComplaintManagementWrapper';
import { useAdminAuth } from '@/component/hooks/useAdminAuth';
import AdminLayout from '@/component/admin/AdminLayout';
import styles from './AdminComplaintsPage.module.scss';

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
