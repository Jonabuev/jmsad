import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import AdminDashboard from "@/component/admin/dashboard/AdminDashboard";
import AdminLayout from "@/component/admin/AdminLayout";
import { useAdminAuth } from "@/component/hooks/useAdminAuth";
import { useTranslation } from "next-i18next";

export default function AdminPage() {
  const { t } = useTranslation("common");
  const { isAdmin, loading, user } = useAdminAuth();

  console.log('🔍 AdminPage Debug:', { isAdmin, loading, user: user ? {
    id: user.id,
    username: user.username,
    is_superuser: user.user?.is_superuser,
    role: user.user?.role
  } : null });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("admin.accessDenied")}</h1>
          <p className="text-gray-600">{t("admin.accessDeniedMessage")}</p>
          {user && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm text-left max-w-md">
              <p><strong>Debug Info:</strong></p>
              <p>User ID: {user.id}</p>
              <p>Username: {user.username}</p>
              <p>Is Superuser: {user.user?.is_superuser ? 'true' : 'false'}</p>
              <p>Role: {user.user?.role}</p>
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
