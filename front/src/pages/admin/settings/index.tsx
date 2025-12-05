import React from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import dynamic from 'next/dynamic';
import styles from './AdminSettingsPage.module.scss';

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

const SettingsOverview = dynamic(() => import('@/component/admin/settings/SettingsOverview'), {
  loading: () => (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingContent}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Загрузка настроек...</p>
      </div>
    </div>
  ),
});

const SettingsPage: React.FC = () => {
  return (
    <AdminLayout>
      <div className={styles.adminSettingsPage}>
        <SettingsOverview />
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", ["common"])),
    },
  };
};
