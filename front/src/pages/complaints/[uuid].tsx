// pages/complaint/[uuid].tsx

import ComplaintDetailPage from "@/component/screens/complaint/ComplaintPage";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { GetServerSideProps } from "next";

export default function Complaint() {
  return <ComplaintDetailPage />;
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", ["common"])),
    },
  };
};
