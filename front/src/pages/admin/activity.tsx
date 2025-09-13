import React from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import AdminLayout from '@/component/admin/AdminLayout';
import ActivityLogsManagement from '@/component/admin/activity/ActivityLogsManagement';

const AdminActivityPage: React.FC = () => {
  return (
    <AdminLayout>
      <ActivityLogsManagement />
    </AdminLayout>
  );
};

export default AdminActivityPage;

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", ["common"])),
    },
  };
};
