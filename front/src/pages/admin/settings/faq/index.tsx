import React from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import AdminLayout from '@/component/admin/AdminLayout';
import FAQManagement from '@/component/admin/settings/faq/FAQManagement';

const FAQManagementPage: React.FC = () => {
  return (
    <AdminLayout>
      <FAQManagement />
    </AdminLayout>
  );
};

export default FAQManagementPage;

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", ["common"])),
    },
  };
};
