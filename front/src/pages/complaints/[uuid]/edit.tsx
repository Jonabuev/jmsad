import EditComplaintForm from "@/component/form/EditComplaintForm";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
export default function EditComplaintPage() {
  return <EditComplaintForm />;
}
export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", ["common"])), // Добавили "search" для локализации компонента
    },
  };
};
