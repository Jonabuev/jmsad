import { FC, useState, useEffect } from "react";
import { useTranslation } from "next-i18next";
import { getCookie } from "@/utils/cookieUtils";
import Link from "next/link";
import { requestPasswordChange, confirmPasswordChange, changePassword } from "@/api/passwordApi";
import { fetchUserProfile } from "@/api/userApi";
import styles from "./PasswordChangeFlow.module.scss";

type Step = "requestCode" | "verifyCode" | "newPassword" | "success";

const PasswordChangeFlow: FC = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("requestCode");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Получаем email пользователя при загрузке компонента
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const token = getCookie("access_token");
        if (token) {
          const response = await fetchUserProfile();
          setUserEmail(response.data.user.email || "");
        }
      } catch (error) {
        console.error("Ошибка при получении email пользователя:", error);
      }
    };
    
    fetchUserEmail();
  }, []);

  const handleRequestCode = async () => {
    setError("");
    try {
      const token = getCookie("access_token");
      const response = await requestPasswordChange(token!);
      setMessage(response.data.success);
      setStep("verifyCode");
    } catch (error: any) {
      setError(error.response?.data?.error || "Ошибка отправки кода");
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Валидация паролей
    if (newPassword !== confirmPassword) {
      setError(t("password.change.password_mismatch") || "Пароли не совпадают");
      return;
    }
    
    if (newPassword.length < 8) {
      setError(t("password.change.password_too_short") || "Пароль должен содержать минимум 8 символов");
      return;
    }
    
    try {
      const token = getCookie("access_token");
      const response = await confirmPasswordChange(code, newPassword, token!);
      setMessage(response.data.success);
      setStep("success");
    } catch (error: any) {
      setError(error.response?.data?.error || "Неверный код");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const response = await changePassword(code, newPassword);
      setMessage(response.data.message);
      setStep("success");
    } catch (error: any) {
      setError(error.response?.data?.error || "Error changing password");
    }
  };

  return (
    <div className={styles.passwordChangeFlow}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {t("password.change.title")}
          </h2>
          <p className={styles.description}>
            {t("password.change.description")}
          </p>
        </div>

        {step === "requestCode" && (
          <div className={styles.requestCodeContainer}>
            <div className={styles.requestCodeContent}>
              <div className={styles.requestIcon}>
                <svg className={styles.requestIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
                </svg>
              </div>
              <p className={styles.requestDescription}>
                {t("password.change.description")}
              </p>
              {userEmail && (
                <div className={styles.emailContainer}>
                  <p className={styles.emailLabel}>{t("password.change.emailLabel")}</p>
                  <p className={styles.emailValue}>{userEmail}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleRequestCode}
              className={styles.requestButton}
            >
              {t("password.change.send_code")}
            </button>
          </div>
        )}

        {step === "verifyCode" && (
          <form onSubmit={handleVerifyCode} className={styles.verifyCodeForm}>
            <div className={styles.verifyCodeHeader}>
              <div className={styles.verifyIcon}>
                <svg className={styles.verifyIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className={styles.verifyTitle}>
                {t("password.change.enter_code_and_password")}
              </h2>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>
                {t("password.change.code_label")}
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
                {t("password.change.new_password_label")}
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
                {t("password.change.confirm_password_label")}
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
              {t("password.change.confirm")}
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
              {t("password.change.success_title")}
            </h2>
            <p className={styles.successMessage}>
              {t("password.change.success_message")}
            </p>
            <Link
              href="/profile"
              className={styles.successButton}
            >
              {t("password.change.back_to_profile")}
            </Link>
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

export default PasswordChangeFlow;
