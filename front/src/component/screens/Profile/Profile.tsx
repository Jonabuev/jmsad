"use client";
import { FC, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { mediaUrl, apiUrl } from "@/utils/url";

import { IProfileData } from "@/component/type/users.interface";
import { useTranslation } from "next-i18next";

import AdminComplaintsTable from "./admin-section/AdminSection";
import UserSection from "./user-section/UserSection";
import { fetchUserProfile, disputeComplaint } from "@/api/userApi";
import { clearAllTokens } from "@/utils/tokenUtils";
import { getCookie } from "@/utils/cookieUtils";
import styles from "./Profile.module.scss";

const tabs = [
  { key: "info", label: "profile.info" },
  // { key: "apartments", label: "profile.apartments" },
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
  
  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);

  console.log("🔍 Profile компонент загружен");
  console.log("📍 Текущий путь:", router.asPath);
  console.log("📊 Состояние:", { loading, error, profileData: !!profileData });

  const handleLogout = () => {
    clearAllTokens();
    router.push("/login");
  };

  // Comments functions
  const fetchComments = async () => {
    try {
      const res = await fetch(apiUrl(`/comments/?target_user=${profileData?.user.username}`));
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error(err);
    }
  };


  const handleDispute = async (complaintId: number, newDescription = "") => {
    try {
      const token = getCookie("access_token");
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
        // Не показываем предупреждение, если пользователь уже верифицирован
        // Это будет проверено позже в render, когда profileData будет доступен
        setShowVerificationRequired(true);
        // Удаляем параметр из URL
        params.delete("verification_required");
        const newUrl =
          window.location.pathname +
          (params.toString() ? "?" + params.toString() : "");
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, [router, profileData]);

  useEffect(() => {
    const fetchProfileData = async () => {
      // Проверяем, что мы на клиенте
      if (typeof window === 'undefined') return;

      try {
        const token = getCookie("access_token");
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
          
          // Если пользователь верифицирован, скрываем предупреждение о верификации
          if (response.data.user.email_confirmed) {
            setShowVerificationRequired(false);
          }
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

  // Автоматически скрываем предупреждение о верификации, если пользователь уже верифицирован
  useEffect(() => {
    if (profileData?.user?.email_confirmed) {
      setShowVerificationRequired(false);
    }
  }, [profileData]);

  // Load comments when showComments is true
  useEffect(() => {
    if (showComments && profileData) {
      fetchComments();
    }
  }, [showComments, profileData]);

  if (loading) return <div className={styles.loading}>Загрузка...</div>;
  if (error)
    return <div className={styles.error}>{error}</div>;
  if (!profileData)
    return <div className={styles.notFound}>Профиль не найден.</div>;

  return (
    <div className={styles.profile}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <div className={styles.heroLayout}>
            {/* Profile Info */}
            <div className={styles.profileInfo}>
              <div className={styles.avatarContainer}>
                <div className={styles.avatar}>
                  <Image
                    src={mediaUrl(profileData.avatar || profileData.user?.avatar || "/media/avatars/def.jpg")}
                    alt="Avatar"
                    width={128}
                    height={128}
                    className={styles.avatarImage}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = mediaUrl("/media/avatars/def.jpg");
                    }}
                  />
                </div>
                <div className={styles.statusIndicator}>
                  <svg className={styles.statusIcon} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className={styles.userDetails}>
                <h1 className={styles.userName}>{profileData.user.username}</h1>
                <div className={styles.userInfo}>
                  <div className={styles.infoItem}>
                    <svg className={styles.infoIcon} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span>{profileData.user.email}</span>
                    {profileData.user.email_confirmed && (
                      <span className={styles.confirmedBadge}>
                        ✓ {t("profile.confirmed")}
                      </span>
                    )}
                  </div>
                  <div className={styles.infoItem}>
                    <svg className={styles.infoIcon} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span>{profileData.phone_number || t("profile.noPhone")}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <svg className={styles.infoIcon} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{profileData.user.identifier || t("profile.noIIN")}</span>
                  </div>
                </div>
                <div className={styles.userBadges}>
                  {profileData.user.is_superuser && (
                    <div className={`${styles.badge} ${styles.adminBadge}`}>
                      <svg className={styles.badgeIcon} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                      {t("profile.administrator")}
                    </div>
                  )}
                  <div className={`${styles.badge} ${styles.roleBadge}`}>
                    <svg className={styles.badgeIcon} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    {profileData.user.role === "landlord" ? t("profile.landlord") : t("profile.tenant")}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push("/profile/edit-profile")}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 border border-white/30 hover:border-white/50 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t("profile.edit")}
              </button>
              <button
                onClick={() => router.push("/reset-password")}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 border border-white/30 hover:border-white/50 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                {t("profile.changePassword")}
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500/20 backdrop-blur-sm hover:bg-red-500/30 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 border border-red-400/30 hover:border-red-400/50 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {t("profile.logout")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Success Message */}
          {showSuccess && (
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-lg font-semibold text-green-800">Апартамент успешно добавлен!</p>
                </div>
              </div>
            </div>
          )}

          {/* Verification Required */}
          {showVerificationRequired && !profileData?.user?.email_confirmed && (
            <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-semibold text-amber-800 mb-2">Требуется верификация</h3>
                  <p className="text-amber-700 mb-4">
                    Для доступа к реестру пользователей необходимо пройти верификацию личности. 
                    Пожалуйста, загрузите документ для верификации.
                  </p>
                  <button
                    onClick={() => router.push("/profile/verify")}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Пройти верификацию
                  </button>
                </div>
                <button
                  onClick={() => setShowVerificationRequired(false)}
                  className="ml-4 text-amber-600 hover:text-amber-800 text-xl font-bold p-1 hover:bg-amber-100 rounded-full transition-colors duration-200"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          {/* Statistics Cards */}
          {!profileData.user.is_superuser && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
              {/* Document Status Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium mb-1">{t("profile.document")}</p>
                    <p className="text-lg font-bold text-blue-800">
                      {t(`profile.docType.${profileData.user.document_type || "unknown"}`)}
                    </p>
                    {profileData.user.passport_expiry && (
                      <p className="text-xs text-blue-600 mt-1">
                        {t("profile.until")}: {new Date(profileData.user.passport_expiry).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                {profileData.user.passport_expiry && new Date(profileData.user.passport_expiry) < new Date() && (
                  <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-xs font-semibold flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {t("profile.expired")}
                    </p>
                  </div>
                )}
              </div>

              {/* Sent Complaints Card */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium mb-1">{t("profile.sentComplaintsCount")}</p>
                    <p className="text-2xl font-bold text-green-800">
                      {profileData.complaint_send?.length || 0}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {profileData.complaint_send?.filter(c => c.status === 'reviewed').length || 0} {t("profile.approvedCount")}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Received Complaints Card */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium mb-1">{t("profile.receivedComplaintsCount")}</p>
                    <p className="text-2xl font-bold text-orange-800">
                      {profileData.complaint_received?.length || 0}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      {profileData.complaint_received?.filter(c => c.status === 'pending').length || 0} {t("profile.underReview")}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Verification Status Card */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium mb-1">{t("profile.verificationStatus")}</p>
                    <p className="text-lg font-bold text-purple-800">
                      {profileData.user.email_confirmed ? t("profile.confirmed") : t("profile.notConfirmed")}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      {profileData.user.email_confirmed ? t("profile.fullAccess") : t("profile.limitedAccess")}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    profileData.user.email_confirmed ? 'bg-green-500' : 'bg-yellow-500'
                  }`}>
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Section */}
          {!profileData.user.is_superuser && (
            <UserSection
              profileData={profileData}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              t={t}
              handleDispute={handleDispute}
              tabs={tabs}
            />
          )}

          {/* Admin Section */}
          {profileData?.user.is_superuser && (
            <AdminComplaintsTable complaints={profileData.admin_complaints} />
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{t("profile.comments")}</h2>
            
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <button
                onClick={() => setShowComments(!showComments)}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg shadow-md transition-all duration-200 font-semibold ${
                  showComments 
                    ? "bg-gray-600 text-white hover:bg-gray-700" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {showComments ? t("profile.hideComments") : t("profile.showComments")}
              </button>
            </div>


            {/* Comments List */}
            {showComments && (
              <div className="mt-6">
                {comments.length > 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <div className="space-y-4 p-6">
                        {comments.map((c) => (
                          <div key={c.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {c.author_name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-gray-800">{c.author_name}</h4>
                                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                                    {new Date(c.created_at).toLocaleDateString("ru-RU", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                <p className="text-gray-700 leading-relaxed">{c.text}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t("profile.noComments")}</h3>
                    <p className="text-gray-500">{t("profile.noCommentsDescription")}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
