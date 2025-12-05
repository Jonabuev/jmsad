import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import dynamic from 'next/dynamic';

// ✅ Оптимизация: Ленивая загрузка тяжелого Profile компонента
const Profile = dynamic(() => import("@/component/screens/Profile/Profile"), {
  loading: () => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '50vh',
      fontSize: '18px',
      color: '#6b7280'
    }}>
      Загрузка профиля...
    </div>
  ),
  ssr: false, // Profile использует клиентские хуки и не нужен для SSR
});

const ProfilePage = () => {
  return <Profile />;
};

export default ProfilePage;

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'ru', ['common'])),
    },
  };
};
