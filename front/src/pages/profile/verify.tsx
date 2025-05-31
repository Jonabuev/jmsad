import VerifyIdentityForm from "@/component/screens/Profile/VerifyIdentityForm";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <VerifyIdentityForm />
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", ["common"])),
    },
  };
};
