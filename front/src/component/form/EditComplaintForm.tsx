import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { fetchRentalComplaintByUuid, fetchComplaintReasons, updateRentalComplaint } from "@/api/complaintsApi";

interface ComplaintReason {
  id: number;
  reason: string;
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
    const token = localStorage.getItem("access_token");
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

  // Загрузка причин
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setErrorMessage(t("Scomplaint.authRequired"));
      return;
    }
    fetchComplaintReasons(token)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setComplaintReasons(res.data);
        } else {
          setErrorMessage(t("Scomplaint.invalidDataFormat"));
        }
      })
      .catch(() => {
        setLoadError(true);
        setErrorMessage(t("Scomplaint.loadReasonsError"));
      });
  }, [t]);

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

  const handleCourtDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFormData((prev) => ({ ...prev, courtDocument: e.target.files![0] }));
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

    const token = localStorage.getItem("access_token");
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 mx-auto mb-4"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <p className="text-lg text-gray-600 animate-pulse">{t("Scomplaint.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t("Scomplaint.editTitle")}</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 font-medium">
                    {t("Scomplaint.descriptionedit")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          {loadError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">{t("Scomplaint.loadEditError")}</p>
                </div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700 font-medium">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Description Card */}
            <div className="bg-gray-50 rounded-xl p-6 border-l-4 border-blue-600">
              <div className="flex items-start space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-lg font-semibold text-gray-900 mb-2">
                    {t("Scomplaint.description")}
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] resize-none transition-all duration-200"
                    placeholder={t("Scomplaint.describeComplaint")}
                  />
                </div>
              </div>
            </div>

            {/* Reasons Card */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t("Scomplaint.reasons")}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {complaintReasons
                  .filter((reason) => reason.type === accusedRole)
                  .map((reason) => (
                    <label key={reason.id} className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-all duration-200">
                      <input
                        type="checkbox"
                        checked={formData.reason.includes(reason.id)}
                        onChange={() => handleReasonChange(reason.id)}
                        className="mt-1 rounded text-blue-600 focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-700 leading-relaxed">
                        {t(`Scomplaint.reason.${reason.reason}`)}
                      </span>
                    </label>
                  ))}
              </div>
            </div>

            {/* Photos Card */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t("Scomplaint.additionalPhotos")}</h3>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors duration-200">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files) return;
                    if (files.length > 10) {
                      setErrorMessage(t("Scomplaint.photoerror"));
                      return;
                    }
                    setFormData((prev) => ({
                      ...prev,
                      evidenceImages: Array.from(files).slice(0, 10),
                    }));
                  }}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">{t("Scomplaint.uploadClick")}</span> {t("Scomplaint.uploadOrDrag")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{t("Scomplaint.uploadHint")}</p>
                </label>
              </div>
            </div>

            {/* Court Case Card */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t("Scomplaint.isCourtCase")}</h3>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="isCourtCase"
                  checked={formData.isCourtCase}
                  disabled
                  className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="isCourtCase" className="text-sm font-medium text-gray-700">
                  {t("Scomplaint.isCourtCase")}
                </label>
              </div>

              {formData.isCourtCase && (
                <div className="mt-6 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {t("Scomplaint.damageCost")}
                    </label>
                    <input
                      type="text"
                      name="damageCost"
                      value={formData.damageCost}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Введите сумму ущерба..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {t("Scomplaint.evidence")}
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors duration-200">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,image/*"
                        onChange={handleCourtDocumentChange}
                        className="hidden"
                        id="court-document-upload"
                      />
                      <label htmlFor="court-document-upload" className="cursor-pointer">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">
                          <span className="font-medium text-blue-600 hover:text-blue-500">{t("Scomplaint.uploadDocument")}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{t("Scomplaint.uploadFormats")}</p>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t("Scomplaint.submitting")}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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