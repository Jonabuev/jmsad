import React, { useEffect, useState } from "react";
import { IProfile } from "@/component/type/users.interface";
import { useTranslation } from "next-i18next";
import { fetchUserProfile, verifyIdentity } from "@/api/userApi";
import { getCookie } from "@/utils/cookieUtils";
import FileUploadDropzone from "@/component/ui/FileUploadDropzone";
import styles from "./VerifyIdentityForm.module.scss";

interface VerificationDetails {
  total_found?: number;
  min_required?: number;
  field_matches?: Record<string, boolean>;
  missing_fields?: string[];
  identifier_match?: boolean;
  expiry_match?: boolean;
  found_dates?: string[];
}

interface ErrorResponse {
  error?: string;
  details?: string;
  verification_details?: VerificationDetails;
  suggestions?: string[];
  type?: string;
}

const VerifyIdentityForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [verificationDetails, setVerificationDetails] =
    useState<VerificationDetails | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<IProfile | null>(null);
  const { t } = useTranslation("common");

  const handleFilesChange = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    } else {
      setFile(null);
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      if (typeof window === "undefined") return;

      const token = getCookie("access_token");
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
    setErrorDetails(null);
    setVerificationDetails(null);
    setSuggestions([]);

    const token = getCookie("access_token");
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
    if (!user || !user.username) {
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
      console.error("Ошибка сервера:", err.response?.data);

      const errorData: ErrorResponse = err.response?.data || {};

      const mainError =
        errorData.details ||
        errorData.error ||
        "Ошибка при верификации документа.";
      setError(mainError);

      if (errorData.details && errorData.details !== mainError) {
        setErrorDetails(errorData.details);
      } else if (errorData.error && errorData.error !== mainError) {
        setErrorDetails(errorData.error);
      }

      if (errorData.verification_details) {
        setVerificationDetails(errorData.verification_details);
      }

      if (errorData.suggestions && errorData.suggestions.length > 0) {
        setSuggestions(errorData.suggestions);
      }
    } finally {
      setLoading(false);
    }
  };

  const getFieldNameRu = (fieldName: string): string => {
    const fieldNames: Record<string, string> = {
      last_name: t("verify.last_name"),
      first_name: t("verify.first_name"),
      thirdname: t("verify.thirdname"),
      identifier: t("verify.identifier"),
      username: t("verify.username"),
    };
    return fieldNames[fieldName] || fieldName;
  };

  return (
    <div className={styles.verifyIdentityForm}>
      <div className={styles.container}>
        <div className={styles.headerSection}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>
              <svg
                className={styles.headerIconSvg}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className={styles.headerTitle}>
              {t("verify.identityVerification")}
            </h2>
            <p className={styles.headerDescription}>
              {t("verify.formDescription")}
            </p>
          </div>

          {/* Verification Status */}
          {profile?.user && (
            <div className={styles.verificationStatus}>
              <div className={styles.statusHeader}>
                <div className={styles.statusIcon}>
                  <svg
                    className={styles.statusIconSvg}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className={styles.statusTitle}>{t("verify.userInfo")}</h3>
              </div>
              <div className={styles.statusGrid}>
                <div className={styles.statusItem}>
                  <p className={styles.statusLabel}>
                    {t("verify.usernameLabel")}
                  </p>
                  <p className={styles.statusValue}>{profile.user.username}</p>
                </div>
                <div className={styles.statusItem}>
                  <p className={styles.statusLabel}>{t("verify.iinLabel")}</p>
                  <p className={styles.statusValue}>
                    {profile.user.identifier}
                  </p>
                </div>
                <div className={styles.statusItem}>
                  <p className={styles.statusLabel}>
                    {t("verify.documentTypeLabel")}
                  </p>
                  <p className={styles.statusValue}>
                    {profile.user.document_type || "Не указан"}
                  </p>
                </div>
                <div className={styles.statusItem}>
                  <p className={styles.statusLabel}>
                    {t("verify.verificationStatusLabel")}
                  </p>
                  <span
                    className={`${styles.statusBadge} ${
                      profile.user.is_verified
                        ? styles.statusBadgeVerified
                        : styles.statusBadgeUnverified
                    }`}
                  >
                    <span
                      className={`${styles.statusBadgeDot} ${
                        profile.user.is_verified
                          ? styles.statusBadgeDotVerified
                          : styles.statusBadgeDotUnverified
                      }`}
                    ></span>
                    {profile.user.is_verified
                      ? t("verify.verified")
                      : t("verify.notVerified")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {message && (
            <div
              className={`${styles.notification} ${styles.notificationSuccess}`}
            >
              <div className={styles.notificationContent}>
                <div className="flex-shrink-0">
                  <svg
                    className={`${styles.notificationIcon} ${styles.notificationIconSuccess}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p
                    className={`${styles.notificationText} ${styles.notificationTextSuccess}`}
                  >
                    {message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div
              className={`${styles.notification} ${styles.notificationError}`}
            >
              <div className={styles.notificationContent}>
                <div className="flex-shrink-0">
                  <svg
                    className={`${styles.notificationIcon} ${styles.notificationIconError}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p
                    className={`${styles.notificationText} ${styles.notificationTextError}`}
                  >
                    {error}
                  </p>

                  {errorDetails && (
                    <p className={`${styles.notificationDetails} mt-2 text-sm`}>
                      <strong>{t("verify.details")}</strong> {errorDetails}
                    </p>
                  )}

                  {verificationDetails && (
                    <div className="mt-3 text-sm">
                      <p className="font-semibold mb-1">
                        {t("verify.resultsTitle")}
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        {verificationDetails.total_found !== undefined &&
                          verificationDetails.min_required !== undefined && (
                            <li>{t("verify.filesFound")}</li>
                          )}

                        {verificationDetails.field_matches &&
                          Object.keys(verificationDetails.field_matches)
                            .length > 0 && (
                            <li>
                              {t("verify.fieldStatus")}
                              <ul className="list-none ml-4 mt-1">
                                {Object.entries(
                                  verificationDetails.field_matches
                                ).map(([field, found]) => (
                                  <li key={field}>
                                    {found ? "✓" : "✗"} {getFieldNameRu(field)}
                                  </li>
                                ))}
                              </ul>
                            </li>
                          )}

                        {verificationDetails.identifier_match !== undefined && (
                          <li>
                            {t("verify.iinLabel")}
                            {verificationDetails.identifier_match
                              ? t("verify.iinFound")
                              : t("verify.iinNotFound")}
                          </li>
                        )}

                        {verificationDetails.expiry_match !== undefined && (
                          <li>
                            {t("verify.dateExpiry")}
                            {verificationDetails.expiry_match
                              ? t("verify.expiryMatches")
                              : t("verify.expiryDoesNotMatch")}
                          </li>
                        )}

                        {verificationDetails.found_dates &&
                          verificationDetails.found_dates.length > 0 && (
                            <li>
                              {t("verify.foundDates")}
                              {verificationDetails.found_dates.join(", ")}
                            </li>
                          )}
                      </ul>
                    </div>
                  )}

                  {/* Рекомендации */}
                  {suggestions.length > 0 && (
                    <div className="mt-3">
                      <p className="font-semibold text-sm mb-1">
                        {t("verify.recommendations")}
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.uploadSection}>
              <div className={styles.uploadHeader}>
                <div className={styles.uploadIcon}>
                  <svg
                    className={styles.uploadIconSvg}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className={styles.uploadTitle}>
                  {t("verify.uploadDocument")}
                </h3>
              </div>

              <FileUploadDropzone
                accept="image/*,.pdf"
                multiple={false}
                maxFiles={1}
                maxSizeMB={10}
                onFilesChange={handleFilesChange}
                currentFiles={file ? [file] : []}
                hint={t("verify.uploadHint")}
                showPreview={true}
                previewType="document"
                error={error || ""}
                onError={setError}
              />
            </div>

            <div className={styles.instructionsSection}>
              <div className={styles.instructionsContent}>
                <div className="flex-shrink-0">
                  <svg
                    className={styles.instructionsIcon}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className={styles.instructionsText}>
                  <h4 className={styles.instructionsTitle}>
                    {t("verify.instructionsTitle")}
                  </h4>
                  <ul className={styles.instructionsList}>
                    <li className={styles.instructionsItem}>
                      <strong>{t("verify.important")}</strong>{" "}
                      {t("verify.bothSidesRequired")}
                    </li>
                    <li className={styles.instructionsItem}>
                      • {t("verify.ensureReadable")}
                    </li>
                    <li className={styles.instructionsItem}>
                      • {t("verify.supportedFormats")}
                    </li>
                    <li className={styles.instructionsItem}>
                      • {t("verify.maxFileSize")}
                    </li>
                    <li className={styles.instructionsItem}>
                      •{" "}
                      {t("verify.mustContainData", {
                        username: profile?.user?.username,
                        identifier: profile?.user?.identifier,
                      })}
                    </li>
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
                    <svg
                      className={styles.submitButtonSpinner}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {t("verify.uploading")}
                  </>
                ) : (
                  <>
                    <svg
                      className={styles.submitButtonIcon}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {t("verify.sendDocument")}
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
