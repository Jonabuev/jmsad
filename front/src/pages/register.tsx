// RegisterPage.tsx
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import dynamic from "next/dynamic";

const RegisterForm = dynamic(() => import("@/component/form/RegistorForm"), {
  ssr: false,
  loading: () => <div>Загрузка...</div>,
});

export default function RegisterPage() {
  return <RegisterForm />;
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", ["common"])),
    },
  };
};
