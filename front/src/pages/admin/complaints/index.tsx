import React from 'react';
import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ComplaintManagementWrapper from '@/component/admin/complaints/ComplaintManagementWrapper';
import { useAdminAuth } from '@/component/hooks/useAdminAuth';
import AdminLayout from '@/component/admin/AdminLayout';

const AdminComplaintsPage: React.FC = () => {
  const { t } = useTranslation('common');
  useAdminAuth();

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {t('complaints.title')}
            </h1>
            <p className="mt-2 text-gray-600">
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
