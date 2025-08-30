import { FC } from "react";
import FaqHeroSection from "./hero-section/FaqHeroSection";
import FaqQuestionsSection from "./questions-section/FaqQuestionsSection";

const FAQ: FC = () => {
  return (
    <div className="flex flex-col bg-slate-50">
      <FaqHeroSection />
      <FaqQuestionsSection />
    </div>
  );
};

export default FAQ;
