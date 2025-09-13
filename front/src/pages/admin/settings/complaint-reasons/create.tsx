import React from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import AdminLayout from '@/component/admin/AdminLayout';
import ComplaintReasonForm from '@/component/admin/settings/complaint-reasons/ComplaintReasonForm';

const ComplaintReasonCreatePage: React.FC = () => {
  return (
    <AdminLayout>
      <ComplaintReasonForm isEdit={false} />
    </AdminLayout>
  );
};

export default ComplaintReasonCreatePage;

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", ["common"])),
    },
  };
};
