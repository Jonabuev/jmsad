import { FC, useState } from "react";
import { useTranslation } from "next-i18next";

import EmailDocumentsTab from "./EmailDocumentsTab";
import styles from "./PDFCheckTabs.module.scss";
import ManualUploadTab from "./ManualUploadTab";

type TabType = "manual" | "email";

const PDFCheckTabs: FC = () => {
  const { t } = useTranslation("common");
  const [activeTab, setActiveTab] = useState<TabType>("manual");

  const tabs = [
    {
      id: "manual" as TabType,
      label: t("pdfCheck.manualUpload"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
    },
    {
      id: "email" as TabType,
      label: t("pdfCheck.emailDocuments"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className={styles.tabsContainer}>
      {/* Tab Headers */}
      <div className={styles.tabsHeader}>
        <div className={styles.tabsList}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${styles.tabButton} ${
                activeTab === tab.id ? styles.tabButtonActive : ""
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === "manual" && <ManualUploadTab />}
        {activeTab === "email" && <EmailDocumentsTab />}
      </div>
    </div>
  );
};

export default PDFCheckTabs;