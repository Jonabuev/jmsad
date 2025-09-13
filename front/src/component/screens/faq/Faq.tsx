import { FC, useState } from "react";
import FaqHeroSection from "./hero-section/FaqHeroSection";
import FaqQuestionsSection from "./questions-section/FaqQuestionsSection";

const FAQ: FC = () => {
  const [activeTab, setActiveTab] = useState<'tenants' | 'landlords'>('tenants');

  return (
    <div className="flex flex-col bg-slate-50">
      <FaqHeroSection activeTab={activeTab} onTabChange={setActiveTab} />
      <FaqQuestionsSection userType={activeTab} />
    </div>
  );
};

export default FAQ;
