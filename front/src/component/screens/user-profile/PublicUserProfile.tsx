"use client";

import { FC, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import {
  IComplaint,
  IHouse,
  IPublicProfileData,
  IRental,
} from "@/component/type/users.interface";
import { useTranslation } from "next-i18next";
import { useSelector } from "react-redux";
import { RootState } from "@/component/store/store";
import { useApi } from "@/component/hooks/useApi";

const tabs = [
  { key: "info", label: "profile.info" },
  { key: "apartments", label: "profile.apartments" },
  { key: "complaints", label: "profile.complaints" },
];


const PublicUserProfile: FC = () => {
  const [profileData, setProfileData] = useState<IPublicProfileData | null>(null);
  const [activeTab, setActiveTab] = useState("info");
  const { t } = useTranslation("common");
  const router = useRouter();
  const { username } = router.query;
  const [showViolationForm, setShowViolationForm] = useState(false);
  const [violationReasons, setViolationReasons] = useState<string[]>([]);
  const [violationMessage, setViolationMessage] = useState("");

  const { profile: currentUserProfile, loading: currentUserLoading } = useSelector((state: RootState) => state.auth);

  const isOwnProfile = username === currentUserProfile?.user.username;

  const { data: publicProfileData, loading: publicProfileLoading, error } = useApi<IPublicProfileData>(
    `/user/profile/${username}/`,
    {},
    { skip: !username || isOwnProfile }
  );

  useEffect(() => {
    if (isOwnProfile) {
      setProfileData(currentUserProfile as IPublicProfileData);
    } else if (publicProfileData) {
      setProfileData(publicProfileData);
    }
  }, [username, currentUserProfile, publicProfileData]);

  const loading = currentUserLoading || publicProfileLoading;

  if (loading) return <div>Загрузка...</div>;
  if (error)
    return <div className="text-center mt-10 text-red-500">{error.message || 'Ошибка'}</div>;
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
                  profileData.avatar || "/media/avatars/def.jpg"
                }`}
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
                <p className="text-sm text-gray-500 mt-1">
                  @{profileData.username}
                </p>
              )}
            </div>
          </div>
        </div>

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
            {!isOwnProfile && currentUserProfile?.user?.is_superuser && (
              <div className="mt-6">
                {profileData.is_banned ? (
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch("http://127.0.0.1:8000/api/remove-ban/", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                          },
                          body: JSON.stringify({ user_id: profileData.id }),
                        });

                        const result = await res.json();
                        if (res.ok) {
                          setViolationMessage("Блокировка снята");
                          setProfileData({ ...profileData, is_banned: false });
                        } else {
                          setViolationMessage(result.error || "Ошибка при снятии блокировки");
                        }
                      } catch {
                        setViolationMessage("Ошибка при отправке запроса");
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

          {showViolationForm && (
            <div className="mt-4 bg-white border p-4 rounded shadow max-w-lg w-full">
              <h3 className="text-lg font-semibold mb-3">Выберите причины нарушения:</h3>
              <div className="space-y-2">
                {[
                  "Нарушение договора",
                  "Оскорбительное поведение",
                  "Фейковый аккаунт",
                  "Жалобы от арендаторов",
                  "Мошенничество",
                ].map((reason) => (
                  <label key={reason} className="block">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={violationReasons.includes(reason)}
                      onChange={() => {
                        setViolationReasons((prev) =>
                          prev.includes(reason)
                            ? prev.filter((r) => r !== reason)
                            : [...prev, reason]
                        );
                      }}
                    />
                    {reason}
                  </label>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={async () => {
                    if (violationReasons.length === 0) {
                      setViolationMessage("Выберите хотя бы одну причину");
                      return;
                    }

                    try {
                      const res = await fetch("http://127.0.0.1:8000/api/issue-violation/", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                        },
                        body: JSON.stringify({
                          user_id: profileData.id,
                          reason: violationReasons.join("; "),
                        }),
                      });
                      console.log("Отправка:", {
                        user_id: profileData.id,
                        reason: violationReasons.join("; "),
                      });
                      if (res.ok) {
                        setViolationMessage("Нарушение успешно назначено");
                        setViolationReasons([]);
                      } else {
                        const data = await res.json();
                        setViolationMessage(data.error || "Ошибка при отправке");
                      }
                    } catch (e) {
                      setViolationMessage("Ошибка при отправке запроса");
                    }
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded"
                >
                  Подтвердить
                </button>
                <button
                  onClick={() => setShowViolationForm(false)}
                  className="px-4 py-2 border rounded"
                >
                  Отмена
                </button>
              </div>
              {violationMessage && (
                <p className="mt-2 text-sm text-gray-700">{violationMessage}</p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-5 mt-5">
            {/* Общая информация */}
            {activeTab === "info" && (
              <div className="bg-white p-6 rounded-2xl shadow-lg flex-1 min-w-[300px] space-y-4">
                <h2 className="font-semibold text-lg text-gray-800 border-b pb-2">
                  {t("profile.generalInfo")}
                </h2>
                <p className="text-gray-700 text-base">
                  <strong className="text-gray-900">{t("profile.iin")}:</strong>{" "}
                  {profileData.identifier}
                </p>

                <p className="text-gray-700 text-base">
                  <strong className="text-gray-900">
                    {t("profile.role")}:
                  </strong>{" "}
                  {profileData.role === "landlord"
                    ? "Арендодатель"
                    : "Арендатор"}
                </p>
                <p className="text-gray-700 text-base">
                  <strong className="text-gray-900">
                    {t("profile.rating")}:
                  </strong>{" "}
                  {profileData.rating}
                </p>

                <p className="text-gray-700 text-base">
                  <strong className="text-gray-900">
                    {t("profile.phone")}:
                  </strong>{" "}
                  {profileData.phone_number}
                </p>

                <p className="text-gray-700 text-base flex items-center">
                  <strong className="text-gray-900">
                    {t("profile.email")}:
                  </strong>{" "}
                  {profileData.email}{" "}
                  {profileData.email_confirmed ? (
                    <span className="ml-2 text-green-600 font-semibold bg-green-100 px-2 py-1 rounded-md">
                      {t("profile.verified")}
                    </span>
                  ) : (
                    <Link href="/profile/verify">
                      <button className="ml-3 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
                        {t("profile.notverify")}
                      </button>
                    </Link>
                  )}
                </p>
              </div>
            )}

            {/* Блок аренды / недвижимости */}
            {activeTab === "apartments" && (
              <div className="bg-white p-4 rounded-lg shadow flex-1 min-w-[280px]">
                {profileData.role === "landlord" ? (
                  <>
                    {/* Если арендодатель — показываем апартаменты */}
                    <h2 className="font-semibold mb-2 text-gray-700">
                      Апартаменты
                    </h2>
                    {profileData.houses && profileData.houses.length > 0 ? (
                      <ul className="space-y-2">
                        {profileData.houses.map((house: IHouse) => (
                          <li
                            key={house.id}
                            className="bg-gray-100 p-3 rounded-md shadow-sm"
                          >
                            <p>
                              <strong>{house.address}</strong>
                            </p>
                            <p>
                              {t(`profile.${house.type_p}`)} • Комнат:{" "}
                              {house.num_of_rooms}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">
                        {t("profile.noAddedHomes")}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    {/* Если арендатор — показываем аренды */}
                    <h2 className="font-semibold mb-2 text-gray-700">Аренды</h2>
                    {profileData.rentals && profileData.rentals.length > 0 ? (
                      <ul className="space-y-2">
                        {profileData.rentals.map((rental: IRental) => (
                          <li
                            key={rental.id}
                            className="bg-gray-100 p-3 rounded-md shadow-sm"
                          >
                            <p>
                              <strong>{rental.house.address}</strong>
                            </p>
                            <p>
                              {t(`profile.${rental.house.type_p}`)} • Комнат:{" "}
                              {rental.house.num_of_rooms}
                            </p>
                            <p>
                              <strong>{t("profile.rentalStatus")} :</strong>{" "}
                              {rental.status}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">
                        {t("profile.noAddedHomes")}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {activeTab === "complaints" && (
            <div className="mt-5 p-4 rounded-lg shadow bg-white">
              <h2 className="font-semibold mb-2 text-gray-700">Жалобы</h2>
              {profileData.complaint_received &&
              profileData.complaint_received.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {t("profile.receivedComplaints")}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border px-4 py-2">
                            {t("profile.description")}
                          </th>
                          <th className="border px-4 py-2">
                            {t("profile.status")}
                          </th>
                          <th className="border px-4 py-2">
                            {t("profile.date")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {profileData.complaint_received?.map(
                          (complaint: IComplaint) => (
                            <tr key={complaint.id} className="text-center">
                              <td className="border px-4 py-2">
                                {complaint.description}
                              </td>
                              <td className="border px-4 py-2">
                                {t(`profile.${complaint.status}`)}
                              </td>
                              <td className="border px-4 py-2">
                                {new Date(complaint.created_at).toLocaleString(
                                  "ru-RU",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Нет жалоб.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicUserProfile;
