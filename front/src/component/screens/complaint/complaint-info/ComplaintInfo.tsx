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
    <div className="space-y-6 select-none">
      {/* Description Card */}
      <div className="bg-gray-50 rounded-xl p-6 border-l-4 border-blue-600 transform transition-all duration-300 hover:shadow-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("complaint.description")}</h3>
            <p className="text-gray-700 leading-relaxed">{complaint.description}</p>
          </div>
        </div>
      </div>

      {/* Participants Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm transform transition-all duration-300 hover:shadow-lg hover:scale-105">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{t("complaint.complainant")}</h3>
          </div>
          <p className="text-gray-700 font-medium">{complaint.complainant?.username}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm transform transition-all duration-300 hover:shadow-lg hover:scale-105">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{t("complaint.accused")}</h3>
          </div>
          <p className="text-gray-700 font-medium">{complaint.accused?.username}</p>
        </div>
      </div>

      {/* Reasons Card */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{t("complaint.reasons")}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {complaint.reasons.map((r) => (
            <span key={r.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              {t(`search.reason.${r.reason}`)}
            </span>
          ))}
        </div>
      </div>

      {/* Court Decision */}
      {complaint.court_decision_score && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{t("complaint.courtDecision")}</h3>
          </div>
          <p className="text-gray-700 font-medium">{complaint.court_decision_score}</p>
        </div>
      )}

      {/* Images */}
      {complaint.images?.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{t("complaint.attachedImages")}</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {complaint.images.map((img, i) => (
              <div key={i} className="rounded-lg shadow-md bg-gray-100 p-2 hover:shadow-lg transition-shadow duration-300">
                <ProtectedImage src={mediaUrl(img)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evidence */}
      {complaint.evidence && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{t("complaint.evidence")}</h3>
          </div>
          <div className="rounded-lg shadow-md bg-gray-100 p-2">
            <EvidenceViewer url={complaint.evidence} />
          </div>
        </div>
      )}

      {/* Disputes */}
      {complaint.disputes.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{t("complaint.disputeHistory")}</h3>
          </div>
          <div className="space-y-4">
            {complaint.disputes.map((d) => (
              <div key={d.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-pink-500">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-semibold text-gray-900">{d.user.username}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(d.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-700 mb-3">{d.explanation}</p>
                {d.evidence && (
                  <div className="rounded-lg shadow-sm bg-white p-2">
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
