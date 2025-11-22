// RegisterPage.tsx
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import dynamic from "next/dynamic";
import { useGuestOnly } from "@/component/hooks/useGuestOnly";

const RegisterForm = dynamic(() => import("@/component/form/RegistorForm"), {
  ssr: false,
  loading: () => <div>Загрузка...</div>,
});

export default function RegisterPage() {
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
  // Если не авторизован, показываем форму регистрации
  if (!isGuest) {
    return null; // Перенаправление в процессе
  }

  return <RegisterForm />;
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", ["common"])),
    },
  };
};
