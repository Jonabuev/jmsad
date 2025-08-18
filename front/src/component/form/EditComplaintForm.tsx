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

  if (isLoading) return <p>{t("Scomplaint.loading")}</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 border rounded-xl shadow-sm bg-white">
      <h2 className="text-2xl font-bold mb-4">{t("Scomplaint.editTitle")}</h2>
      <label className="block text-sm font-medium text-red-700 mb-4">
        {t("Scomplaint.descriptionedit")}
      </label>

      {loadError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {t("Scomplaint.loadEditError")}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("Scomplaint.description")}
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("Scomplaint.reasons")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {complaintReasons
              .filter((reason) => reason.type === accusedRole)
              .map((reason) => (
                <label key={reason.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.reason.includes(reason.id)}
                    onChange={() => handleReasonChange(reason.id)}
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm">
                    {t(`Scomplaint.reason.${reason.reason}`)}
                  </span>
                </label>
              ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("Scomplaint.additionalPhotos")}
          </label>
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
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isCourtCase"
            checked={formData.isCourtCase}
            disabled
            className="rounded text-blue-600"
          />
          <label htmlFor="isCourtCase" className="text-sm font-medium text-gray-700">
            {t("Scomplaint.isCourtCase")}
          </label>
        </div>

        {formData.isCourtCase && (
          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("Scomplaint.damageCost")}
              </label>
              <input
                type="text"
                name="damageCost"
                value={formData.damageCost}
                onChange={handleChange}
                className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("Scomplaint.evidence")}
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,image/*"
                onChange={handleCourtDocumentChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isSubmitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isSubmitting ? t("Scomplaint.submitting") : t("Scomplaint.submitedit")}
        </button>
      </form>
    </div>
  );
};

export default EditComplaintForm;