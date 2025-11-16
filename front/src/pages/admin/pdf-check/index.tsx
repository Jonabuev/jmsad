import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import AdminLayout from "@/component/admin/AdminLayout";
import PDFCheckTabs from "@/component/admin/pdf-check/PDFCheckTabs";
import styles from "./PDFCheckPage.module.scss";

const PDFCheckPage = () => {
  const { t } = useTranslation("common");

  return (
    <AdminLayout>
      <div className={styles.pdfCheckPage}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t("pdfCheck.pageTitle")}
          </h1>
          <p className={styles.pageSubtitle}>
            {t("pdfCheck.pageSubtitle")}
          </p>
        </div>

        {/* Tabs Component */}
        <PDFCheckTabs />
      </div>
    </AdminLayout>
  );
};

export default PDFCheckPage;

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", ["common"])),
    },
  };
};