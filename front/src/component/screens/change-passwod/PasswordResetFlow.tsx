import { FC, useState } from "react";
import { useTranslation } from "next-i18next";
import { requestPasswordReset, confirmPasswordReset } from "@/api/passwordApi";
import styles from "./PasswordResetFlow.module.scss";

type Step = "email" | "code" | "newPassword" | "success";

const PasswordResetFlow: FC = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const response = await requestPasswordReset(email);
      setMessage(response.data.success);
      setStep("code");
    } catch (error: any) {
      setError(error.response?.data?.error || "Ошибка отправки кода");
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Валидация паролей
    if (newPassword !== confirmPassword) {
      setError(t("password.reset.password_mismatch") || "Пароли не совпадают");
      return;
    }
    
    if (newPassword.length < 8) {
      setError(t("password.reset.password_too_short") || "Пароль должен содержать минимум 8 символов");
      return;
    }
    
    try {
      const response = await confirmPasswordReset(email, code, newPassword);
      setMessage(response.data.success);
      setStep("success");
    } catch (error: any) {
      setError(error.response?.data?.error || "Неверный код");
    }
  };

  return (
    <div className={styles.passwordResetFlow}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {t("password.reset.title")}
          </h2>
          <p className={styles.description}>
            {t("password.reset.description")}
          </p>
        </div>

        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                {t("password.reset.email_label")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                required
              />
            </div>
            <button
              type="submit"
              className={styles.submitButton}
            >
              {t("password.reset.send_code")}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleCodeSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                {t("password.reset.code_label")}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                {t("password.reset.new_password_label")}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={styles.input}
                required
                minLength={8}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                {t("password.reset.confirm_password_label")}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              className={styles.submitButton}
            >
              {t("password.reset.change_password")}
            </button>
          </form>
        )}

        {step === "success" && (
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>
              <svg className={styles.successIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className={styles.successTitle}>
              {t("password.reset.success_title")}
            </h2>
            <p className={styles.successMessage}>{t("password.reset.success_message")}</p>
            <a
              href="/login"
              className={styles.successButton}
            >
              {t("password.reset.go_to_login")}
            </a>
          </div>
        )}

        {error && (
          <div className={styles.errorMessage}>
            <p className={styles.errorText}>{error}</p>
          </div>
        )}
        
        {message && (
          <div className={styles.successMessageContainer}>
            <p className={styles.successMessageText}>{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordResetFlow;