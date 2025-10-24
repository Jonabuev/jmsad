import { FC } from "react";
import { useTranslation } from "next-i18next";
import styles from "./KeySection.module.scss";
import FeatureCard from "./feature-card/FeatureCard";

const FeaturesSection: FC = () => {
  const { t } = useTranslation();

  return (
    <section
      id="features"
      className={styles.featuresSection}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {t("features.title")}
          </h2>
          <p className={styles.subtitle}>
            {t("features.subtitle")}
          </p>
        </div>
        
        <div className={styles.grid}>
          <div className={styles.cardWrapper}>
            <FeatureCard
              imageSrc="url('/home/reaster.png')"
              title={t("features.registry")}
              description={t("features.registry_description")}
              link="/search"
            />
          </div>
          {/* <div className={styles.cardWrapper}>
            <FeatureCard
              imageSrc="url('/home/maps.png')"
              title={t("features.maps")}
              description={t("features.maps_description")}
              link="/rental-catalog"
            />
          </div> */}
          <div className={styles.cardWrapper}>
            <FeatureCard
              imageSrc="url('/home/help.png')"
              title={t("features.help")}
              description={t("features.help_description")}
              link="/faq"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
