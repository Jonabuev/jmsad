import { FC } from "react";
import { useTranslation } from "next-i18next";
import Image from "next/image";
import styles from "./AboutSection.module.scss";

const AboutSection: FC = () => {
  const { t } = useTranslation();

  return (
    <section className={styles.aboutSection}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Logo Section */}
          <div className={styles.logoSection}>
            <Image src="/home/logo.png" alt="logo" width={420} height={105} />
          </div>

          {/* Content Section */}
          <div className={styles.contentSection}>
            <h2 className={styles.title}>
              {t("about.title")}
            </h2>
            
            <div className={styles.description}>
              <p>
                {t("about.description1")}
              </p>
              <p>
                {t("about.description2")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
