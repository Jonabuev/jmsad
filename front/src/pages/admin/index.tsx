import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import dynamic from "next/dynamic";
import { useAdminAuth } from "@/component/hooks/useAdminAuth";
import { useTranslation } from "next-i18next";
import styles from "./AdminPage.module.scss";

// ✅ Оптимизация: Ленивая загрузка тяжелых админ компонентов
const AdminLayout = dynamic(() => import("@/component/admin/AdminLayout"), {
  loading: () => (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingContent}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Загрузка...</p>
      </div>
    </div>
  ),
});

const AdminDashboard = dynamic(() => import("@/component/admin/dashboard/AdminDashboard"), {
  loading: () => (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingContent}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Загрузка панели управления...</p>
      </div>
    </div>
  ),
});

export default function AdminPage() {
  const { t } = useTranslation("common");
  const { isAdmin, loading, user } = useAdminAuth();

  console.log('🔍 AdminPage Debug:', { isAdmin, loading, user: user ? {
    id: user.id,
    username: user.username,
    is_superuser: user.user?.is_superuser,
  } : null });

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
          {user && (
            <div className={styles.debugInfo}>
              <p className={styles.debugInfoTitle}>Debug Info:</p>
              <p className={styles.debugInfoItem}>User ID: {user.id}</p>
              <p className={styles.debugInfoItem}>Username: {user.username}</p>
              <p className={styles.debugInfoItem}>Is Superuser: {user.user?.is_superuser ? 'true' : 'false'}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <AdminDashboard />
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
