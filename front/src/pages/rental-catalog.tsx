import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import dynamic from "next/dynamic";

// Динамическая загрузка компонента
const RentalCatalog = dynamic(
  () => import("@/component/screens/rental-catalog/RentalCatalog"),
  {
    ssr: false,
    loading: () => <div>Загрузка...</div>, // Индикатор загрузки
  }
);

export default function RentalPage() {
  return <RentalCatalog />;
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", ["common"])), // Переводы для страницы
    },
  };
};
