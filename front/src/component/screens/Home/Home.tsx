import HeroSection from "./hero-section/HeroSection";
import { FC } from "react";
import FeaturesSection from "./key-section/KeySection";
import CtaSection from "./cta-section/CtaSection";

const HomePage: FC = () => {
  return (
    <div className="flex flex-col bg-slate-50">
      <HeroSection />
      <FeaturesSection />
      <CtaSection />
    </div>
  );
};

export default HomePage;
