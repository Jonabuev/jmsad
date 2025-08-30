// pages/user/[username].tsx

import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import PublicUserProfile from "@/component/screens/user-profile/PublicUserProfile";
import { useRouter } from "next/router";

export default function UserProfilePage() {
  const router = useRouter();
  const { username } = router.query;

  // Показываем загрузку пока router не готов
  if (!username) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return <PublicUserProfile />;
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", ["profile", "common"])),
    },
  };
};
