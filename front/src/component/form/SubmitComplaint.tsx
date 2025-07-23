import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { fetchMyRentals, fetchComplaintReasons, submitRentalComplaint } from "@/api/complaintsApi";

interface ComplaintReason {
  id: number;
  reason: string;
}
interface RentalOption {
  id: number;
  house_address: string;
  landlord_iin: string;
}

const SubmitComplaintForm: React.FC = () => {
  const { t } = useTranslation();
  const [complaintReasons, setComplaintReasons] = useState<ComplaintReason[]>([]);
  const [formData, setFormData] = useState({
    rental: "",
    description: "",
    rating: "3",
    reason: [] as number[],
    evidence: null as File | null,
    evidenceImages: [] as File[],
    damageCost: "",
  });

  const [rentals, setRentals] = useState<RentalOption[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  // Загрузка аренды
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    fetchMyRentals(token)
      .then((res) => setRentals(res.data))
      .catch(() => setErrorMessage(t("Scomplaint.loadRentalsError")));
  }, [t]);

  // Загрузка причин для тенанта
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const profile = JSON.parse(localStorage.getItem("profile") || '{}');
    const role = profile?.user?.role || 'guest';
    if (!token || role !== "tenant") return;
    fetchComplaintReasons(token)
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) {
          setComplaintReasons(data);
        } else {
          setErrorMessage(t("Scomplaint.invalidDataFormat"));
        }
      })
      .catch((error) => {
        setErrorMessage(t("Scomplaint.loadReasonsError"));
      });
  }, [t]);

  // Загрузка причин для лендлорда
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const profile = JSON.parse(localStorage.getItem("profile") || '{}');
    const role = profile?.user?.role || 'guest';
    if (!token || role !== "landlord") return;
    fetchComplaintReasons(token)
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) {
          setComplaintReasons(data);
        } else {
          setErrorMessage(t("Scomplaint.invalidDataFormat"));
        }
      })
      .catch((error) => {
        setErrorMessage(t("Scomplaint.loadReasonsError"));
      });
  }, [t]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const token = localStorage.getItem("access_token");
    if (!token) {
      setErrorMessage(t("Scomplaint.authRequired"));
      setIsSubmitting(false);
      return;
    }

    const data = new FormData();
    data.append("rental_id", formData.rental);
    data.append("description", formData.description);
    data.append("rating", formData.rating);
    formData.reason.forEach((id) => data.append("reason", String(id)));
    if (formData.evidence) data.append("evidence", formData.evidence);
    formData.evidenceImages.forEach((file) => {
      data.append("evidence_images", file);
    });
    data.append("damage_cost", formData.damageCost);

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
      if (error.response?.status === 403) {
        setErrorMessage(t("Scomplaint.noActiveRental"));
      }
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("Scomplaint.selectRental")}
          </label>
          <select
            name="rental"
            value={formData.rental}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">{t("Scomplaint.chooseOption")}</option>
            {rentals.map((r) => (
              <option key={r.id} value={r.id}>
                {r.house_address} ({r.landlord_iin})
              </option>
            ))}
          </select>
        </div>

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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("Scomplaint.rating")}
          </label>
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <label key={star} className="flex items-center">
                <input
                  type="radio"
                  name="rating"
                  value={star}
                  checked={formData.rating === String(star)}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span
                  className={`text-xl cursor-pointer ${
                    formData.rating >= String(star)
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                >
                  ★
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
                setFormData((prev) => ({
                  ...prev,
                  evidenceImages: e.target.files ? Array.from(e.target.files).slice(0, 10) : [],
                }));
              }
            }}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("Scomplaint.damageCost")}
          </label>
          <input
            type="number"
            name="damageCost"
            value={formData.damageCost}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, damageCost: e.target.value }))
            }
            required
            className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("Scomplaint.evidence")}
          </label>
          <input
            type="file"
            name="evidence"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

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