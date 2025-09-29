import React, { useEffect, useState } from "react";
import { IProfile } from "@/component/type/users.interface";
import { useTranslation } from "next-i18next";
import { fetchUserProfile, verifyIdentity } from "@/api/userApi";
import styles from "./VerifyIdentityForm.module.scss";

const VerifyIdentityForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<IProfile | null>(null);
  const { t } = useTranslation("common");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      // Проверяем, что мы на клиенте
      if (typeof window === 'undefined') return;

      const token = localStorage.getItem("access_token");
      if (!token) return;
      try {
        const response = await fetchUserProfile();
        setProfile(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке профиля:", error);
      }
    };
    fetchProfileData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Вы не авторизованы.");
      setLoading(false);
      return;
    }

    if (!file) {
      setError("Пожалуйста, выберите файл.");
      setLoading(false);
      return;
    }

    const user = profile?.user;
    if (!user || !user.username ) {
      setError("Ошибка: данные пользователя не загружены.");
      setLoading(false);
      return;
    }

    const textsToFind = [user.username, user.identifier];

    const formData = new FormData();
    formData.append("id_document", file);
    formData.append("texts_to_find", JSON.stringify(textsToFind));
    formData.append("passport_expiry", user.passport_expiry || "");
    formData.append("document_type", user.document_type || "");
    if (user.document_type === "visa" && user.visa_number) {
      formData.append("visa_number", user.visa_number);
    }

    try {
      const response = await verifyIdentity(formData, token);
      setMessage(response.data.message || "Успешно отправлено!");
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Ошибка при верификации документа."
      );
      console.error("Ошибка сервера:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.verifyIdentityForm}>
      <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.headerSection}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>
              <svg className={styles.headerIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className={styles.headerTitle}>{t("verify.identityVerification")}</h2>
            <p className={styles.headerDescription}>
              Загрузите документ для верификации вашей личности и получения доступа ко всем функциям платформы
            </p>
          </div>

          {/* Verification Status */}
          {profile?.user && (
            <div className={styles.verificationStatus}>
              <div className={styles.statusHeader}>
                <div className={styles.statusIcon}>
                  <svg className={styles.statusIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className={styles.statusTitle}>Информация о пользователе</h3>
              </div>
              <div className={styles.statusGrid}>
                <div className={styles.statusItem}>
                  <p className={styles.statusLabel}>Имя пользователя:</p>
                  <p className={styles.statusValue}>{profile.user.username}</p>
                </div>
                <div className={styles.statusItem}>
                  <p className={styles.statusLabel}>ИИН:</p>
                  <p className={styles.statusValue}>{profile.user.identifier}</p>
                </div>
                <div className={styles.statusItem}>
                  <p className={styles.statusLabel}>Тип документа:</p>
                  <p className={styles.statusValue}>{profile.user.document_type || 'Не указан'}</p>
                </div>
                <div className={styles.statusItem}>
                  <p className={styles.statusLabel}>Статус верификации:</p>
                  <span className={`${styles.statusBadge} ${
                    profile.user.is_verified 
                      ? styles.statusBadgeVerified
                      : styles.statusBadgeUnverified
                  }`}>
                    <span className={`${styles.statusBadgeDot} ${
                      profile.user.is_verified ? styles.statusBadgeDotVerified : styles.statusBadgeDotUnverified
                    }`}></span>
                    {profile.user.is_verified ? 'Верифицирован' : 'Не верифицирован'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {message && (
            <div className={`${styles.notification} ${styles.notificationSuccess}`}>
              <div className={styles.notificationContent}>
                <div className="flex-shrink-0">
                  <svg className={`${styles.notificationIcon} ${styles.notificationIconSuccess}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className={`${styles.notificationText} ${styles.notificationTextSuccess}`}>{message}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className={`${styles.notification} ${styles.notificationError}`}>
              <div className={styles.notificationContent}>
                <div className="flex-shrink-0">
                  <svg className={`${styles.notificationIcon} ${styles.notificationIconError}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className={`${styles.notificationText} ${styles.notificationTextError}`}>{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Document Upload */}
            <div className={styles.uploadSection}>
              <div className={styles.uploadHeader}>
                <div className={styles.uploadIcon}>
                  <svg className={styles.uploadIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className={styles.uploadTitle}>Загрузка документа</h3>
              </div>
              
              <div className={styles.uploadArea}>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className={styles.uploadInput}
                  id="document-upload"
                />
                <label htmlFor="document-upload" className={styles.uploadLabel}>
                  <svg className={styles.uploadIconLarge} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className={styles.uploadText}>
                    <span className={styles.uploadTextLink}>Нажмите для загрузки</span> или перетащите файл сюда
                  </p>
                  <p className={styles.uploadSubtext}>PNG, JPG, JPEG, PDF до 10MB</p>
                  {file && (
                    <div className={styles.uploadFileInfo}>
                      <p className={styles.uploadFileName}>
                        ✓ Выбран файл: {file.name}
                      </p>
                      <p className={styles.uploadFileSize}>
                        Размер: {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Instructions */}
            <div className={styles.instructionsSection}>
              <div className={styles.instructionsContent}>
                <div className="flex-shrink-0">
                  <svg className={styles.instructionsIcon} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className={styles.instructionsText}>
                  <h4 className={styles.instructionsTitle}>Инструкции по загрузке:</h4>
                  <ul className={styles.instructionsList}>
                    <li className={styles.instructionsItem}>• Убедитесь, что документ четко читается</li>
                    <li className={styles.instructionsItem}>• Поддерживаемые форматы: PNG, JPG, JPEG, PDF</li>
                    <li className={styles.instructionsItem}>• Максимальный размер файла: 10MB</li>
                    <li className={styles.instructionsItem}>• Документ должен содержать ваши данные: {profile?.user?.username} и {profile?.user?.identifier}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className={styles.submitSection}>
              <button
                type="submit"
                disabled={loading || !file}
                className={styles.submitButton}
              >
                {loading ? (
                  <>
                    <svg className={styles.submitButtonSpinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Отправка документа...
                  </>
                ) : (
                  <>
                    <svg className={styles.submitButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Отправить документ
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyIdentityForm;
