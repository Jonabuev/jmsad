import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import TenantRegistry from "@/component/screens/search/SearchPage";

export default function Search() {
  return <TenantRegistry />;
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", ["common"])), // Добавили "search" для локализации компонента
    },
  };
};
