import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { fetchRentalComplaintByUuid, disputeRentalComplaint } from "@/api/complaintsApi";
import { getCookie } from "@/utils/cookieUtils";
import FileUploadDropzone from "@/component/ui/FileUploadDropzone";
import styles from "./DisputeComplaint.module.scss";

export default function DisputeComplaintPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { uuid } = router.query;

  const [explanation, setExplanation] = useState("");
  const [evidence, setEvidence] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [complaintData, setComplaintData] = useState<any>(null);
  const [userId, setUserId] = useState<number | null>(null);
    
    useEffect(() => {
    const fetchComplaint = async () => {
        // Проверяем, что мы на клиенте
        if (typeof window === 'undefined') return;

        const token = getCookie("access_token");
        if (!token || !uuid) return;

        try {
            const token = getCookie("access_token");
            if (!token) throw new Error("No token");

            const payload = JSON.parse(atob(token.split(".")[1]));
            setUserId(payload.user_id);
            } catch (err) {
            console.error("Ошибка получения user_id из токена", err);
            setMessage(t("dispute.disputeFailed") || "Ошибка авторизации.");
        }

        const response = await fetchRentalComplaintByUuid(uuid as string, token);
        setComplaintData(response.data);
    };

    if (uuid) fetchComplaint();
    }, [uuid]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    
    const formData = new FormData();
    formData.append("explanation", explanation);
    if (evidence) formData.append("evidence", evidence);
    if (!complaintData) return;

    
    if (complaintData.status !== "reviewed") {
    setMessage(t("dispute.disputeWrongStatus") || "Жалобу можно оспорить только после рассмотрения.");
    setLoading(false);
    return;
    }


    const userDisputes = complaintData.disputes.filter((d: any) => d.user === userId);
    if (userDisputes.length >= 2) {
    setMessage(t("dispute.disputeLimit") || "Вы уже оспаривали эту жалобу 2 раза.");
    setLoading(false);
    return;
    }

    try {
      const token = getCookie("access_token");
      await disputeRentalComplaint(uuid as string, formData, token!);
      setMessage(t("dispute.disputeSuccess") || "Успешно отправлено!");
      setTimeout(() => {
        router.push("/profile");
      }, 2000);
    } catch (err: any) {
      const errorText =
        err?.response?.data?.error || t("dispute.disputeFailed") || "Ошибка при отправке";
      setMessage(errorText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.disputeComplaint}>
      <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.headerSection}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>
              <svg className={styles.headerIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className={styles.headerTitle}>{t("dispute.disputeTitle")}</h1>
            <div className={styles.warningBox}>
              <div className={styles.warningContent}>
                <svg className={styles.warningIcon} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className={styles.warningText}>
                  {t("dispute.desc") || "Пояснение"}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div className={`${styles.message} ${
              message.includes("Успешно") || message.includes("success") 
                ? styles.messageSuccess
                : styles.messageError
            }`}>
              <div className={styles.messageContent}>
                {message.includes("Успешно") || message.includes("success") ? (
                  <svg className={`${styles.messageIcon} ${styles.messageIconSuccess}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className={`${styles.messageIcon} ${styles.messageIconError}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <p className={`${styles.messageText} ${
                  message.includes("Успешно") || message.includes("success") 
                    ? styles.messageTextSuccess
                    : styles.messageTextError
                }`}>
                  {message}
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Explanation Card */}
            <div className={`${styles.formCard} ${styles.formCardExplanation}`}>
              <div className={styles.explanationSection}>
                <div className={styles.explanationIcon}>
                  <svg className={styles.explanationIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className={styles.explanationContent}>
                  <label className={styles.explanationLabel}>
                    {t("dispute.disputeExplanation") || "Пояснение"}
                  </label>
                  <textarea
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    required
                    className={styles.explanationTextarea}
                    placeholder={t("dispute.placeholder")}
                    rows={5}
                  />
                </div>
              </div>
            </div>

            {/* Evidence Card */}
            <div className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <div className={`${styles.formCardIcon} ${styles.formCardIconOrange}`}>
                  <svg className={styles.formCardIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className={styles.formCardTitle}>{t("dispute.disputeEvidence") || "Документ / Изображение (необязательно)"}</h3>
              </div>
              
              <FileUploadDropzone
                accept=".pdf,.jpg,.jpeg,.png,image/*"
                multiple={false}
                maxFiles={1}
                maxSizeMB={10}
                onFilesChange={(files) => {
                  if (files.length > 0) {
                    setEvidence(files[0]);
                  } else {
                    setEvidence(null);
                  }
                }}
                currentFiles={evidence ? [evidence] : []}
                hint={t("dispute.uploadEvidenceFormats")}
                showPreview={true}
                previewType="document"
              />
            </div>

            {/* Submit Button */}
            <div className={styles.submitSection}>
              <button
                type="submit"
                disabled={loading}
                className={`${styles.submitButton} ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading ? (
                  <>
                    <svg className={styles.submitButtonSpinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t("dispute.loading")}
                  </>
                ) : (
                  <>
                    <svg className={styles.submitButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    {t("dispute.disputeSubmit")}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
