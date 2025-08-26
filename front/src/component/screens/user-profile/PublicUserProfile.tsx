"use client";

import { FC, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import { IComplaint, IHouse, IPublicProfileData, IRental } from "@/component/type/users.interface";
import { useTranslation } from "next-i18next";
import { useSelector } from "react-redux";
import { RootState } from "@/component/store/store";
import { useApi } from "@/component/hooks/useApi";
import { removeBan } from "@/api/userApi";
import ViolationForm from "@/component/form/ViolationForm"; // Подключаем наш компонент

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
      const res = await fetch(`http://127.0.0.1:8000/api/comments/?target_user=${username}`);
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

    // клиентская проверка
    if (profileData.id === currentUserProfile.user.id) {
      setErrorMessage(t("profile.selfError"));
      return;
    }

    const alreadyWritten = comments.filter(
      (c) => c.author === currentUserProfile.user.id
    );
    if (alreadyWritten.length >= 2) {
      setErrorMessage(t("profile.limitError"));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const token = localStorage.getItem("access_token");

      const res = await fetch(`http://127.0.0.1:8000/api/comments/`, {
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
      fetchComments();
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

        const res = await fetch(`http://127.0.0.1:8000/api/user/profile/${username}/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
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


  if (loading) return <div>{t("profile.loading")}</div>;
  if (error) return <div className="text-center mt-10 text-red-500">{error.message || 'Ошибка'}</div>;
  if (!profileData) return <div className="text-center mt-10">{t("profile.profileNotFound")}</div>;

  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 bg-gray-50 min-h-screen">
      <div className="w-[90%] max-w-[1900px] bg-white rounded-[10px] shadow-md p-5 my-5 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-6 p-6 border-b border-gray-200 bg-white rounded-lg shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-28 h-28 relative rounded-full overflow-hidden shadow">
              <Image
                src={`http://127.0.0.1:8000${profileData.avatar || "/media/avatars/def.jpg"}`}
                alt="Avatar"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {profileData.anonymous_name || profileData.username}
              </h1>
              {profileData.anonymous_name && (
                <p className="text-sm text-gray-500 mt-1">@{profileData.username}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex justify-center gap-8 border-b mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-2 px-4 font-medium ${
                  activeTab === tab.key
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-blue-600"
                }`}
              >
                {t(tab.label)}
              </button>
            ))}
          </div>

          {/* Violation actions */}
          {!isOwnProfile && currentUserProfile?.user?.is_superuser && (
            <div className="mt-6">
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
                  className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700"
                >
                  Снять блокировку
                </button>
              ) : (
                <button
                  onClick={() => setShowViolationForm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded shadow hover:bg-red-700"
                >
                  Назначить нарушение
                </button>
              )}
            </div>
          )}

          {/* Violation form (переиспользуем компонент) */}
          {showViolationForm && profileData && (
            <div className="mt-4 max-w-lg w-full">
              <ViolationForm targetUserId={profileData.id} />
              <button
                onClick={() => setShowViolationForm(false)}
                className="mt-2 px-4 py-2 border rounded"
              >
                Отмена
              </button>
            </div>
          )}

          {/* Info tab */}
          {activeTab === "info" && (
            <div className="flex flex-wrap gap-5 mt-5">
              <div className="bg-white p-6 rounded-2xl shadow-lg flex-1 min-w-[300px] space-y-4">
                <h2 className="font-semibold text-lg text-gray-800 border-b pb-2">
                  {t("profile.generalInfo")}
                </h2>
                <p className="text-gray-700"><strong>{t("profile.iin")}:</strong> {profileData.identifier}</p>
                <p className="text-gray-700"><strong>{t("profile.role")}:</strong> {profileData.role === "landlord" ? "Арендодатель" : "Арендатор"}</p>
                {/* <p className="text-gray-700"><strong>{t("profile.rating")}:</strong> {profileData.rating}</p> */}
                <p className="text-gray-700"><strong>{t("profile.phone")}:</strong> {profileData.phone_number}</p>
                <p className="text-gray-700 flex items-center">
                  <strong>{t("profile.email")}:</strong> {profileData.email}
                  {/* {profileData.email_confirmed ? (
                    <span className="ml-2 text-green-600 font-semibold bg-green-100 px-2 py-1 rounded-md">
                      {t("profile.verified")}
                    </span>
                  ) : (
                    <Link href="/profile/verify">
                      <button className="ml-3 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
                        {t("profile.notverify")}
                      </button>
                    </Link>
                  )} */}
                </p>
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
            <div className="mt-5 p-4 rounded-lg shadow bg-white">
              <h2 className="font-semibold mb-2 text-gray-700">{t("profile.complaints")}</h2>
              {reviewedComplaints.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border px-4 py-2">{t("profile.description")}</th>
                        <th className="border px-4 py-2">{t("profile.status")}</th>
                        <th className="border px-4 py-2">{t("profile.date")}</th>
                        <th className="border px-4 py-2">{t("profile.details")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewedComplaints.map((complaint: IComplaint) => (
                        <tr key={complaint.id} className="text-center">
                          <td className="border px-4 py-2">{complaint.description}</td>
                          <td className="border px-4 py-2">{t(`profile.${complaint.status}`)}</td>
                          <td className="border px-4 py-2">
                            {new Date(complaint.created_at).toLocaleString("ru-RU", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td>
                            <Link
                              href={`/complaints/${complaint.uuid}`}
                              className="text-blue-600 underline hover:text-blue-800"
                            >
                              {t("profile.details")}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">{t("profile.noComplaints")}</p>
              )}

            </div>
          )}
        </div>
        {/* Комментарии */}
        <div className="mt-8 border-t pt-4">
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setShowAddComment(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
            >
              {t("profile.addComment")}
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="px-4 py-2 bg-gray-600 text-white rounded shadow hover:bg-gray-700"
            >
              {showComments ? t("profile.toggleComments") : t("profile.showComments")}
            </button>
          </div>

          {/* Модалка добавления комментария */}
          {showAddComment && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
                <h2 className="text-lg font-bold mb-3">{t("profile.newComment")}</h2>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full border rounded p-2 mb-2"
                  rows={4}
                  placeholder={t("profile.newComment")}
                />
                {errorMessage && (
                  <p className="text-red-500 text-sm mb-2">{errorMessage}</p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowAddComment(false)}
                    className="px-3 py-1 border rounded"
                  >
                    {t("profile.cancel")}
                  </button>
                  <button
                    onClick={handleAddComment}
                    disabled={isSubmitting}
                    className={`px-3 py-1 rounded text-white ${
                      isSubmitting
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isSubmitting ? t("profile.sending") : t("profile.send")}
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* Список комментариев */}
          {showComments && (
            <div className="mt-4 max-h-500 overflow-y-auto border rounded-lg p-3 bg-gray-50">
              {comments.length > 0 ? (
                comments.map((c) => (
                  <div key={c.id} className="mb-3 p-2 bg-white rounded shadow-sm">
                    <p className="font-semibold text-sm text-gray-700">{c.author_name}</p>
                    <p className="text-gray-800">{c.text}</p>
                    <p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">{t("profile.noComments")}</p>
              )}
              
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PublicUserProfile;
