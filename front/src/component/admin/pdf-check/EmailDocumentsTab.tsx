import { FC, useState, useEffect } from "react";
import { useTranslation } from "next-i18next";
import {
  fetchEmailDocuments,
  processEmailDocument,
  triggerEmailParsing,
} from "@/api/emailDocumentApi";
import { EmailDocument } from "@/types/emailDocument";

import ProcessDocumentModal from "./ProcessDocumentModal";
import EmailDocumentCard from "./EmailDocumentCard";

const EmailDocumentsTab: FC = () => {
  const { t } = useTranslation("common");
  const [documents, setDocuments] = useState<EmailDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [senderFilter, setSenderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("parsed");

  const [selectedDocument, setSelectedDocument] = useState<EmailDocument | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [senderFilter, statusFilter]);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchEmailDocuments({
        sender: senderFilter || undefined,
        status: statusFilter || undefined,
      });

      setDocuments(response.data.documents);
    } catch (err: any) {
      setError(err.response?.data?.error || t("pdfCheck.errorLoading"));
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerParsing = async () => {
    setIsParsing(true);

    try {
      await triggerEmailParsing(senderFilter || undefined);
      alert(t("pdfCheck.parsingStarted"));
      setTimeout(() => {
        loadDocuments();
      }, 2000);
    } catch (err: any) {
      alert(err.response?.data?.error || t("pdfCheck.errorParsing"));
    } finally {
      setIsParsing(false);
    }
  };

  const handleProcessDocument = (documentId: number) => {
    const doc = documents.find((d) => d.id === documentId);
    if (doc) {
      setSelectedDocument(doc);
      setIsModalOpen(true);
    }
  };

  const handleSubmitProcess = async (formData: any) => {
    if (!selectedDocument) return;

    await processEmailDocument(selectedDocument.id, formData);
    setIsModalOpen(false);
    loadDocuments();
  };

  return (
    <div className="space-y-6">
      {/* Фильтры и кнопки */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("pdfCheck.senderFilter")}
            </label>
            <input
              type="email"
              value={senderFilter}
              onChange={(e) => setSenderFilter(e.target.value)}
              placeholder="example@mail.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("pdfCheck.statusFilter")}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t("pdfCheck.allStatuses")}</option>
              <option value="pending">{t("pdfCheck.statusPending")}</option>
              <option value="parsed">{t("pdfCheck.statusParsed")}</option>
              <option value="processed">{t("pdfCheck.statusProcessed")}</option>
              <option value="error">{t("pdfCheck.statusError")}</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={loadDocuments}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t("pdfCheck.refresh")}
            </button>
            <button
              onClick={handleTriggerParsing}
              disabled={isParsing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {isParsing ? t("pdfCheck.parsing") : t("pdfCheck.parseEmails")}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {t("pdfCheck.totalDocuments")}:{" "}
            <span className="font-semibold text-gray-900">{documents.length}</span>
          </div>
        </div>
      </div>

      {/* Список документов */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 mt-4">{t("pdfCheck.loading")}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {!loading && !error && documents.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-gray-600 mt-4">{t("pdfCheck.noDocuments")}</p>
          <button
            onClick={handleTriggerParsing}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {t("pdfCheck.parseEmails")}
          </button>
        </div>
      )}

      {!loading && !error && documents.length > 0 && (
        <div className="space-y-4">
          {documents.map((doc) => (
            <EmailDocumentCard
              key={doc.id}
              document={doc}
              onProcess={handleProcessDocument}
            />
          ))}
        </div>
      )}

      {selectedDocument && (
        <ProcessDocumentModal
          document={selectedDocument}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitProcess}
        />
      )}
    </div>
  );
};

export default EmailDocumentsTab;