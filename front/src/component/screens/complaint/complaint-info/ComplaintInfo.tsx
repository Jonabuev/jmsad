"use client";

import { IComplaint } from "@/component/type/users.interface";
import { FC, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { mediaUrl } from "@/utils/url";
import { useTranslation } from "react-i18next";
import styles from "./ComplaintInfo.module.scss";

  
const ProtectedPDF = dynamic(() => import("./PdfAsImagesViewer"), { ssr: false });



// Компонент для защищённого показа изображения
const ProtectedImage: FC<{ src: string }> = ({ src }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fullSrc = mediaUrl(src);
  const { t } = useTranslation("common");

  useEffect(() => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.drawImage(image, 0, 0);
      }
    };
    image.src = fullSrc;
  }, [src]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "auto",
        userSelect: "none",
        pointerEvents: "none",
      }}
    />
  );
};

// Проверка расширений
const isImageFile = (filename: string) =>
  /\.(jpg|jpeg|png|webp|gif)$/i.test(filename);

const isPDFFile = (filename: string) => /\.pdf$/i.test(filename);

// Отображение доказательства
const EvidenceViewer: FC<{ url: string }> = ({ url }) => {
  if (isImageFile(url)) {
    return (
      <div className={styles.evidenceViewerImage}>
        <ProtectedImage src={url} />
      </div>
    );
  }

  if (isPDFFile(url)) {
    return (
      <div className={styles.evidenceViewerPdf}>
        <ProtectedPDF pdfUrl={mediaUrl(url)} />
      </div>
    );
  }

  return (
    <div className={styles.evidenceViewerUnsupported}>Unsupported file format.</div>
  );
};



// удалено: локальная реализация getFullUrl заменена на mediaUrl



interface Props {
  complaint: IComplaint;
  t: any;
}
const ComplaintInfo: FC<Props> = ({ complaint, t }) => {
  // Глобальная блокировка ПКМ
  useEffect(() => {
    const handler = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  return (
    <div className={styles.complaintInfo}>
      {/* Description Card */}
      <div className={styles.descriptionCard}>
        <div className={styles.descriptionContent}>
          <div className="flex-shrink-0">
            <div className={styles.descriptionIcon}>
              <svg className={styles.descriptionIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className={styles.descriptionText}>
            <h3 className={styles.descriptionTitle}>{t("complaint.description")}</h3>
            <p className={styles.descriptionContent}>{complaint.description}</p>
          </div>
        </div>
      </div>

      {/* Participants Card */}
      <div className={styles.participantsGrid}>
        <div className={styles.participantCard}>
          <div className={styles.participantHeader}>
            <div className={`${styles.participantIcon} ${styles.participantIconComplainant}`}>
              <svg className={styles.participantIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className={styles.participantTitle}>{t("complaint.complainant")}</h3>
          </div>
          <p className={styles.participantName}>{complaint.complainant?.username}</p>
        </div>

        <div className={styles.participantCard}>
          <div className={styles.participantHeader}>
            <div className={`${styles.participantIcon} ${styles.participantIconAccused}`}>
              <svg className={styles.participantIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className={styles.participantTitle}>{t("complaint.accused")}</h3>
          </div>
          <p className={styles.participantName}>{complaint.accused?.username}</p>
        </div>
      </div>

      {/* Reasons Card */}
      <div className={styles.reasonsCard}>
        <div className={styles.reasonsHeader}>
          <div className={styles.reasonsIcon}>
            <svg className={styles.reasonsIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className={styles.reasonsTitle}>{t("complaint.reasons")}</h3>
        </div>
        <div className={styles.reasonsList}>
          {complaint.reasons.map((r) => (
            <span key={r.id} className={styles.reasonTag}>
              {t(`search.reason.${r.reason}`)}
            </span>
          ))}
        </div>
      </div>

      {/* Court Decision */}
      {complaint.court_decision_score && (
        <div className={styles.courtDecisionCard}>
          <div className={styles.courtDecisionHeader}>
            <div className={styles.courtDecisionIcon}>
              <svg className={styles.courtDecisionIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className={styles.courtDecisionTitle}>{t("complaint.courtDecision")}</h3>
          </div>
          <p className={styles.courtDecisionScore}>{complaint.court_decision_score}</p>
        </div>
      )}

      {/* Images */}
      {complaint.images?.length > 0 && (
        <div className={styles.imagesCard}>
          <div className={styles.imagesHeader}>
            <div className={styles.imagesIcon}>
              <svg className={styles.imagesIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className={styles.imagesTitle}>{t("complaint.attachedImages")}</h3>
          </div>
          <div className={styles.imagesGrid}>
            {complaint.images.map((img, i) => (
              <div key={i} className={styles.imageItem}>
                <ProtectedImage src={mediaUrl(img)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evidence */}
      {complaint.evidence && (
        <div className={styles.evidenceCard}>
          <div className={styles.evidenceHeader}>
            <div className={styles.evidenceIcon}>
              <svg className={styles.evidenceIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className={styles.evidenceTitle}>{t("complaint.evidence")}</h3>
          </div>
          <div className={styles.evidenceViewer}>
            <EvidenceViewer url={complaint.evidence} />
          </div>
        </div>
      )}

      {/* Disputes */}
      {complaint.disputes.length > 0 && (
        <div className={styles.disputesCard}>
          <div className={styles.disputesHeader}>
            <div className={styles.disputesIcon}>
              <svg className={styles.disputesIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className={styles.disputesTitle}>{t("complaint.disputeHistory")}</h3>
          </div>
          <div className={styles.disputesList}>
            {complaint.disputes.map((d) => (
              <div key={d.id} className={styles.disputeItem}>
                <div className={styles.disputeHeader}>
                  <span className={styles.disputeUser}>{d.user.username}</span>
                  <span className={styles.disputeDate}>
                    {new Date(d.created_at).toLocaleString()}
                  </span>
                </div>
                <p className={styles.disputeExplanation}>{d.explanation}</p>
                {d.evidence && (
                  <div className={styles.disputeEvidence}>
                    <EvidenceViewer url={d.evidence} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintInfo;
