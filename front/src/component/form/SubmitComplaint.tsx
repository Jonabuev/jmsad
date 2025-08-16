import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { fetchComplaintReasons, submitRentalComplaint, searchUsersByIin } from "@/api/complaintsApi";

interface ComplaintReason {
  id: number;
  reason: string;
}

interface UserSuggestion {
  identifier: string;
  full_name: string;
}

const SubmitComplaintForm: React.FC = () => {
  const { t } = useTranslation();
  const [complaintReasons, setComplaintReasons] = useState<ComplaintReason[]>([]);
  const [formData, setFormData] = useState({
  accusedIin: "",
  description: "",
  reason: [] as number[],
  evidence: null as File | null,
  evidenceImages: [] as File[],
  damageCost: "",
  isCourtCase: false,
  courtDecisionNumber: "",
  courtDocument: null as File | null,
});


  const [iinSuggestions, setIinSuggestions] = useState<UserSuggestion[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  // Загрузка причин
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    fetchComplaintReasons(token)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setComplaintReasons(res.data);
        } else {
          setErrorMessage(t("Scomplaint.invalidDataFormat"));
        }
      })
      .catch(() => setErrorMessage(t("Scomplaint.loadReasonsError")));
  }, [t]);

  // Обработчик изменения полей
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "accusedIin") {
      if (value.length > 12) {
        setErrorMessage("ИИН не может быть длиннее 12 символов");
      } else {
        setErrorMessage("");
      }

      // Подсказки по ИИН (например, только если больше 5 символов)
      if (value.length >= 5 && value.length <= 12) {
        const token = localStorage.getItem("access_token");
        if (token) {
          searchUsersByIin(value, token)
            .then((res) => {
              setIinSuggestions(res.data.slice(0, 3));
            })
            .catch(() => setIinSuggestions([]));
        }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (formData.accusedIin.length !== 12) {
      setErrorMessage("Введите корректный ИИН (12 символов)");
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
    if (formData.isCourtCase) {
      if (formData.damageCost) {
        data.append("damage_cost", formData.damageCost);
      }
      if (formData.evidence) {
        data.append("evidence", formData.evidence);
      }
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
    <div className="max-w-xl mx-auto mt-10 p-4 border rounded-xl shadow-sm bg-white">
      <h2 className="text-2xl font-bold mb-4">{t("Scomplaint.title")}</h2>

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
        {/* Поле для ИИН */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("Scomplaint.iin")}
          </label>
          <input
            type="text"
            name="accusedIin"
            value={formData.accusedIin}
            maxLength={12}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
            placeholder={t("Scomplaint.iinplace")}
          />
          {/* Подсказки */}
          {iinSuggestions.length > 0 && (
            <ul className="mt-2 border rounded bg-white shadow-md divide-y">
              {iinSuggestions.map((u, idx) => (
                <li
                  key={idx}
                  className="cursor-pointer p-2 hover:bg-blue-50"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, accusedIin: u.identifier }))
                  }
                >
                  <div className="text-lg font-semibold text-gray-900">{u.identifier}</div>
                  <div className="text-sm text-gray-500">{u.full_name}</div>
                </li>
              ))}
            </ul>
          )}

        </div>

        {/* Остальное без изменений */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("Scomplaint.description")}
          </label>
          <textarea
            name="description"
            placeholder={t("Scomplaint.describeComplaint")}
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
            {complaintReasons.map((reason) => (
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

            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>   
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isCourtCase"
            checked={formData.isCourtCase}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, isCourtCase: e.target.checked }))
            }
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
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    courtDocument: e.target.files ? e.target.files[0] : null,
                  }))
                }
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
          {isSubmitting ? t("Scomplaint.submitting") : t("Scomplaint.submit")}
        </button>
      </form>
    </div>
  );
};

export default SubmitComplaintForm;
