"use client";

import { IComplaint } from "@/component/type/users.interface";
import { FC, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { mediaUrl } from "@/utils/url";
import { useTranslation } from "react-i18next";

  
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
      <div className="rounded shadow-md bg-gray-100 p-1 mt-2">
        <ProtectedImage src={url} />
      </div>
    );
  }

  if (isPDFFile(url)) {
    return <ProtectedPDF pdfUrl={mediaUrl(url)} />;
  }

  return (
    <div className="text-gray-500 italic mt-2">Unsupported file format.</div>
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
    <div className="space-y-4 select-none">
      <div>
        <strong>{t("complaint.description")}:</strong> {complaint.description}
      </div>

      <div>
        <strong>{t("complaint.status")}:</strong>{" "}
        {t(`complaint.${complaint.status}`)}
      </div>

      {/* {<div>
        <strong>{t("complaint.rating")}:</strong> {complaint.rating}
      </div>} */}

      <div>
        <strong>{t("complaint.complainant")}:</strong>{" "}
        {complaint.complainant?.username}
      </div>

      <div>
        <strong>{t("complaint.accused")}:</strong>{" "}
        {complaint.accused?.username}
      </div>

      {/* <div>
        <strong>{t("complaint.property")}:</strong>{" "}
        {complaint.property?.city}, {complaint.property?.address}
      </div> */}

      <div>
        <strong>{t("complaint.reasons")}:</strong>{" "}
        {complaint.reasons.map((r, i) => (
          <span key={r.id}>
            {t(`search.reason.${r.reason}`)}
            {i !== complaint.reasons.length - 1 ? ", " : ""}
          </span>
        ))}
      </div>

      {complaint.court_decision_score && (
        <div>
          <strong>{t("complaint.courtDecision")}:</strong>{" "}
          {complaint.court_decision_score}
        </div>
      )}

      {complaint.images?.length > 0 && (
        <div>
          <strong>{t("complaint.attachedImages")}:</strong>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
            {complaint.images.map((img, i) => (
              <div key={i} className="rounded shadow-md bg-gray-100 p-1">
                <ProtectedImage src={mediaUrl(img)} />
              </div>
            ))}
          </div>
        </div>
      )}
      {complaint.evidence && (
        <div>
          <strong>{t("complaint.evidence")}:</strong>
          <EvidenceViewer url={complaint.evidence} /> {/* ✅ Только здесь! */}
        </div>
      )}


      {complaint.disputes.length > 0 && (
        <div>
          <strong>{t("complaint.disputeHistory")}:</strong>
          <ul className="mt-2 list-disc ml-5 space-y-2">
            {complaint.disputes.map((d) => (
              <li key={d.id}>
                <div>
                  <span className="font-semibold">{d.user.username}</span>:{" "}
                  {d.explanation}
                  <br />
                  <span className="text-sm text-gray-500">
                    {new Date(d.created_at).toLocaleString()}
                  </span>
                </div>

                {d.evidence && <EvidenceViewer url={d.evidence} />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ComplaintInfo;
