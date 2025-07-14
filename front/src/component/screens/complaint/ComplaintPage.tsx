import axios from "axios";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";

import ComplaintInfo from "./complaint-info/ComplaintInfo";
import ComplaintActionsButtons from "./complaint-action/ComplaintsActions";
import { useAuthProfile } from "@/component/hooks/complaint/useAuthProfile";
import { useComplaint } from "@/component/hooks/complaint/useComplaint";

export default function ComplaintDetailPage() {
  const router = useRouter();
  const { uuid } = router.query;
  const { t } = useTranslation("common");

  const { profile, setProfile, authLoading } = useAuthProfile();
  const { complaint, loading } = useComplaint(uuid);

  const handleStatusUpdate = async (
    complaintId: number,
    status: "reviewed" | "rejected"
  ) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      await axios.post(
        `http://127.0.0.1:8000/api/complaints1/${complaintId}/status/`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          complaint_admin: prev.admin_complaints?.map((c) =>
            c.id === complaintId ? { ...c, status } : c
          ),
        };
      });
    } catch (err) {
      alert("Ошибка при обновлении статуса жалобы");
      console.error(err);
    }
  };

  if (authLoading || loading) return <p className="p-4">{t("loading")}</p>;
  if (!complaint) return <p className="p-4">{t("complaint.notFound")}</p>;
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-xlc">
      <h1 className="text-2xl font-bold mb-4">
        {t("complaint.title")} №{complaint.id}
      </h1>

      <ComplaintInfo complaint={complaint} t={t} />


      {profile?.user.is_superuser && complaint.status === "pending" && (
        <ComplaintActionsButtons
          complaint={complaint}
          t={t}
          onUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}
