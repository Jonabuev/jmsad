import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { MyComponent } from "@/component/star/Star";
import { ITenant } from "@/component/type/users.interface";
import { useTranslation } from "next-i18next";
import { fetchComplaintReasons, fetchTenants, fetchLandlords } from "@/api/searchApi";
import { getVerificationStatus } from "@/api/userApi";
import { useSelector } from "react-redux";
import { RootState } from "@/component/store/store";

interface IComplaintReason {
  id: number;
  reason: string;
}

const TenantRegistry: React.FC = () => {
  const { t } = useTranslation("common");
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<"tenants" | "landlords">("tenants");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [courtScore, setCourtScore] = useState("");
  const [reasons, setReasons] = useState<IComplaintReason[]>([]);
  const [selectedReasons, setSelectedReasons] = useState<number[]>([]);
  const [users, setUsers] = useState<ITenant[]>([]);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [verificationChecked, setVerificationChecked] = useState(false);
  const router = useRouter();

  // Функция для проверки статуса верификации
  const checkVerificationStatus = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }
      const response = await getVerificationStatus();
      const isUserVerified = response.data.is_verified ?? response.data.email_confirmed;
      setIsVerified(isUserVerified);
      if (!isUserVerified) {
        router.push("/profile?verification_required=true");
      }

    } catch (error: any) {
      console.error("Ошибка при проверке статуса верификации:", error);
      
      // Проверяем тип ошибки
      if (error.response?.status === 401) {
        // Только при ошибке авторизации перенаправляем на логин
        router.push("/login");
      } else {
        // При других ошибках (сеть, сервер) не перенаправляем
        // Просто устанавливаем статус как неверифицированный
        setIsVerified(false);
      }
    }
  };

  // Проверяем верификацию при загрузке компонента
  useEffect(() => {
    // Добавляем задержку для восстановления токенов при перезагрузке
    const timeoutId = setTimeout(() => {
      const token = localStorage.getItem("access_token");
      
      if (token && !verificationChecked) {
        // Если есть токен, но isAuthenticated еще false (при перезагрузке)
        checkVerificationStatus();
        setVerificationChecked(true);
      } else if (isAuthenticated && !verificationChecked) {
        // Если isAuthenticated уже true
        checkVerificationStatus();
        setVerificationChecked(true);
      } else if (!token && !isAuthenticated) {
        // Если нет токена и не авторизован
        router.push("/login");
      }
    }, 200); // Даем время на восстановление токенов

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, verificationChecked]); // Добавляем verificationChecked в зависимости

  useEffect(() => {
    const fetchReasons = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          console.error("No token found");
          return;
        }
        const res = await fetchComplaintReasons();
        let filteredReasons = res.data;
        if (activeTab === "tenants") {
          filteredReasons = res.data.filter((reason: IComplaintReason) =>
            [
              "Просрочка платежей",
              "Порча имущества",
              "Нарушение условий договора",
              "Жалобы от соседей / нарушение порядка",
              "Самовольное выселение или отказ освободить помещение",
            ].includes(reason.reason)
          );
        } else {
          filteredReasons = res.data.filter((reason: IComplaintReason) =>
            [
              "Отсутствие ремонта помещения",
              "Игнорирование заявок на устранение неисправностей",
              "Повышение арендной платы без уведомления",
              "Отказ предоставить документы на жилье",
              "Нарушение конфиденциальности жильцов",
            ].includes(reason.reason)
          );
        }
        setReasons(filteredReasons);
      } catch (error) {
        console.error("Ошибка загрузки причин жалоб:", error);
      }
    };
    fetchReasons();
  }, [activeTab]);

  const toggleReason = (id: number) => {
    setSelectedReasons((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const getTranslatedReasons = (reasonsStr: string) => {
    if (!reasonsStr) return "-";
    const keys = reasonsStr.split(",").map((s) => s.trim()).filter(Boolean);
    return keys.map((key) => t(`search.reason.${key}`)).join(", ");
  };

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }
      const params: Record<string, string> = {};
      if (searchQuery) params.search = searchQuery;
      if (startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      }
      if (addressQuery) params.address = addressQuery;
      if (courtScore) params.court_decision_score = courtScore;
      if (selectedReasons.length > 0) {
        params.reasons = selectedReasons.join(",");
      }
      let res;
      if (activeTab === "tenants") {
        res = await fetchTenants(params, token);
      } else {
        res = await fetchLandlords(params, token);
      }
      setUsers(res.data);
    } catch (error) {
      console.error("Ошибка при загрузке:", error);
    }
  }, [activeTab, router, searchQuery, startDate, endDate, addressQuery, courtScore, selectedReasons]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Показываем загрузку пока проверяем верификацию или восстанавливаем токены
  if (isVerified === null || (!isAuthenticated && localStorage.getItem("access_token"))) {
    return (
      <div className="max-w-7xl mx-auto p-8 bg-white shadow-lg rounded-2xl mt-8">
        <div className="flex justify-center items-center h-40">
          <div className="text-xl text-gray-600 font-medium">{t("loading")}</div>
        </div>
      </div>
    );
  }

  // Если пользователь не верифицирован, не показываем контент (будет редирект)
  if (!isVerified) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Заголовок с двуязычным названием */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t("profile.search.title")}
          </h1>
          
        </div>

        {/* Табы */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => setActiveTab("tenants")}
            className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
              activeTab === "tenants" 
                ? "bg-blue-600 text-white shadow-lg transform scale-105" 
                : "bg-white text-gray-700 hover:bg-gray-50 shadow-md border border-gray-200"
            }`}
          >
            {t("profile.search.tenants")}
          </button>
          <button
            onClick={() => setActiveTab("landlords")}
            className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
              activeTab === "landlords" 
                ? "bg-blue-600 text-white shadow-lg transform scale-105" 
                : "bg-white text-gray-700 hover:bg-gray-50 shadow-md border border-gray-200"
            }`}
          >
            {t("profile.search.landlords")}
          </button>
        </div>
        {/* Секция поиска и фильтров */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("profile.search.fullName")}
              </label>
              <input
                type="text"
                placeholder={t("profile.search.fullNamePlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("search.iin")}
              </label>
              <input
                type="text"
                placeholder={t("profile.search.iinPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("profile.search.address")}
              </label>
              <input
                type="text"
                placeholder={t("profile.search.addressPlaceholder")}
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("profile.search.courtDecisionNumber")}
              </label>
              <input
                type="text"
                placeholder={t("profile.search.courtDecisionPlaceholder")}
                value={courtScore}
                onChange={(e) => setCourtScore(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
              />
            </div>
          </div>

          {/* Диапазон дат */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("profile.search.from")}
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
                />
                <div className="absolute right-3 top-3 text-gray-400">
                  📅
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("profile.search.to")}
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
                />
                <div className="absolute right-3 top-3 text-gray-400">
                  📅
                </div>
              </div>
            </div>
          </div>
          {/* Причины жалоб */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">{t("search.complaintReasons")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reasons.map((reason) => (
                <label key={reason.id} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 cursor-pointer border border-gray-200">
                  <input
                    type="checkbox"
                    checked={selectedReasons.includes(reason.id)}
                    onChange={() => toggleReason(reason.id)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700 font-medium">{reason.reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={fetchUsers}
              className="bg-green-600 text-white py-4 px-8 rounded-xl font-semibold hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {t("profile.search.search")}
            </button>
            <Link
              href="/profile/add-complaint"
              className="bg-blue-600 text-white py-4 px-8 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-center"
            >
              {t("profile.search.submitComplaint")}
            </Link>
          </div>
        </div>




        {/* Результаты поиска */}
        {users.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-xl">{t("search.noData")}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      {activeTab === "tenants" ? t("search.tenant") : t("search.landlord")}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      {t("profile.search.iin")}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      {t("profile.search.complaintCount")}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      {t("profile.search.complaintDates")}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      {t("profile.search.courtDecisionNumber")}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      {t("profile.search.complaintReasonsColumn")}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      {t("profile.search.profile")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user, index) => (
                    <tr key={user.identifier} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                        {user.identifier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.complaint_count ?? 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.complaint_dates && user.complaint_dates.length > 0
                          ? user.complaint_dates
                              .map((date) => new Date(date).toLocaleDateString("ru-RU"))
                              .join(", ")
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.court_scores || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                        <div className="truncate">
                          {getTranslatedReasons(user.complaint_reasons)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/user/${user.username}`}
                          className="text-blue-600 hover:text-blue-800 transition-colors duration-200 font-semibold"
                        >
                          {t("profile.search.viewProfile")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Пагинация */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {t("profile.search.showingRecords", { count: users.length })}
                </div>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                    {t("profile.search.previous")}
                  </button>
                  <button className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg">
                    1
                  </button>
                  <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                    2
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-500">...</span>
                  <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                    10
                  </button>
                  <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                    {t("profile.search.next")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantRegistry;