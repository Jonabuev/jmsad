import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { getCookie } from "@/utils/cookieUtils";
import { fetchRentalComplaintByUuid, fetchComplaintReasons, updateRentalComplaint } from "@/api/complaintsApi";
import FileUploadDropzone from "@/component/ui/FileUploadDropzone";
import styles from "./EditComplaintForm.module.scss";

interface ComplaintReason {
  id: number;
  reason: string;
  reason_kz?: string;
  reason_en?: string;
  type: string;
}

interface Accused {
  role: "tenant" | "landlord";
}

interface ComplaintData {
  description: string;
  reason: number[];
  evidence: File | null;
  damage_cost: string;
  is_court_case: boolean;
  court_decision_score: string | null;
  accused: Accused;
}

const EditComplaintForm: React.FC = () => {
  const router = useRouter();
  const { uuid } = router.query;
  const { t } = useTranslation();

  // Хелпер для получения переведенного текста причины
  const getReasonText = (reason: ComplaintReason): string => {
    const locale = router.locale || 'ru';
    if (locale === 'kz' && reason.reason_kz) return reason.reason_kz;
    if (locale === 'en' && reason.reason_en) return reason.reason_en;
    return reason.reason;
  };
  const [complaintReasons, setComplaintReasons] = useState<ComplaintReason[]>([]);
  const [accusedRole, setAccusedRole] = useState<"tenant" | "landlord" | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    reason: [] as number[],
    evidence: null as File | null,
    evidenceImages: [] as File[],
    damageCost: "",
    isCourtCase: false,
    courtDocument: null as File | null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Загрузка данных жалобы
  useEffect(() => {
    const token = getCookie("access_token");
    if (!token || typeof uuid !== "string") {
      setErrorMessage(t("Scomplaint.authRequired"));
      setLoadError(true);
      setIsLoading(false);
      return;
    }
    fetchRentalComplaintByUuid(uuid, token)
      .then((res) => {
        const data: ComplaintData = res.data;
        setFormData({
          description: data.description || "",
          reason: (data.reason || []).map(Number),
          evidence: null,
          evidenceImages: [],
          damageCost: data.damage_cost || "",
          isCourtCase: !!data.court_decision_score,
          courtDocument: null,
        });
        setAccusedRole(data.accused.role);
      })
      .catch(() => {
        setLoadError(true);
        setErrorMessage(t("Scomplaint.loadEditError"));
      })
      .finally(() => setIsLoading(false));
  }, [uuid, t]);

  // Загрузка причин (загружаем ВСЕ причины без фильтрации по type)
  useEffect(() => {
    const token = getCookie("access_token");
    if (!token) {
      setErrorMessage(t("Scomplaint.authRequired"));
      return;
    }
    const locale = router.locale || 'ru';
    console.log("EditForm: Loading complaint reasons with locale:", locale);
    // НЕ передаем type - загружаем все причины
    fetchComplaintReasons(token, locale, undefined)
      .then((res) => {
        console.log("EditForm: Complaint reasons loaded:", res.data);
        if (Array.isArray(res.data)) {
          setComplaintReasons(res.data);
          console.log(`EditForm: Total reasons loaded: ${res.data.length}`);
          console.log(`EditForm: Tenant reasons: ${res.data.filter(r => r.type === 'tenant').length}`);
          console.log(`EditForm: Landlord reasons: ${res.data.filter(r => r.type === 'landlord').length}`);
        } else {
          console.error("EditForm: Invalid data format:", res.data);
          setErrorMessage(t("Scomplaint.invalidDataFormat"));
        }
      })
      .catch((error) => {
        console.error("EditForm: Error loading complaint reasons:", error);
        setLoadError(true);
        setErrorMessage(t("Scomplaint.loadReasonsError"));
      });
  }, [router.locale, t]);

  // Обработчики
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReasonChange = (id: number) => {
    setFormData((prev) => {
      const newReasons = prev.reason.includes(id)
        ? prev.reason.filter((r) => r !== id)
        : [...prev.reason, id];
      return { ...prev, reason: newReasons };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFormData((prev) => ({ ...prev, evidence: e.target.files![0] }));
    }
  };

  const handleEvidenceImagesChange = (files: File[]) => {
    setFormData((prev) => ({ ...prev, evidenceImages: files }));
  };

  const handleCourtDocumentChange = (files: File[]) => {
    if (files.length > 0) {
      setFormData((prev) => ({ ...prev, courtDocument: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, courtDocument: null }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (formData.reason.length === 0) {
      setErrorMessage(t("Scomplaint.reasonRequired"));
      setIsSubmitting(false);
      return;
    }

    if (formData.isCourtCase && !formData.damageCost) {
      setErrorMessage(t("Scomplaint.damageCostRequired"));
      setIsSubmitting(false);
      return;
    }

    const token = getCookie("access_token");
    if (!token) {
      setErrorMessage(t("Scomplaint.authRequired"));
      setIsSubmitting(false);
      return;
    }

    const data = new FormData();
    data.append("description", formData.description);
    formData.reason.forEach((id) => data.append("reason", String(id)));
    if (formData.evidence) data.append("evidence", formData.evidence);
    formData.evidenceImages.forEach((file) =>
      data.append("evidence_images", file)
    );
    data.append("damage_cost", formData.damageCost);
    data.append("is_court_case", String(formData.isCourtCase));
    if (formData.courtDocument) data.append("court_document", formData.courtDocument);

    try {
      await updateRentalComplaint(uuid as string, data, token);
      setSuccessMessage(t("Scomplaint.success"));
      router.push("/profile");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        t("Scomplaint.submitError");
      setErrorMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingSpinner}>
            <div className={styles.loadingSpinnerOuter}></div>
            <div className={styles.loadingSpinnerInner}></div>
          </div>
          <p className={styles.loadingText}>{t("Scomplaint.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.editComplaintForm}>
      <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.headerSection}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>
              <svg className={styles.headerIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h2 className={styles.headerTitle}>{t("Scomplaint.editTitle")}</h2>
            <div className={styles.warningBox}>
              <div className={styles.warningContent}>
                <svg className={styles.warningIcon} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className={styles.warningText}>
                  {t("Scomplaint.descriptionedit")}
                </p>
              </div>
            </div>
          </div>

          {/* Notifications */}
          {loadError && (
            <div className={`${styles.notification} ${styles.notificationError}`}>
              <div className={styles.notificationContent}>
                <svg className={`${styles.notificationIcon} ${styles.notificationIconError}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className={`${styles.notificationText} ${styles.notificationTextError}`}>{t("Scomplaint.loadEditError")}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className={`${styles.notification} ${styles.notificationSuccess}`}>
              <div className={styles.notificationContent}>
                <svg className={`${styles.notificationIcon} ${styles.notificationIconSuccess}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className={`${styles.notificationText} ${styles.notificationTextSuccess}`}>{successMessage}</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className={`${styles.notification} ${styles.notificationError}`}>
              <div className={styles.notificationContent}>
                <svg className={`${styles.notificationIcon} ${styles.notificationIconError}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className={`${styles.notificationText} ${styles.notificationTextError}`}>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Description Card */}
            <div className={`${styles.formCard} ${styles.formCardDescription}`}>
              <div className={styles.descriptionSection}>
                <div className={styles.descriptionIcon}>
                  <svg className={styles.descriptionIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className={styles.descriptionContent}>
                  <label className={styles.descriptionLabel}>
                    {t("Scomplaint.description")}
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    className={styles.descriptionTextarea}
                    placeholder={t("Scomplaint.describeComplaint")}
                  />
                </div>
              </div>
            </div>

            {/* Reasons Card */}
            <div className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <div className={`${styles.formCardIcon} ${styles.formCardIconYellow}`}>
                  <svg className={styles.formCardIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className={styles.formCardTitle}>{t("Scomplaint.reasons")}</h3>
              </div>
              <div className={styles.reasonsGrid}>
                {complaintReasons
                  .filter((reason) => reason.type === accusedRole)
                  .map((reason) => (
                    <label key={reason.id} className={styles.reasonItem}>
                      <input
                        type="checkbox"
                        checked={formData.reason.includes(reason.id)}
                        onChange={() => handleReasonChange(reason.id)}
                        className={styles.reasonCheckbox}
                      />
                      <span className={styles.reasonText}>
                        {getReasonText(reason)}
                      </span>
                    </label>
                  ))}
              </div>
            </div>

            {/* Photos Card */}
            <div className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <div className={`${styles.formCardIcon} ${styles.formCardIconIndigo}`}>
                  <svg className={styles.formCardIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className={styles.formCardTitle}>{t("Scomplaint.additionalPhotos")}</h3>
              </div>
              <FileUploadDropzone
                accept="image/*"
                multiple={true}
                maxFiles={10}
                maxSizeMB={10}
                onFilesChange={handleEvidenceImagesChange}
                currentFiles={formData.evidenceImages}
                hint={t("Scomplaint.uploadHint")}
                showPreview={true}
                previewType="image"
                error={errorMessage}
                onError={setErrorMessage}
              />
            </div>

            {/* Court Case Card */}
            <div className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <div className={`${styles.formCardIcon} ${styles.formCardIconPurple}`}>
                  <svg className={styles.formCardIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className={styles.formCardTitle}>{t("Scomplaint.isCourtCase")}</h3>
              </div>
              
              <div className={styles.courtCaseSection}>
                <input
                  type="checkbox"
                  id="isCourtCase"
                  checked={formData.isCourtCase}
                  disabled
                  className={styles.courtCaseCheckbox}
                />
                <label htmlFor="isCourtCase" className={styles.courtCaseLabel}>
                  {t("Scomplaint.isCourtCase")}
                </label>
              </div>

              {formData.isCourtCase && (
                <div className={styles.courtCaseFields}>
                  <div className={styles.courtCaseField}>
                    <label className={styles.courtCaseFieldLabel}>
                      {t("Scomplaint.damageCost")}
                    </label>
                    <input
                      type="text"
                      name="damageCost"
                      value={formData.damageCost}
                      onChange={handleChange}
                      className={styles.courtCaseFieldInput}
                      placeholder="Введите сумму ущерба..."
                    />
                  </div>

                  <div className={styles.courtCaseField}>
                    <FileUploadDropzone
                      accept=".pdf,.doc,.docx,image/*"
                      multiple={false}
                      maxFiles={1}
                      maxSizeMB={10}
                      onFilesChange={handleCourtDocumentChange}
                      currentFiles={formData.courtDocument ? [formData.courtDocument] : []}
                      label={t("Scomplaint.evidence")}
                      hint={t("Scomplaint.uploadFormats")}
                      showPreview={true}
                      previewType="document"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className={styles.submitSection}>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`${styles.submitButton} ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isSubmitting ? (
                  <>
                    <svg className={styles.submitButtonSpinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t("Scomplaint.submitting")}
                  </>
                ) : (
                  <>
                    <svg className={styles.submitButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {t("Scomplaint.submitedit")}
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

export default EditComplaintForm;