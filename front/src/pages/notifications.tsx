import React from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import NotificationsPage from '../component/screens/notifications/NotificationsPage';

interface NotificationsPageProps {}

const NotificationsPageWrapper: React.FC<NotificationsPageProps> = () => {
  return <NotificationsPage />;
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'ru', ['common'])),
    },
  };
};

export default NotificationsPageWrapper;
