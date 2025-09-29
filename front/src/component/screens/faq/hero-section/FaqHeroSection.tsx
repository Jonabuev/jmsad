import { FC } from "react";
import { useTranslation } from "next-i18next";
import styles from "./FaqHeroSection.module.scss";

interface FaqHeroSectionProps {
  activeTab: 'tenants' | 'landlords';
  onTabChange: (tab: 'tenants' | 'landlords') => void;
}

const FaqHeroSection: FC<FaqHeroSectionProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();

  return (
    <section className={styles.heroSection}>
      {/* Background decoration */}
      <div className={styles.backgroundDecoration}></div>
      <div className={styles.backgroundPattern}></div>
      
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Left side - Text content */}
          <div className={styles.textContent}>
            <h1 className={styles.title}>
              {t("faq.hero.title")}
            </h1>
            
            {/* Tabs */}
            <div className={styles.tabsContainer}>
              <button
                onClick={() => onTabChange('tenants')}
                className={`${styles.tabButton} ${
                  activeTab === 'tenants'
                    ? styles.tabButtonActive
                    : styles.tabButtonInactive
                }`}
              >
                {t("faq.hero.tenants_tab")}
              </button>
              <button
                onClick={() => onTabChange('landlords')}
                className={`${styles.tabButton} ${
                  activeTab === 'landlords'
                    ? styles.tabButtonActive
                    : styles.tabButtonInactive
                }`}
              >
                {t("faq.hero.landlords_tab")}
              </button>
            </div>
          </div>

          {/* Right side - FAQ Image */}
          <div className={styles.imageContainer}>
            <div className={styles.imageWrapper}>
              {/* Background pattern */}
              <div className={styles.imageBackground}></div>
              
              {/* FAQ Image */}
              <div className={styles.imageContent}>
                <img
                  src="/home/faq.svg"
                  alt="FAQ Illustration"
                  className={styles.faqImage}
                />
              </div>
              
              {/* Decorative elements */}
              <div className={styles.decorativeElement1}></div>
              <div className={styles.decorativeElement2}></div>
              <div className={styles.decorativeElement3}></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqHeroSection; 