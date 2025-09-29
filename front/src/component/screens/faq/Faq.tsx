import { FC, useState } from "react";
import FaqHeroSection from "./hero-section/FaqHeroSection";
import FaqQuestionsSection from "./questions-section/FaqQuestionsSection";
import styles from "./Faq.module.scss";

const FAQ: FC = () => {
  const [activeTab, setActiveTab] = useState<'tenants' | 'landlords'>('tenants');

  return (
    <div className={styles.faq}>
      <FaqHeroSection activeTab={activeTab} onTabChange={setActiveTab} />
      <FaqQuestionsSection userType={activeTab} />
    </div>
  );
};

export default FAQ;
