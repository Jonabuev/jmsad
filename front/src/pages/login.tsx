import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import dynamic from "next/dynamic";

const LoginForm = dynamic(() => import("@/component/screens/login/LoginForm"), {
  ssr: false,
  loading: () => <div>Загрузка...</div>,
});

const Login = () => {
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
