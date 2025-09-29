import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import UserDetail from "@/component/admin/users/UserDetail";
import AdminLayout from "@/component/admin/AdminLayout";
import { useAdminAuth } from "@/component/hooks/useAdminAuth";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import styles from "./AdminUserDetailPage.module.scss";

export default function AdminUserDetailPage() {
  const { t } = useTranslation("common");
  const { isAdmin, loading } = useAdminAuth();
  const router = useRouter();
  const { id } = router.query;

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={styles.accessDeniedContainer}>
        <div className={styles.accessDeniedContent}>
          <div className={styles.accessDeniedIcon}>
            <svg className={styles.accessDeniedIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className={styles.accessDeniedTitle}>{t("admin.accessDenied")}</h1>
          <p className={styles.accessDeniedMessage}>{t("admin.accessDeniedMessage")}</p>
        </div>
      </div>
    );
  }

  if (!id || typeof id !== 'string') {
    return (
      <div className={styles.userNotFoundContainer}>
        <div className={styles.userNotFoundContent}>
          <div className={styles.userNotFoundIcon}>
            <svg className={styles.userNotFoundIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className={styles.userNotFoundTitle}>{t("admin.userNotFound")}</h1>
          <p className={styles.userNotFoundMessage}>{t("admin.userNotFoundMessage")}</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <UserDetail userId={parseInt(id)} />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", ["common"])),
    },
  };
};
