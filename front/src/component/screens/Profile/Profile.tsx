"use client";
import { FC, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";

import { IProfileData } from "@/component/type/users.interface";
import { useTranslation } from "next-i18next";

import AdminComplaintsTable from "./admin-section/AdminSection";
import UserSection from "./user-section/UserSection";
import { fetchUserProfile, disputeComplaint } from "@/api/userApi";

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

  const handleLogout = () => {
    localStorage.removeItem("access_token");
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
    }
  }, [router]);

  useEffect(() => {
    const fetchProfileData = async () => {
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
                  profileData.avatar || profileData.user?.avatar || ""
                }`}
                alt="Avatar"
                fill
                className="object-cover"
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
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-center">
            Апартамент успешно добавлен!
          </div>
        )}
        {!profileData.user.is_superuser && (
        <>
          {/* === Документ: тип + дата === */}
          <div className="p-4 mt-4 border border-yellow-400 bg-yellow-100 text-yellow-800 rounded-lg">
            <p>
              {t("profile.documentType")}:{" "}
              <strong>{t(`editProfile.docType.${profileData.user.document_type || "unknown"}`)}</strong>
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
