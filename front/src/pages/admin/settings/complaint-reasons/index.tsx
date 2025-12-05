import React from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import dynamic from 'next/dynamic';

// ✅ Оптимизация: Ленивая загрузка тяжелых админ компонентов
const AdminLayout = dynamic(() => import('@/component/admin/AdminLayout'), {
  loading: () => <div>Загрузка...</div>,
});

const ComplaintReasonsManagement = dynamic(() => import('@/component/admin/settings/complaint-reasons/ComplaintReasonsManagement'), {
  loading: () => <div>Загрузка управления причинами жалоб...</div>,
});

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
