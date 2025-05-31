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
    <div>
      <div className="flex justify-center gap-8 border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-2 px-4 font-medium ${
              activeTab === tab.key
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-blue-600"
            }`}
          >
            {t(tab.label)}
          </button>
        ))}
      </div>

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
  );
};

export default UserSection;
