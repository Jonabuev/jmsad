import React from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import AdminLayout from '@/component/admin/AdminLayout';
import FAQForm from '@/component/admin/settings/faq/FAQForm';

const EditFAQPage: React.FC = () => {
  return (
    <AdminLayout>
      <FAQForm isEdit={true} />
    </AdminLayout>
  );
};

export default EditFAQPage;

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", ["common"])),
    },
  };
};
