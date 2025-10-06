import Link from "next/link";
import { FC } from "react";
import { useTranslation } from "next-i18next";
import { useSelector } from "react-redux";
import { RootState } from "@/component/store/store";
import styles from "./CtaSection.module.scss";

const CtaSection: FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Если пользователь авторизован, не показываем секцию
  if (isAuthenticated) {
    return null;
  }

  return (
    <section
      id="cta"
      className={styles.ctaSection}
    >
      <div className={styles.container}>
        <h2 className={styles.title}>
          {t("cta.register_message_part1")}
          <br />
          {t("cta.register_message_part2")}
        </h2>

        <Link
          href="/register"
          className={styles.ctaButton}
        >
          {t("cta.register_button")}
        </Link>
        <p className={styles.loginText}>
          {t("cta.already_registered")}
          <Link
            href="/login"
            className={styles.loginLink}
          >
            {t("cta.login_link")}
          </Link>
        </p>
      </div>
    </section>
  );
};

export default CtaSection;
