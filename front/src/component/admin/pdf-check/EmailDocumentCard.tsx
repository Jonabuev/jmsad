import { FC, useState } from "react";
import { EmailDocument } from "@/types/emailDocument";
import dynamic from "next/dynamic";
import { mediaUrl } from "@/utils/url";

const ProtectedPDF = dynamic(() => import("@/component/screens/complaint/complaint-info/PdfAsImagesViewer"), { ssr: false });

interface EmailDocumentCardProps {
  document: EmailDocument;
  onProcess: (documentId: number) => void;
}

// Проверка расширений
const isPDFFile = (filename: string) => /\.pdf$/i.test(filename);

// Отображение PDF
const EvidenceViewer: FC<{ url: string }> = ({ url }) => {
  if (isPDFFile(url)) {
    return (
      <div style={{ maxHeight: "600px", overflow: "auto" }}>
        <ProtectedPDF pdfUrl={mediaUrl(url)} />
      </div>
    );
  }

  return (
    <div className="text-gray-500">Unsupported file format.</div>
  );
};

const EmailDocumentCard: FC<EmailDocumentCardProps> = ({
  document,
  onProcess,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const caseNumber = document.parsed_data?.case_numbers?.[0]?.replace(/^№\s?/, "").trim() || "";
  const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: "bg-yellow-100 text-yellow-800",
      parsed: "bg-blue-100 text-blue-800",
      processed: "bg-green-100 text-green-800",
      error: "bg-red-100 text-red-800",
    };

    const statusLabels = {
      pending: "Ожидает",
      parsed: "Распарсен",
      processed: "Обработан",
      error: "Ошибка",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          statusStyles[status as keyof typeof statusStyles]
        }`}
      >
        {statusLabels[status as keyof typeof statusLabels]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4 border border-gray-200">
      {/* Заголовок карточки */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {document.filename}
          </h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p>
              <span className="font-medium">От:</span> {document.sender}
            </p>
            <p>
              <span className="font-medium">Тема:</span> {document.subject}
            </p>
            <p>
              <span className="font-medium">Получено:</span>{" "}
              {formatDate(document.received_date)}
            </p>
          </div>
        </div>
        <div>{getStatusBadge(document.status)}</div>
      </div>

      {/* Ошибка */}
      {document.error_message && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p className="text-sm text-red-800">
            <span className="font-medium">Ошибка:</span>{" "}
            {document.error_message}
          </p>
        </div>
      )}

      {/* Распарсенные данные */}
      {document.parsed_data && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-left"
          >
            <h4 className="font-medium text-gray-900">
              Распарсенные данные
            </h4>
            <svg
              className={`w-5 h-5 transform transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isExpanded && (
            <div className="mt-4 space-y-3 text-sm">
              {/* Номера дел */}
              {/* Номер дела */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Номер дела
                </label>
                <input
                  type="text"
                  value={caseNumber || "—"}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123456"
                />
              </div>

              {/* ФИО обвиняемых */}
              {document.parsed_data.main_accused && (
                <div>
                  <p className="font-medium text-gray-700">Обвиняемые:</p>
                  <div className="space-y-2 mt-1">
                    {document.parsed_data.main_accused.map((accused, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-gray-200 rounded p-3"
                      >
                        <p className="font-medium text-gray-900">
                          {accused.fio}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          <span className="font-medium">Контекст:</span>{" "}
                          {accused.before} ... {accused.after}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Дата рождения */}
              {document.parsed_data.birth_date && (
                <div>
                  <p className="font-medium text-gray-700">Дата рождения:</p>
                  <p className="text-gray-900">
                    {document.parsed_data.birth_date}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PDF Viewer (если открыт) */}
      {showPDFViewer && document.pdf_url && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Предпросмотр PDF</h4>
            <button
              onClick={() => setShowPDFViewer(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <EvidenceViewer url={document.pdf_url} />
        </div>
      )}

      {/* Действия */}
      <div className="flex items-center gap-3">
        {document.pdf_url && (
          <button
            onClick={() => setShowPDFViewer(!showPDFViewer)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {showPDFViewer ? "Скрыть PDF" : "Открыть PDF"}
          </button>
        )}

        {document.status === "parsed" && (
          <button
            onClick={() => onProcess(document.id)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
          >
            Обработать
          </button>
        )}

        {document.status === "processed" && (
          <span className="text-sm text-green-600 font-medium">
            ✓ Обработано
          </span>
        )}
      </div>
    </div>
  );
};

export default EmailDocumentCard;