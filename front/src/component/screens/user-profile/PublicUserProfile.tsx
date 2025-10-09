"use client";

import { FC, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import { IComplaint, IHouse, IPublicProfileData, IRental } from "@/component/type/users.interface";
import { useTranslation } from "next-i18next";
import { getCookie } from "@/utils/cookieUtils";
import { useSelector } from "react-redux";
import { RootState } from "@/component/store/store";
import { useApi } from "@/component/hooks/useApi";
import { removeBan } from "@/api/userApi";
import { apiUrl, mediaUrl } from "@/utils/url";
import ViolationForm from "@/component/form/ViolationForm"; // Подключаем наш компонент
import styles from "./PublicUserProfile.module.scss";

const tabs = [
  { key: "info", label: "profile.info" },
  // { key: "apartments", label: "profile.apartments" },
  { key: "complaints", label: "profile.complaints" },
];

const PublicUserProfile: FC = () => {
  const [profileData, setProfileData] = useState<IPublicProfileData | null>(null);
  const [activeTab, setActiveTab] = useState("info");
  const [showViolationForm, setShowViolationForm] = useState(false);

  const { t } = useTranslation("common");
  const router = useRouter();
  const { username } = router.query;
  const [comments, setComments] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [showAddComment, setShowAddComment] = useState(false);
  const [newComment, setNewComment] = useState("");

  const fetchComments = async () => {
    try {
      const res = await fetch(apiUrl(`/comments/?target_user=${username}`));
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddComment = async () => {
    if (!profileData || !currentUserProfile) return;

    // клиентская проверка: нельзя писать себе
    if (profileData.id === currentUserProfile.user.id) {
      setErrorMessage(t("profile.selfError"));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // перед отправкой загружаем актуальные комментарии
      const resCheck = await fetch(apiUrl(`/comments/?target_user=${profileData.username}`), {
        headers: {
          Authorization: `Bearer ${getCookie("access_token") || ""}`,
        },
      });

      const freshComments = await resCheck.json();

      const alreadyWritten = freshComments.filter(
        (c: any) => c.author === currentUserProfile.user.id
      );

      if (alreadyWritten.length >= 2) {
        setErrorMessage(t("profile.limitError"));
        setIsSubmitting(false);
        return;
      }

      // теперь можно постить
      const token = getCookie("access_token");

      const res = await fetch(apiUrl(`/comments/`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ text: newComment, target_user: profileData.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.non_field_errors?.[0] || t("profile.submitError"));
        return;
      }

      setNewComment("");
      setShowAddComment(false);
      fetchComments(); // обновим список
    } catch (err) {
      setErrorMessage(t("profile.connectionError"));
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };








  
  let reviewedComplaints: IComplaint[] = [];

  if (profileData?.complaint_received) {
    reviewedComplaints = profileData.complaint_received.filter(
      (complaint) => complaint.status === "reviewed"
    );
  } else {
    console.warn("No complaint_received data in profileData");
  }


  const { profile: currentUserProfile, loading: currentUserLoading } = useSelector((state: RootState) => state.auth);
  const isOwnProfile = username === currentUserProfile?.user.username;


  const [publicProfileData, setPublicProfileData] = useState<IPublicProfileData | null>(null);
  const [publicProfileLoading, setPublicProfileLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!router.isReady || !username) return;

    const fetchProfile = async () => {
      try {
        setPublicProfileLoading(true);
        setError(null);

        const res = await fetch(apiUrl(`/user/profile/${username}/`), {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getCookie("access_token") || ""}`,
          },
        });

        if (!res.ok) throw new Error("Ошибка загрузки профиля");

        const data = await res.json();
        setPublicProfileData(data);
      } catch (err) {
        setError(err);
      } finally {
        setPublicProfileLoading(false);
      }
    };

    fetchProfile();
  }, [router.isReady, username]);


  useEffect(() => {
    if (publicProfileData) {
      setProfileData(publicProfileData);
    }
  }, [publicProfileData]);

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);


  const loading = currentUserLoading || publicProfileLoading;


  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingContent}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>{t("profile.loading")}</p>
      </div>
    </div>
  );
  if (error) return <div className={styles.errorContainer}>{error.message || 'Ошибка'}</div>;
  if (!profileData) return <div className={styles.notFoundContainer}>{t("profile.profileNotFound")}</div>;

  return (
    <div className={styles.publicUserProfile}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            {/* Profile Info */}
            <div className={styles.profileInfo}>
              <div className={styles.avatarContainer}>
                <div className={styles.avatar}>
                  <Image
                    src={mediaUrl(profileData.avatar || "/media/avatars/def.jpg")}
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
                <h1 className={styles.userName}>
                  {profileData.anonymous_name || profileData.username}
                </h1>
                {profileData.anonymous_name && (
                  <p className={styles.userNameSecondary}>@{profileData.username}</p>
                )}
                <div className={styles.contactInfo}>
                  <div className={styles.contactItem}>
                    <svg className={styles.contactIcon} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span>{profileData.email}</span>
                    {profileData.email_confirmed && (
                      <span className={styles.confirmedBadge}>
                        ✓ {t("profile.confirmed")}
                      </span>
                    )}
                  </div>
                  <div className={styles.contactItem}>
                    <svg className={styles.contactIcon} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span>{profileData.phone_number || t("profile.noPhone")}</span>
                  </div>
                  <div className={styles.contactItem}>
                    <svg className={styles.contactIcon} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{profileData.identifier || t("profile.noIIN")}</span>
                  </div>
                </div>
                <div className={styles.userBadges}>
                  <div className={styles.badge}>
                    <svg className={styles.badgeIcon} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    {profileData.role === "landlord" ? t("profile.landlord") : t("profile.tenant")}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              <button
                onClick={() => setShowAddComment(true)}
                className={styles.actionButton}
              >
                <svg className={styles.actionIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {t("profile.addComment")}
              </button>
              <button
                onClick={() => setShowComments(!showComments)}
                className={styles.actionButton}
              >
                <svg className={styles.actionIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {showComments ? t("profile.hideComments") : t("profile.showComments")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.contentCard}>

          {/* Tabs */}
          <div className={styles.tabsContainer}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`${styles.tabButton} ${
                  activeTab === tab.key
                    ? styles.tabButtonActive
                    : styles.tabButtonInactive
                }`}
              >
                {tab.key === "info" && (
                  <svg className={styles.tabIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {tab.key === "complaints" && (
                  <svg className={styles.tabIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
                {t(tab.label)}
              </button>
            ))}
          </div>

          {/* Violation actions */}
          {!isOwnProfile && currentUserProfile?.user?.is_superuser && (
            <div className={styles.violationActions}>
              {profileData.is_banned ? (
                <button
                  onClick={async () => {
                    try {
                      await removeBan(profileData.id);
                      setProfileData({ ...profileData, is_banned: false });
                    } catch {
                      alert("Ошибка при снятии блокировки");
                    }
                  }}
                  className={`${styles.violationButton} ${styles.violationButtonUnban}`}
                >
                  Снять блокировку
                </button>
              ) : (
                <button
                  onClick={() => setShowViolationForm(true)}
                  className={`${styles.violationButton} ${styles.violationButtonBan}`}
                >
                  Назначить нарушение
                </button>
              )}
            </div>
          )}

          {/* Violation form (переиспользуем компонент) */}
          {showViolationForm && profileData && (
            <div className={styles.violationFormContainer}>
              <ViolationForm targetUserId={profileData.id} />
              <button
                onClick={() => setShowViolationForm(false)}
                className={styles.violationFormCancel}
              >
                Отмена
              </button>
            </div>
          )}

          {/* Info tab */}
          {activeTab === "info" && (
            <div className={styles.tabContent}>
              <div className={styles.infoSection}>
                <h2 className={styles.infoTitle}>{t("profile.accountInfo")}</h2>
                <div className={styles.infoGrid}>
                  <div className={styles.infoCard}>
                    <div className={styles.infoCardHeader}>
                      <div className={`${styles.infoIcon} ${styles.infoIconBlue}`}>
                        <svg className={styles.infoIconSvg} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className={styles.infoLabel}>{t("profile.username")}</p>
                        <p className={styles.infoValue}>{profileData.username}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.infoCard}>
                    <div className={styles.infoCardHeader}>
                      <div className={`${styles.infoIcon} ${styles.infoIconGreen}`}>
                        <svg className={styles.infoIconSvg} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className={styles.infoLabel}>{t("profile.role")}</p>
                        <p className={styles.infoValue}>
                          {profileData.role === "landlord" ? t("profile.landlord") : t("profile.tenant")}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.infoCard}>
                    <div className={styles.infoCardHeader}>
                      <div className={`${styles.infoIcon} ${styles.infoIconOrange}`}>
                        <svg className={styles.infoIconSvg} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className={styles.infoLabel}>{t("profile.iin")}</p>
                        <p className={styles.infoValue}>{profileData.identifier || t("profile.noIIN")}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.infoCard}>
                    <div className={styles.infoCardHeader}>
                      <div className={`${styles.infoIcon} ${styles.infoIconBlue}`}>
                        <svg className={styles.infoIconSvg} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </div>
                      <div>
                        <p className={styles.infoLabel}>{t("profile.email")}</p>
                        <p className={styles.infoValue}>{profileData.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.infoCard}>
                    <div className={styles.infoCardHeader}>
                      <div className={`${styles.infoIcon} ${styles.infoIconGreen}`}>
                        <svg className={styles.infoIconSvg} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                      </div>
                      <div>
                        <p className={styles.infoLabel}>{t("profile.phone")}</p>
                        <p className={styles.infoValue}>{profileData.phone_number || t("profile.noPhone")}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.infoCard}>
                    <div className={styles.infoCardHeader}>
                      <div className={`${styles.infoIcon} ${styles.infoIconPurple}`}>
                        <svg className={styles.infoIconSvg} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className={styles.infoLabel}>{t("profile.verificationStatus")}</p>
                        <p className={styles.infoValue}>
                          {profileData.email_confirmed ? t("profile.confirmed") : t("profile.notConfirmed")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Apartments tab */}
          {activeTab === "apartments" && (
            <div className="bg-white p-4 rounded-lg shadow flex-1 min-w-[280px] mt-4">
              {profileData.role === "landlord" ? (
                <>
                  <h2 className="font-semibold mb-2 text-gray-700">{t("profile.apartments")}</h2>
                  {profileData.houses?.length ? (
                    <ul className="space-y-2">
                      {profileData.houses.map((house: IHouse) => (
                        <li key={house.id} className="bg-gray-100 p-3 rounded-md shadow-sm">
                          <p><strong>{house.address}</strong></p>
                          <p>{t(`profile.${house.type_p}`)} • {t("profile.rooms")}: {house.num_of_rooms}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">{t("profile.noAddedHomes")}</p>
                  )}
                </>
              ) : (
                <>
                  <h2 className="font-semibold mb-2 text-gray-700">{t("profile.apartments")}</h2>
                  {profileData.rentals?.length ? (
                    <ul className="space-y-2">
                      {profileData.rentals.map((rental: IRental) => (
                        <li key={rental.id} className="bg-gray-100 p-3 rounded-md shadow-sm">
                          <p><strong>{rental.house.address}</strong></p>
                          <p>{t(`profile.${rental.house.type_p}`)} • {t("profile.rooms")}: {rental.house.num_of_rooms}</p>
                          <p><strong>{t("profile.rentalStatus")}:</strong> {rental.status}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">{t("profile.noAddedHomes")}</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Complaints tab */}
          {activeTab === "complaints" && (
            <div className="p-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{t("profile.complaints")}</h2>
                
                {reviewedComplaints.length > 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              {t("profile.description")}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              {t("profile.status")}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              {t("profile.date")}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              {t("profile.actions")}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reviewedComplaints.map((complaint: IComplaint) => (
                            <tr key={complaint.id} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                  {complaint.description}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  complaint.status === "reviewed" 
                                    ? "bg-green-100 text-green-800" 
                                    : complaint.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}>
                                  {t(`profile.${complaint.status}`)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {new Date(complaint.created_at).toLocaleString("ru-RU", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Link
                                  href={`/complaints/${complaint.uuid}`}
                                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors duration-200"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  {t("profile.viewDetails")}
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t("profile.noComplaints")}</h3>
                    <p className="text-gray-500">{t("profile.noComplaintsDescription")}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
          {/* Comments Section */}
          <div className="mt-8">
            <div className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">{t("profile.comments")}</h2>
              
              <div className="flex flex-wrap justify-center gap-4 mb-6">
                <button
                  onClick={() => setShowAddComment(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200 font-semibold"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {t("profile.addComment")}
                </button>
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

              {/* Modal for adding comment */}
              {showAddComment && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-gray-100">
                    {/* Header */}
                    <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
                      <div className="absolute inset-0 bg-black/10"></div>
                      <div className="relative p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold">{t("profile.newComment")}</h2>
                              <p className="text-blue-100 text-sm">{t("profile.leaveFeedback")}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowAddComment(false)}
                            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
                          >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-6">
                      <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          {t("profile.commentText")}
                        </label>
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="w-full border-2 border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200 text-gray-700 placeholder-gray-400"
                          rows={5}
                          placeholder={t("profile.commentPlaceholder")}
                        />
                        <div className="mt-2 text-xs text-gray-500">
                          {newComment.length}/500 {t("profile.characters")}
                        </div>
                      </div>
                      
                      {errorMessage && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <p className="text-red-700 text-sm font-medium">{errorMessage}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex justify-end gap-4">
                        <button
                          onClick={() => setShowAddComment(false)}
                          className="px-6 py-3 text-gray-600 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-semibold"
                        >
                          {t("profile.cancel")}
                        </button>
                        <button
                          onClick={handleAddComment}
                          disabled={isSubmitting || !newComment.trim()}
                          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md ${
                            isSubmitting || !newComment.trim()
                              ? "bg-gray-400 cursor-not-allowed text-white"
                              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
                          }`}
                        >
                          {isSubmitting ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              {t("profile.sending")}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                              {t("profile.send")}
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}


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

export default PublicUserProfile;
