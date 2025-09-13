import React from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import AdminLayout from '@/component/admin/AdminLayout';
import FAQForm from '@/component/admin/settings/faq/FAQForm';

const CreateFAQPage: React.FC = () => {
  return (
    <AdminLayout>
      <FAQForm />
    </AdminLayout>
  );
};

export default CreateFAQPage;

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", ["common"])),
    },
  };
};
