// pages/user/[username].tsx

import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import PublicUserProfile from "@/component/screens/user-profile/PublicUserProfile";

export default function UserProfilePage() {
  return <PublicUserProfile />;
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", ["profile", "common"])),
    },
  };
};
