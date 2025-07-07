import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { useTranslation } from "next-i18next";

export default function DisputeComplaintPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { uuid } = router.query;

  const [explanation, setExplanation] = useState("");
  const [evidence, setEvidence] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [complaintData, setComplaintData] = useState<any>(null);
  const [userId, setUserId] = useState<number | null>(null);
    
    useEffect(() => {
    const fetchComplaint = async () => {
        const token = localStorage.getItem("access_token");
        if (!token || !uuid) return;

        try {
            const token = localStorage.getItem("access_token");
            if (!token) throw new Error("No token");

            const payload = JSON.parse(atob(token.split(".")[1]));
            setUserId(payload.user_id);
            } catch (err) {
            console.error("Ошибка получения user_id из токена", err);
            setMessage(t("dispute.disputeFailed") || "Ошибка авторизации.");
        }


        const response = await axios.get(`http://127.0.0.1:8000/api/rental-complaints/${uuid}/`, {
        headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Complaint response:", response.data); // 👀
        setComplaintData(response.data);
    };

    if (uuid) fetchComplaint();
    }, [uuid]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    
    const formData = new FormData();
    formData.append("explanation", explanation);
    if (evidence) formData.append("evidence", evidence);
    if (!complaintData) return;

    
    if (complaintData.status !== "reviewed") {
    setMessage(t("dispute.disputeWrongStatus") || "Жалобу можно оспорить только после рассмотрения.");
    setLoading(false);
    return;
    }


    const userDisputes = complaintData.disputes.filter((d: any) => d.user === userId);
    if (userDisputes.length >= 2) {
    setMessage(t("dispute.disputeLimit") || "Вы уже оспаривали эту жалобу 2 раза.");
    setLoading(false);
    return;
    }

    try {
      const token = localStorage.getItem("access_token");
      await axios.post(`http://127.0.0.1:8000/api/complaints/${uuid}/dispute/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage(t("dispute.disputeSuccess") || "Успешно отправлено!");
      setTimeout(() => {
        router.push("/profile");
      }, 2000);
    } catch (err: any) {
      const errorText =
        err?.response?.data?.error || t("dispute.disputeFailed") || "Ошибка при отправке";
      setMessage(errorText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">{t("dispute.disputeTitle")}</h1>
        <label className="block text-red-700 mb-4">
            {t("dispute.desc") || "Пояснение"}
          </label>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">
            {t("dispute.disputeExplanation") || "Пояснение"}
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            required
            className="w-full border px-3 py-2 rounded"
            rows={5}
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">
            {t("dispute.disputeEvidence") || "Документ / Изображение (необязательно)"}
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setEvidence(file);
            }}
          />
        </div>

        {message && <p className="text-sm text-blue-600">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {loading ? t("dispute.loading") : t("dispute.disputeSubmit")}
        </button>
      </form>
    </div>
  );
}
