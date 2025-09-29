import { FC } from "react";
import { useTranslation } from "next-i18next";
import styles from "./PartnersSection.module.scss";

const PartnersSection: FC = () => {
  const { t } = useTranslation();

  return (
    <section className={styles.partnersSection}>
      <div className={styles.container}>
        <h2 className={styles.title}>
          {t("partners.title")}
        </h2>
        
        <div className={styles.partnersGrid}>
          {/* Partner Placeholders */}
          {[1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className={styles.partnerLogo}
            >
              <span className={styles.partnerText}>
                {t("partners.logo")} {index}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
