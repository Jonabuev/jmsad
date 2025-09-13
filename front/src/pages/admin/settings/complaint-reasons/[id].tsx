import React from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import AdminLayout from '@/component/admin/AdminLayout';
import ComplaintReasonForm from '@/component/admin/settings/complaint-reasons/ComplaintReasonForm';

const ComplaintReasonEditPage: React.FC = () => {
  return (
    <AdminLayout>
      <ComplaintReasonForm isEdit={true} />
    </AdminLayout>
  );
};

export default ComplaintReasonEditPage;

export const getServerSideProps: GetServerSideProps = async ({ locale, params }) => {
  const id = params?.id as string;
  
  return {
    props: {
      id,
      ...(await serverSideTranslations(locale ?? "ru", ["common"])),
    },
  };
};
