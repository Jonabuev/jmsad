// pages/user/[username].tsx

import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import PublicUserProfile from "@/component/screens/user-profile/PublicUserProfile";
import { useRouter } from "next/router";
import styles from "@/component/screens/user-profile/PublicUserProfile.module.scss";

export default function UserProfilePage() {
  const router = useRouter();
  const { username } = router.query;

  // Показываем загрузку пока router не готов
  if (!username) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Загрузка...</p>
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
