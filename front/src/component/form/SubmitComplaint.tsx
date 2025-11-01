import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { getCookie } from "@/utils/cookieUtils";
import { fetchComplaintReasons, submitRentalComplaint, searchUsersByIin } from "@/api/complaintsApi";
import styles from "./SubmitComplaint.module.scss";

interface ComplaintReason {
  id: number;
  reason: string;
  reason_kz?: string;
  reason_en?: string;
  type: string;
}


interface UserSuggestion {
  identifier: string;
  full_name: string;
  role: string;  // 👈 добавляем
}


const SubmitComplaintForm: React.FC = () => {
  const { t } = useTranslation();
  const [complaintReasons, setComplaintReasons] = useState<ComplaintReason[]>([]);
  const initialFormState = {
    accusedIin: "",
    accusedRole: "" as "tenant" | "landlord" | "",
    description: "",
    reason: [] as number[],
    evidence: null as File | null,
    evidenceImages: [] as File[],
    damageCost: "",
    isCourtCase: false,
    courtDecisionNumber: "",
    courtDocument: null as File | null,
  };
  const [formData, setFormData] = useState(initialFormState);


  


  const [iinSuggestions, setIinSuggestions] = useState<UserSuggestion[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeRole, setActiveRole] = useState<"tenant" | "landlord">("tenant");
  const [isDragging, setIsDragging] = useState(false);

  const router = useRouter();

  // Хелпер для получения переведенного текста причины
  const getReasonText = (reason: ComplaintReason): string => {
    const locale = router.locale || 'ru';
    if (locale === 'kz' && reason.reason_kz) return reason.reason_kz;
    if (locale === 'en' && reason.reason_en) return reason.reason_en;
    return reason.reason;
  };

  // Загрузка причин (загружаем ВСЕ причины без фильтрации по type)
  useEffect(() => {
    const fetchReasons = async () => {
      try {
        const token = getCookie("access_token");
        if (!token) {
          console.error("No token found");
          return;
        }
        const locale = router.locale || 'ru';
        // Запрашиваем причины с фильтрацией по типу на бэкенде
        const type = activeRole === "tenant" ? "tenant" : "landlord";
        const res = await fetchComplaintReasons(locale, type);
        setComplaintReasons(res.data);
      } catch (error) {
        console.error("Ошибка загрузки причин жалоб:", error);
      }
    };
    fetchReasons();
  }, [router.locale, activeRole]);

  // Обработчик изменения полей
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "accusedIin") {
      if (value.length > 12) {
        setErrorMessage(t("Scomplaint.iinTooLong"));
      } else {
        setErrorMessage("");
      }

      const token = getCookie("access_token");

      if (token && value.length === 12) {
        // если ровно 12 — ищем сразу и сохраняем роль
        searchUsersByIin(value, token)
          .then((res) => {
            const foundUser = res.data?.[0];
            if (foundUser) {
              setFormData((prev) => ({
                ...prev,
                accusedRole: foundUser.role as "tenant" | "landlord",
              }));
            } else {
              setFormData((prev) => ({ ...prev, accusedRole: "" }));
            }
          })
          .catch(() => {
            setFormData((prev) => ({ ...prev, accusedRole: "" }));
          });
      }

      // подсказки — если от 5 до 11 символов
      if (token && value.length >= 5 && value.length < 12) {
        searchUsersByIin(value, token)
          .then((res) => {
            setIinSuggestions(res.data.slice(0, 3));
          })
          .catch(() => setIinSuggestions([]));
      } else {
        setIinSuggestions([]);
      }
    }

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

  // Обработчики drag and drop для фотографий
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

    if (imageFiles.length > 10) {
      setErrorMessage(t("Scomplaint.photoerror"));
      return;
    }

    if (imageFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        evidenceImages: imageFiles,
      }));
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (formData.accusedIin.length !== 12) {
      setErrorMessage(t("Scomplaint.invalidIin"));
      setIsSubmitting(false);
      return;
    }
    if (!formData.accusedRole) {
      setErrorMessage(t("Scomplaint.userNotFound"));
      setIsSubmitting(false);
      return;
    }
    if (formData.reason.length === 0) {
      setErrorMessage(t("Scomplaint.reasonRequired"));
      setIsSubmitting(false);
      return;
    }
    if (formData.accusedRole !== activeRole) {
      setErrorMessage(t("Scomplaint.roleMismatch"));
      setIsSubmitting(false);
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      setErrorMessage(t("Scomplaint.authRequired"));
      setIsSubmitting(false);
      return;
    }

    const data = new FormData();
    data.append("is_court_case", String(formData.isCourtCase));
    if (formData.damageCost) {
      data.append("court_decision_score", formData.damageCost)
    }
    // Append courtDocument as evidence if isCourtCase is true, otherwise append evidence
    if (formData.isCourtCase && formData.courtDocument) {
      data.append("evidence", formData.courtDocument);
    } else if (formData.evidence) {
      data.append("evidence", formData.evidence);
    }
    data.append("accused_iin", formData.accusedIin);
    data.append("description", formData.description);
    formData.reason.forEach((id) => data.append("reason", String(id)));
    formData.evidenceImages.forEach((file) => {
      data.append("evidence_images", file);
    });

    try {
      await submitRentalComplaint(data, token);
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
  
  return (
    <div className={styles.submitComplaintForm}>
      <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.headerSection}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>
              <svg className={styles.headerIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className={styles.headerTitle}>{t("Scomplaint.title")}</h2>
            <p className={styles.headerDescription}>
              {t("Scomplaint.introText")}
            </p>
          </div>

          {/* Notifications */}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Role Selection */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <div className={`${styles.sectionIcon} ${styles.sectionIconBlue}`}>
                  <svg className={styles.sectionIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className={styles.sectionTitle}>{t("Scomplaint.selectComplaintType")}</h3>
              </div>
              
              <div className={styles.roleSelection}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveRole("tenant");
                    setFormData(initialFormState);
                    setErrorMessage("");
                    setSuccessMessage("");
                    setIinSuggestions([]);
                  }}
                  className={`${styles.roleButton} ${
                    activeRole === "tenant"
                      ? styles.roleButtonActive
                      : styles.roleButtonInactive
                  }`}
                >
                  <div className={styles.roleButtonContent}>
                    <div className={`${styles.roleRadio} ${
                      activeRole === "tenant" ? styles.roleRadioActive : styles.roleRadioInactive
                    }`}>
                      {activeRole === "tenant" && (
                        <div className={styles.roleRadioDot}></div>
                      )}
                    </div>
                    <div className={styles.roleText}>
                      <div className={styles.roleTitle}>{t("Scomplaint.tenantComplaint")}</div>
                      <div className={styles.roleDescription}>{t("Scomplaint.tenantComplaintDesc")}</div>
                    </div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setActiveRole("landlord");
                    setFormData(initialFormState);
                    setErrorMessage("");
                    setSuccessMessage("");
                    setIinSuggestions([]);
                  }}
                  className={`${styles.roleButton} ${
                    activeRole === "landlord"
                      ? styles.roleButtonActive
                      : styles.roleButtonInactive
                  }`}
                >
                  <div className={styles.roleButtonContent}>
                    <div className={`${styles.roleRadio} ${
                      activeRole === "landlord" ? styles.roleRadioActive : styles.roleRadioInactive
                    }`}>
                      {activeRole === "landlord" && (
                        <div className={styles.roleRadioDot}></div>
                      )}
                    </div>
                    <div className={styles.roleText}>
                      <div className={styles.roleTitle}>{t("Scomplaint.landlordComplaint")}</div>
                      <div className={styles.roleDescription}>{t("Scomplaint.landlordComplaintDesc")}</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>


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
                  maxLength={12}
                  onChange={handleChange}
                  required
                  className={styles.iinInput}
                  placeholder={t("Scomplaint.iinplace")}
                />
                
                {/* Suggestions */}
                {iinSuggestions.length > 0 && (
                  <div className={styles.iinSuggestions}>
                    {iinSuggestions.map((u, idx) => (
                      <div
                        key={idx}
                        className={styles.suggestionItem}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            accusedIin: u.identifier,
                            accusedRole: u.role as "tenant" | "landlord",
                          }));
                          setIinSuggestions([]);
                        }}
                      >
                        <div className={styles.suggestionContent}>
                          <div className={styles.suggestionInfo}>
                            <div className={styles.suggestionIin}>{u.identifier}</div>
                            <div className={styles.suggestionName}>{u.full_name}</div>
                          </div>
                          <span className={`${styles.suggestionRole} ${
                            u.role === 'tenant' 
                              ? styles.suggestionRoleTenant
                              : styles.suggestionRoleLandlord
                          }`}>
                            {u.role === 'tenant' ? t("Scomplaint.tenant") : t("Scomplaint.landlord")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                  <label className={styles.descriptionLabel}>
                    {t("Scomplaint.description")}
                  </label>
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
                {complaintReasons
                  .filter((reason) => reason.type === activeRole)
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
                className={`${styles.uploadArea} ${isDragging ? styles.uploadAreaDragging : ''}`}
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
                      if (selectedFiles.length > 10) {
                        setErrorMessage(t("Scomplaint.photoerror"));
                        return;
                      }
                      setFormData((prev) => ({
                        ...prev,
                        evidenceImages: selectedFiles,
                      }));
                    }
                  }}
                  className={styles.uploadInput}
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className={styles.uploadLabel}>
                  <svg className={styles.uploadIcon} stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className={styles.uploadText}>
                    <span className={styles.uploadTextLink}>{t("Scomplaint.uploadClick")}</span> {t("Scomplaint.uploadOrDrag")}
                  </p>
                  <p className={styles.uploadHint}>{t("Scomplaint.uploadHint")}</p>
                </label>
              </div>

              {/* Preview uploaded images */}
              {formData.evidenceImages.length > 0 && (
                <div className={styles.imagePreview}>
                  <p className={styles.imagePreviewTitle}>
                    {t("Scomplaint.selectedImages")}: {formData.evidenceImages.length}
                  </p>
                  <div className={styles.imagePreviewGrid}>
                    {formData.evidenceImages.map((file, index) => (
                      <div key={index} className={styles.imagePreviewItem}>
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
                              evidenceImages: prev.evidenceImages.filter((_, i) => i !== index),
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
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isCourtCase: e.target.checked }))
                  }
                  className={styles.courtCheckbox}
                />
                <label htmlFor="isCourtCase" className={styles.courtLabel}>
                  {t("Scomplaint.isCourtCase")}
                </label>
              </div>

              {formData.isCourtCase && (
                <div className={styles.courtFields}>
                  <div className={styles.courtField}>
                    <label className={styles.courtFieldLabel}>
                      {t("Scomplaint.damageCost")}
                    </label>
                    <input
                      type="text"
                      name="damageCost"
                      value={formData.damageCost}
                      onChange={handleChange}
                      className={styles.courtFieldInput}
                    />
                  </div>

                  <div className={styles.courtField}>
                    <label className={styles.courtFieldLabel}>
                      {t("Scomplaint.evidence")}
                    </label>
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className={styles.courtUploadText}>
                          <span className={styles.courtUploadTextLink}>{t("Scomplaint.uploadDocument")}</span>
                        </p>
                        <p className={styles.courtUploadHint}>{t("Scomplaint.uploadFormats")}</p>
                      </label>
                    </div>

                    {/* 👇 Добавим это */}
                    {formData.courtDocument && (
                      <div className={styles.uploadedFileInfo}>
                        <p className={styles.uploadedFileName}>
                          📎 {formData.courtDocument.name}
                        </p>
                        <button
                          type="button"
                          className={styles.removeFileButton}
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, courtDocument: null }))
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
                className={`${styles.submitButton} ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    {t("Scomplaint.submit")}
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

export default SubmitComplaintForm;
