import { FC } from "react";
import { IProfileData } from "@/component/type/users.interface";
import GeneralInfo from "./info-section/InfoSection";
import ApartmentsBlock from "./aportoments-section/AportSection";
import ComplaintsBlock from "./compalint-section/ComplaintsBlock";
import styles from "./UserSection.module.scss";

interface Props {
  profileData: IProfileData;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  t: (key: string) => string;
  handleDispute: (id: number, newDesc: string) => void;
  tabs: { key: string; label: string }[];
}

const UserSection: FC<Props> = ({
  profileData,
  activeTab,
  setActiveTab,
  t,
  handleDispute,
  tabs,
}) => {
  return (
    <div className={styles.userSection}>
      {/* Modern Tabs */}
      <div className={styles.tabsContainer}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`${styles.tabButton} ${activeTab === tab.key ? styles.active : styles.inactive}`}
          >
            {tab.key === "info" && (
              <svg className={styles.tabIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {tab.key === "apartments" && (
              <svg className={styles.tabIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            )}
            {tab.key === "complaints" && (
              <svg className={styles.tabIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
            {t(tab.label)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === "info" && <GeneralInfo profileData={profileData} t={t} />}
        {activeTab === "apartments" && (
          <ApartmentsBlock profileData={profileData} t={t} />
        )}
        {activeTab === "complaints" && (
          <ComplaintsBlock
            profileData={profileData}
            t={t}
            handleDispute={handleDispute}
          />
        )}
      </div>
    </div>
  );
};

export default UserSection;
