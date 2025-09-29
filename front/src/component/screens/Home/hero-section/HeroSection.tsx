import { FC } from "react";
import { useTranslation } from "next-i18next";
import styles from "./HeroSection.module.scss";

const HeroSection: FC = () => {
  const { t } = useTranslation();

  return (
    <section className={styles.heroSection}>
      {/* Background Image */}
      <div 
        className={styles.backgroundImage}
        style={{
          backgroundImage: "url('/hero-img.jpg')"
        }}
      />

      {/* Overlay */}
      <div className={styles.overlay}></div>

      {/* Content */}
      <div className={styles.content}>
        <h2 className={styles.subtitle}>
          {t("hero.free_and_available")}
        </h2>
        <h1 className={styles.title}>
          {t("hero.check_potential_tenant")}
        </h1>
        <a
          href="/search"
          className={styles.ctaButton}
        >
          {t("hero.start_checking")}
        </a>
      </div>
    </section>
  );
};

export default HeroSection;
