import axios from "axios";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";

import ComplaintInfo from "./complaint-info/ComplaintInfo";
import ComplaintActionsButtons from "./complaint-action/ComplaintsActions";
import { useAuthProfile } from "@/component/hooks/complaint/useAuthProfile";
import { useComplaint } from "@/component/hooks/complaint/useComplaint";
import { updateComplaintStatus } from "@/api/complaintsApi";

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
      await updateComplaintStatus(complaintId, status);

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 mx-auto mb-4"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <p className="text-lg text-gray-600 animate-pulse">{t("loading")}</p>
        </div>
      </div>
    );
  }
  
  if (!complaint) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("complaint.notFound")}</h2>
          <p className="text-gray-600">Жалоба не найдена или была удалена</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t("complaint.title")} №{complaint.id}
              </h1>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  complaint.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  complaint.status === 'reviewed' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    complaint.status === 'pending' ? 'bg-yellow-400' :
                    complaint.status === 'reviewed' ? 'bg-green-400' :
                    'bg-red-400'
                  }`}></span>
                  {t(`complaint.${complaint.status}`)}
                </span>
                <span className="text-sm text-gray-500">
                  Создано: {new Date(complaint.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Complaint Info */}
          <ComplaintInfo complaint={complaint} t={t} />

          {/* Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Edit Button - Show for complaint owner */}
                {profile?.user.id === complaint.complainant?.id && (
                  <a
                    href={`/complaints/${uuid}/edit`}
                    className="inline-flex items-center px-6 py-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Редактировать жалобу
                  </a>
                )}

                {/* Dispute Button - Show for accused user when complaint is reviewed */}
                {profile?.user.id === complaint.accused?.id && complaint.status === "reviewed" && (
                  <a
                    href={`/complaints/${uuid}/dispute`}
                    className="inline-flex items-center px-6 py-3 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Оспорить жалобу
                  </a>
                )}
              </div>

              {/* Admin Actions */}
              {profile?.user.is_superuser && complaint.status === "pending" && (
                <div className="w-full sm:w-auto">
                  <ComplaintActionsButtons
                    complaint={complaint}
                    t={t}
                    onUpdate={handleStatusUpdate}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
