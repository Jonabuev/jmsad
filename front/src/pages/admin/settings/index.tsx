import React from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import AdminLayout from '@/component/admin/AdminLayout';
import SettingsOverview from '@/component/admin/settings/SettingsOverview';
import styles from './AdminSettingsPage.module.scss';

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
