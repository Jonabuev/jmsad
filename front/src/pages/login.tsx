import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import dynamic from "next/dynamic";
import { useGuestOnly } from "@/component/hooks/useGuestOnly";

const LoginForm = dynamic(() => import("@/component/screens/login/LoginForm"), {
  ssr: false,
  loading: () => <div>Загрузка...</div>,
});

const Login = () => {
  const { loading, isGuest } = useGuestOnly('/profile');

  // Показываем лоадер пока проверяем авторизацию
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div>Загрузка...</div>
      </div>
    );
  }

  // Если пользователь авторизован, он будет перенаправлен на профиль
  // Если не авторизован, показываем форму входа
  if (!isGuest) {
    return null; // Перенаправление в процессе
  }

  return <LoginForm />;
};

export default Login;

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", ["common"])),
    },
  };
};
