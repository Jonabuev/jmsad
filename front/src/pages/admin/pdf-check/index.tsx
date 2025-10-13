// pages/admin/pdf-check/index.tsx
import React, { FC, useState } from "react";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { getCookie } from "@/utils/cookieUtils";
import AdminLayout from "@/component/admin/AdminLayout";
import axios from "axios";
import { apiUrl } from "@/utils/url";
import styles from "./PDFCheckPage.module.scss";

interface Candidate {
  fio: string;
  birth_date: string;
  court_decision_score?: string;
  after: string;
  before: string;
}

const PDFCheckPage: FC = () => {
  const { t } = useTranslation("common");
  const [file, setFile] = useState<File | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Candidate | null>(null);

  const [description, setDescription] = useState("");
  const [courtNumber, setCourtNumber] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // выбор PDF-файла
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setCandidates([]);
      setSelected(null);
      setError(null);
      setSuccess(null);
    }
  };

  // загрузка PDF и парсинг
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("pdf_file", file);

    try {
      const token = getCookie("access_token");
      const response = await axios.post(apiUrl("/pdf/"), formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: token ? `Bearer ${token}` : "",
         },
      });

      setCandidates(
        Array.isArray(response.data.main_accused)
          ? response.data.main_accused.map((a: any) => ({
              fio: a.fio,
              after: a.after,
              before: a.before,
              birth_date: response.data.birth_date,
              court_decision_score: Array.isArray(response.data.case_numbers)
                ? response.data.case_numbers[0]?.replace(/^№\s?/, "")
                : String(response.data.case_numbers || "").replace(/^№\s?/, ""),
            }))
          : []
      );
    } catch (err: any) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  // отправка жалобы
  const handleSubmit = async () => {
    if (!selected || !file) return; // важно: файл обязателен

    const formData = new FormData();
    formData.append("fio", selected.fio);
    formData.append("birth_date", selected.birth_date);
    formData.append("complaint_description", description);
    formData.append("court_decision_score", courtNumber);
    formData.append("is_court_case", "true"); // всегда true
    formData.append("evidence", file); // тот же файл уходит как доказательство

    try {
      const token = getCookie("access_token");
      const response = await axios.post(apiUrl("/user_pdf/"), formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: token ? `Bearer ${token}` : "",
         },
        
      });
      setSuccess(t("pdfCheck.successMessage", { id: response.data.complaint_id }));
    } catch (err: any) {
      setError(err.response?.data?.error || t("pdfCheck.errorSubmit"));
    }
  };

  return (
    <AdminLayout>
      <div className={styles.pdfCheckPage}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t("pdfCheck.pageTitle")}
          </h1>
          <p className={styles.pageSubtitle}>
            {t("pdfCheck.pageSubtitle")}
          </p>
        </div>

        {/* Upload Section */}
        <div className={styles.uploadSection}>
          <div className={styles.uploadHeader}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <h2 className={styles.uploadTitle}>{t("pdfCheck.uploadTitle")}</h2>
          </div>

          <div className={styles.fileInputWrapper}>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className={styles.fileInputHidden}
              id="pdfFileInput"
            />
            <label htmlFor="pdfFileInput" className={styles.fileInputLabel}>
              <div className={styles.fileInputButton}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {file ? t("pdfCheck.changeFile") : t("pdfCheck.selectFile")}
              </div>
              <span className={styles.fileName}>
                {file ? file.name : t("pdfCheck.noFileSelected")}
              </span>
            </label>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={styles.uploadButton}
          >
            {loading ? (
              <>
                <svg className={styles.animateSpin} fill="none" viewBox="0 0 24 24">
                  <circle style={{opacity: 0.25}} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path style={{opacity: 0.75}} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t("pdfCheck.processing")}
              </>
            ) : (
              <>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                {t("pdfCheck.uploadButton")}
              </>
            )}
          </button>

          {error && (
            <div className={styles.errorMessage}>
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className={styles.successMessage}>
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          )}
        </div>

        {/* Candidates List */}
        {candidates.length > 0 && (
          <div className={styles.candidatesSection}>
            <div className={styles.candidatesHeader}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h2 className={styles.candidatesTitle}>{t("pdfCheck.candidatesTitle")}</h2>
              <span className={styles.candidatesCount}>{candidates.length}</span>
            </div>

            <div className={styles.candidatesList}>
              {candidates.map((c, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelected(c);
                    setCourtNumber(c.court_decision_score || "");
                  }}
                  className={`${styles.candidateCard} ${
                    selected?.fio === c.fio ? styles.candidateCardSelected : ""
                  }`}
                >
                  {selected?.fio === c.fio && (
                    <div className={styles.selectBadge}>{t("pdfCheck.selected")}</div>
                  )}
                  <div className={styles.candidateDescription}>{c.before}</div>
                  <div className={styles.candidateName}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {c.fio}
                  </div>
                  <div className={styles.candidateDescription}>{c.after}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complaint Form */}
        {selected && (
          <div className={styles.complaintForm}>
            <div className={styles.formHeader}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className={styles.formTitle}>{t("pdfCheck.formTitle")}: {selected.fio}</h2>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>{t("pdfCheck.courtNumber")}</label>
              <input
                type="text"
                placeholder={t("pdfCheck.courtNumberPlaceholder")}
                value={courtNumber}
                onChange={(e) => setCourtNumber(e.target.value)}
                className={styles.formInput}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>{t("pdfCheck.description")}</label>
              <textarea
                placeholder={t("pdfCheck.descriptionPlaceholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={styles.formTextarea}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>{t("pdfCheck.birthDate")}</label>
              <input
                type="text"
                placeholder={t("pdfCheck.birthDatePlaceholder")}
                value={selected?.birth_date || ""}
                onChange={(e) =>
                  setSelected(selected ? { ...selected, birth_date: e.target.value } : null)
                }
                className={styles.formInput}
              />
            </div>

            <button
              onClick={handleSubmit}
              className={styles.submitButton}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {t("pdfCheck.submitButton")}
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PDFCheckPage;

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", ["common"])),
    },
  };
};
