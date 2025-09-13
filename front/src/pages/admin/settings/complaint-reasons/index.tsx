import React from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import AdminLayout from '@/component/admin/AdminLayout';
import ComplaintReasonsManagement from '@/component/admin/settings/complaint-reasons/ComplaintReasonsManagement';

const ComplaintReasonsManagementPage: React.FC = () => {
  return (
    <AdminLayout>
      <ComplaintReasonsManagement />
    </AdminLayout>
  );
};

export default ComplaintReasonsManagementPage;

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", ["common"])),
    },
  };
};
