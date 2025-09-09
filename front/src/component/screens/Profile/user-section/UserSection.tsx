import { FC } from "react";
import { IProfileData } from "@/component/type/users.interface";
import GeneralInfo from "./info-section/InfoSection";
import ApartmentsBlock from "./aportoments-section/AportSection";
import ComplaintsBlock from "./compalint-section/ComplaintsBlock";

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
    <div className="p-6">
      {/* Modern Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 bg-gray-50 p-2 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
              activeTab === tab.key
                ? "bg-white text-blue-600 shadow-md border border-blue-200"
                : "text-gray-600 hover:text-blue-600 hover:bg-white/50"
            }`}
          >
            {tab.key === "info" && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {tab.key === "apartments" && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            )}
            {tab.key === "complaints" && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
            {t(tab.label)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
