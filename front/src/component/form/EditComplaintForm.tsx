import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { fetchRentalComplaintByUuid, fetchComplaintReasons, updateRentalComplaint } from "@/api/complaintsApi";
import styles from "./SubmitComplaint.module.scss";
import { getCookie } from "@/utils/cookieUtils";

interface ComplaintReason {
  id: number;
  reason: string;
  reason_kz?: string;
  reason_en?: string;
  type: string;
}

interface ComplaintData {
  accused_iin: string;
  accused: { role: "tenant" | "landlord" };
  description: string;
  reasons: number[]; // Изменено с reason на reasons
  evidence: string | null;
  images: string[];
  court_decision_score: string | null;
  is_court_case: boolean;
}

const EditComplaintForm: React.FC = () => {
  const router = useRouter();
  const uuid = Array.isArray(router.query.uuid) ? router.query.uuid[0] : router.query.uuid;
  const { t } = useTranslation();

  const initialFormState = {
    accusedIin: "",
    accusedRole: "" as "tenant" | "landlord" | "",
    description: "",
    reasons: [] as number[], // Изменено с reason на reasons
    evidence: null as File | null,
    images: [] as File[],
    courtDecisionNumber: "",
    isCourtCase: false,
    courtDocument: null as File | null,
    existingCourtDocument: "" as string | null,
  };

  const [complaintReasons, setComplaintReasons] = useState<ComplaintReason[]>([]);
  const [formData, setFormData] = useState(initialFormState);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // Хелпер для получения переведенного текста причины
  const getReasonText = (reason: ComplaintReason): string => {
    const locale = router.locale || "ru";
    if (locale === "kz" && reason.reason_kz) return reason.reason_kz;
    if (locale === "en" && reason.reason_en) return reason.reason_en;
    return reason.reason;
  };

  // Загрузка данных жалобы
  useEffect(() => {
    const token = getCookie("access_token");
    if (!token || typeof uuid !== "string") {
      setErrorMessage(t("Scomplaint.authRequired"));
      setIsLoading(false);
      return;
    }
    setErrorMessage("");
    fetchRentalComplaintByUuid(uuid, token)
      .then((res) => {
        console.log("Loaded complaint data:", JSON.stringify(res.data, null, 2)); // Подробный лог
        const data: ComplaintData = res.data;
        setFormData({
          accusedIin: data.accused_iin || "",
          accusedRole: data.accused?.role || "",
          description: data.description || "",
          reasons: Array.isArray(data.reasons) ? data.reasons.map((r: any) => Number(r.id)) : [], // Извлекаем ID
          evidence: null,
          images: [],
          courtDecisionNumber: data.court_decision_score || "",
          isCourtCase: data.is_court_case || false,
          courtDocument: null,
          existingCourtDocument: data.evidence || null,
        });
        setExistingImages(data.images || []);
        setErrorMessage("");
      })
      .catch((error) => {
        console.error("Error loading complaint:", error);
        setErrorMessage(error.response?.data?.error || t("Scomplaint.loadEditError"));
      })
      .finally(() => setIsLoading(false));
  }, [uuid, t]);

  // Загрузка причин в зависимости от роли обвиняемого
  useEffect(() => {
    const locale = router.locale || "ru";
    fetchComplaintReasons(locale, formData.accusedRole)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setComplaintReasons(res.data);
        } else {
          console.error("Invalid data format:", res.data);
          setErrorMessage(t("Scomplaint.invalidDataFormat"));
        }
      })
      .catch((error) => {
        console.error("Error loading complaint reasons:", error);
        setErrorMessage(t("Scomplaint.loadReasonsError"));
      });
  }, [router.locale, formData.accusedRole]);

  // Обработчик изменения полей
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReasonChange = (id: number) => {
    setFormData((prev) => {
      const newReasons = prev.reasons.includes(id)
        ? prev.reasons.filter((r) => r !== id)
        : [...prev.reasons, id];
      return { ...prev, reasons: newReasons }; // Изменено с reason на reasons
    });
  };

  // Обработчики drag-and-drop для фотографий
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length + existingImages.length + formData.images.length > 10) {
      setErrorMessage(t("Scomplaint.photoerror"));
      return;
    }

    if (imageFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...imageFiles],
      }));
    }
  };

  // Удаление существующего изображения
  const handleRemoveExistingImage = (imageUrl: string) => {
    setExistingImages((prev) => prev.filter((url) => url !== imageUrl));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (formData.reasons.length === 0) {
      setErrorMessage(t("Scomplaint.reasonRequired"));
      setIsSubmitting(false);
      return;
    }

    if (formData.isCourtCase && !formData.courtDecisionNumber) {
      setErrorMessage(t("Scomplaint.courtDecisionNumberRequired"));
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
    formData.reasons.forEach((id) => data.append("reason", String(id))); // Отправляем как reason для бэкенда
    if (formData.isCourtCase && formData.courtDecisionNumber) {
      data.append("court_decision_score", formData.courtDecisionNumber);
    }
    if (formData.isCourtCase && formData.courtDocument) {
      data.append("evidence", formData.courtDocument);
    }
    formData.images.forEach((file) => {
      data.append("evidence_images", file);
    });
    existingImages.forEach((url) => {
      data.append("existing_images", url);
    });

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
    <div className={styles.submitComplaintForm}>
      <div className={styles.container}>
        <div className={styles.headerSection}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>
              <svg className={styles.headerIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h2 className={styles.headerTitle}>{t("Scomplaint.editTitle")}</h2>
            <p className={styles.headerDescription}>{t("Scomplaint.descriptionedit")}</p>
          </div>

          {successMessage && (
            <div className={`${styles.notification} ${styles.notificationSuccess}`}>
              <div className={styles.notificationContent}>
                <div className="flex-shrink-0">
                  <svg className={`${styles.notificationIcon} ${styles.notificationIconSuccess}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className={`${styles.notificationText} ${styles.notificationTextSuccess}`}>{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className={`${styles.notification} ${styles.notificationError}`}>
              <div className={styles.notificationContent}>
                <div className="flex-shrink-0">
                  <svg className={`${styles.notificationIcon} ${styles.notificationIconError}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className={`${styles.notificationText} ${styles.notificationTextError}`}>{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* IIN Field */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <div className={`${styles.sectionIcon} ${styles.sectionIconGreen}`}>
                  <svg className={styles.sectionIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className={styles.sectionTitle}>{t("Scomplaint.accusedIin")}</h3>
              </div>
              <div className={styles.iinField}>
                <input
                  type="text"
                  name="accusedIin"
                  value={formData.accusedIin}
                  className={styles.iinInput}
                  placeholder={t("Scomplaint.iinplace")}
                  disabled
                />
              </div>
            </div>

            {/* Description Field */}
            <div className={styles.descriptionSection}>
              <div className={styles.descriptionContent}>
                <div className="flex-shrink-0">
                  <div className={styles.descriptionIcon}>
                    <svg className={styles.descriptionIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className={styles.descriptionField}>
                  <label className={styles.descriptionLabel}>{t("Scomplaint.description")}</label>
                  <textarea
                    name="description"
                    placeholder={t("Scomplaint.describeComplaint")}
                    value={formData.description}
                    onChange={handleChange}
                    required
                    className={styles.descriptionTextarea}
                  />
                </div>
              </div>
            </div>

            {/* Reasons */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <div className={`${styles.sectionIcon} ${styles.sectionIconYellow}`}>
                  <svg className={styles.sectionIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className={styles.sectionTitle}>{t("Scomplaint.complaintReasons")}</h3>
              </div>
              <div className={styles.reasonsGrid}>
                {complaintReasons.map((reason) => (
                  <label key={reason.id} className={styles.reasonItem}>
                    <input
                      type="checkbox"
                      checked={formData.reasons.includes(reason.id)} // Изменено с reason на reasons
                      onChange={() => handleReasonChange(reason.id)}
                      className={styles.reasonCheckbox}
                    />
                    <span className={styles.reasonText}>{getReasonText(reason)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Photos */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <div className={`${styles.sectionIcon} ${styles.sectionIconIndigo}`}>
                  <svg className={styles.sectionIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className={styles.sectionTitle}>{t("Scomplaint.additionalPhotos")}</h3>
              </div>
              <div
                className={`${styles.uploadArea} ${isDragging ? styles.uploadAreaDragging : ""}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      const selectedFiles = Array.from(e.target.files);
                      if (selectedFiles.length + existingImages.length + formData.images.length > 10) {
                        setErrorMessage(t("Scomplaint.photoerror"));
                        return;
                      }
                      setFormData((prev) => ({
                        ...prev,
                        images: [...prev.images, ...selectedFiles],
                      }));
                    }
                  }}
                  className={styles.uploadInput}
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className={styles.uploadLabel}>
                  <svg className={styles.uploadIcon} stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className={styles.uploadText}>
                    <span className={styles.uploadTextLink}>{t("Scomplaint.uploadClick")}</span>{" "}
                    {t("Scomplaint.uploadOrDrag")}
                  </p>
                  <p className={styles.uploadHint}>{t("Scomplaint.uploadHint")}</p>
                </label>
              </div>
              {(existingImages.length > 0 || formData.images.length > 0) && (
                <div className={styles.imagePreview}>
                  <p className={styles.imagePreviewTitle}>
                    {t("Scomplaint.selectedImages")}: {existingImages.length + formData.images.length}
                  </p>
                  <div className={styles.imagePreviewGrid}>
                    {existingImages.map((url, index) => (
                      <div key={`existing-${index}`} className={styles.imagePreviewItem}>
                        <img src={url} alt={`Existing ${index + 1}`} className={styles.imagePreviewImg} />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(url)}
                          className={styles.imagePreviewRemove}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {formData.images.map((file, index) => (
                      <div key={`new-${index}`} className={styles.imagePreviewItem}>
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className={styles.imagePreviewImg}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== index),
                            }));
                          }}
                          className={styles.imagePreviewRemove}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Court Case */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <div className={`${styles.sectionIcon} ${styles.sectionIconPurple}`}>
                  <svg className={styles.sectionIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className={styles.sectionTitle}>{t("Scomplaint.isCourtCase")}</h3>
              </div>
              <div className={styles.courtSection}>
                <input
                  type="checkbox"
                  id="isCourtCase"
                  checked={formData.isCourtCase}
                  onChange={() => {}} // Отключаем изменение
                  className={styles.courtCheckbox}
                  disabled
                />
                <label htmlFor="isCourtCase" className={styles.courtLabel}>
                  {t("Scomplaint.isCourtCase")}
                </label>
              </div>
              {formData.isCourtCase && (
                <div className={styles.courtFields}>
                  <div className={styles.courtField}>
                    <label className={styles.courtFieldLabel}>{t("Scomplaint.courtDecisionNumber")}</label>
                    <input
                      type="text"
                      name="courtDecisionNumber"
                      value={formData.courtDecisionNumber}
                      onChange={handleChange}
                      className={styles.courtFieldInput}
                      placeholder={t("Scomplaint.courtDecisionNumberPlaceholder")}
                    />
                  </div>
                  <div className={styles.courtField}>
                    <label className={styles.courtFieldLabel}>{t("Scomplaint.evidence")}</label>
                    <div className={styles.courtUploadArea}>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,image/*"
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            courtDocument: e.target.files ? e.target.files[0] : null,
                          }))
                        }
                        className={styles.courtUploadInput}
                        id="court-document-upload"
                      />
                      <label htmlFor="court-document-upload" className={styles.courtUploadLabel}>
                        <svg className={styles.courtUploadIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className={styles.courtUploadText}>
                          <span className={styles.courtUploadTextLink}>{t("Scomplaint.uploadDocument")}</span>
                        </p>
                        <p className={styles.courtUploadHint}>{t("Scomplaint.uploadFormats")}</p>
                      </label>
                    </div>
                    {(formData.courtDocument || formData.existingCourtDocument) && (
                      <div className={styles.uploadedFileInfo}>
                        <p className={styles.uploadedFileName}>
                          📎 {formData.courtDocument ? formData.courtDocument.name : formData.existingCourtDocument}
                        </p>
                        <button
                          type="button"
                          className={styles.removeFileButton}
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, courtDocument: null, existingCourtDocument: null }))
                          }
                        >
                          ✖
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className={styles.formSection}>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`${styles.submitButton} ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className={styles.submitButtonSpinner}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {t("Scomplaint.submitting")}
                  </>
                ) : (
                  <>
                    <svg className={styles.submitButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
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