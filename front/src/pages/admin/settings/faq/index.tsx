import React from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import dynamic from 'next/dynamic';

// ✅ Оптимизация: Ленивая загрузка тяжелых админ компонентов
const AdminLayout = dynamic(() => import('@/component/admin/AdminLayout'), {
  loading: () => <div>Загрузка...</div>,
});

const FAQManagement = dynamic(() => import('@/component/admin/settings/faq/FAQManagement'), {
  loading: () => <div>Загрузка управления FAQ...</div>,
});

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
