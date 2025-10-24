import HeroSection from "./hero-section/HeroSection";
import { FC } from "react";
import AboutSection from "./about-section/AboutSection";
import FeaturesSection from "./key-section/KeySection";
import PartnersSection from "./partners-section/PartnersSection";
import CtaSection from "./cta-section/CtaSection";
import styles from "./Home.module.scss";

const HomePage: FC = () => {
  return (
    <div className={styles.homePage}>
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      {/* <PartnersSection /> */}
      <CtaSection />
    </div>
  );
};

export default HomePage;
