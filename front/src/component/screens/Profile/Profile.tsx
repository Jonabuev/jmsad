"use client";
import { FC, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";

import { IProfileData } from "@/component/type/users.interface";
import { useTranslation } from "next-i18next";

import AdminComplaintsTable from "./admin-section/AdminSection";
import UserSection from "./user-section/UserSection";
import { fetchUserProfile, disputeComplaint } from "@/api/userApi";
import { clearAllTokens } from "@/utils/tokenUtils";

const tabs = [
  { key: "info", label: "profile.info" },
  { key: "apartments", label: "profile.apartments" },
  { key: "complaints", label: "profile.complaints" },
];

const Profile: FC = () => {
  const [profileData, setProfileData] = useState<IProfileData | null>(null);
  const [activeTab, setActiveTab] = useState("info");

  const { t } = useTranslation("common");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [showSuccess, setShowSuccess] = useState(false);
  const [showVerificationRequired, setShowVerificationRequired] = useState(false);

  const handleLogout = () => {
    clearAllTokens();
    router.push("/login");
  };

  const handleDispute = async (complaintId: number, newDescription = "") => {
    try {
      const token = localStorage.getItem("access_token");
      await disputeComplaint(complaintId, newDescription, token!);

      // Обновить статус локально
      setProfileData((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          complaint_send: prev.complaint_send.map((c) =>
            c.id === complaintId ? { ...c, status: "pending" } : c
          ),
        };
      });

      alert("Жалоба отправлена на повторное рассмотрение.");
    } catch (err) {
      alert("Ошибка при оспаривании жалобы.");
      console.error(err);
    }
  };

  useEffect(() => {
    if (router && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("success") === "1") {
        setShowSuccess(true);
        // Удаляем параметр из URL, чтобы уведомление не появлялось снова при обновлении
        params.delete("success");
        const newUrl =
          window.location.pathname +
          (params.toString() ? "?" + params.toString() : "");
        window.history.replaceState({}, "", newUrl);
      }
      
      // Проверяем параметр verification_required
      if (params.get("verification_required") === "true") {
        setShowVerificationRequired(true);
        // Удаляем параметр из URL
        params.delete("verification_required");
        const newUrl =
          window.location.pathname +
          (params.toString() ? "?" + params.toString() : "");
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, [router]);

  useEffect(() => {
    const fetchProfileData = async () => {
      // Проверяем, что мы на клиенте
      if (typeof window === 'undefined') return;

      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          router.push("/login");
          return;
        }

        console.log("Fetching profile data...");
        const response = await fetchUserProfile();

        console.log("Profile response:", response.data);

        if (response.data) {
          setProfileData(response.data);
          console.log(response.data);
        } else {
          console.error("Empty response data");
          setError("Не удалось загрузить данные профиля.");
        }
        setLoading(false);
      } catch (err: any) {
        console.error("Profile fetch error:", err);
        if (err.response?.status === 403) {
          setError("У вас нет доступа к этой странице.");
          router.push("/login");
        } else {
          setError("Ошибка при загрузке профиля.");
        }
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [router]);

  if (loading) return <div>Загрузка...</div>;
  if (error)
    return <div className="text-center mt-10 text-red-500">{error}</div>;
  if (!profileData)
    return <div className="text-center mt-10">Профиль не найден.</div>;

  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 bg-gray-50 min-h-screen">
      <div className="w-[90%] max-w-[1900px] bg-white rounded-[10px] shadow-md p-5 my-5 min-h-screen flex flex-col">
        <div className="flex items-center justify-between flex-wrap gap-6 p-6 border-b border-gray-200 bg-white rounded-lg shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-28 h-28 relative rounded-full overflow-hidden shadow">
              <Image
                src={`http://127.0.0.1:8000${
                  profileData.avatar || profileData.user?.avatar || "/media/avatars/def.jpg"
                }`}
                alt="Avatar"
                fill
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "http://127.0.0.1:8000/media/avatars/def.jpg";
                }}
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              {profileData.user.username}
            </h1>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/profile/edit-profile")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              {t("profile.edit")}
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              {t("profile.logout")}
            </button>
          </div>
        </div>
                 {showSuccess && (
           <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 rounded-xl shadow-sm">
             <div className="flex items-center justify-center">
               <svg className="w-6 h-6 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
               </svg>
               <span className="font-semibold text-lg">Апартамент успешно добавлен!</span>
             </div>
           </div>
         )}
                 {showVerificationRequired && (
           <div className="mb-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 text-yellow-800 rounded-xl shadow-sm">
             <div className="flex items-start justify-between">
               <div className="flex-1">
                 <div className="flex items-center mb-3">
                   <svg className="w-6 h-6 text-yellow-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                     <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                   </svg>
                   <h3 className="font-bold text-xl text-yellow-800">Требуется верификация</h3>
                 </div>
                 <p className="mb-4 text-yellow-700 leading-relaxed">
                   Для доступа к реестру пользователей необходимо пройти верификацию личности. 
                   Пожалуйста, загрузите документ для верификации.
                 </p>
                 <button
                   onClick={() => router.push("/profile/verify")}
                   className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                 >
                   Пройти верификацию
                 </button>
               </div>
               <button
                 onClick={() => setShowVerificationRequired(false)}
                 className="text-yellow-600 hover:text-yellow-800 text-2xl font-bold ml-4 p-1 hover:bg-yellow-100 rounded-full transition-colors duration-200"
               >
                 ×
               </button>
             </div>
           </div>
         )}
        {!profileData.user.is_superuser && (
        <>
          {/* === Документ: тип + дата === */}
          <div className="p-4 mt-4 border border-yellow-400 bg-yellow-100 text-yellow-800 rounded-lg">
            <p>
              {t("profile.documentType")}:{" "}
              <strong>{t(`profile.docType.${profileData.user.document_type || "unknown"}`)}</strong>
            </p>
            <p>
              {t("profile.passportExpiry")}:{" "}
              <strong>
                {profileData.user.passport_expiry
                  ? new Date(profileData.user.passport_expiry).toLocaleDateString()
                  : t("profile.noExpiryDate")}
              </strong>
            </p>
            {new Date(profileData.user.passport_expiry) < new Date() && (
              <p className="mt-2 text-red-600 font-semibold">
                {t("profile.documentExpired")}
              </p>
            )}
          </div>

          <UserSection
            profileData={profileData}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            t={t}
            handleDispute={handleDispute}
            tabs={tabs}
          />
        </>
        )}


        {profileData?.user.is_superuser && (
          <AdminComplaintsTable complaints={profileData.admin_complaints} />
        )}
      </div>
    </div>
  );
};

export default Profile;
