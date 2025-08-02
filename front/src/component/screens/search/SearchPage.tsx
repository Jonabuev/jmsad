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
      setIsVerified(response.data.is_verified);
      
      // Если пользователь не верифицирован, перенаправляем в профиль
      if (!response.data.is_verified) {
        router.push("/profile?verification_required=true");
        return;
      }
    } catch (error) {
      console.error("Ошибка при проверке статуса верификации:", error);
      router.push("/login");
    }
  };

  // Проверяем верификацию при загрузке компонента
  useEffect(() => {
    if (isAuthenticated) {
      checkVerificationStatus();
    } else {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

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

  // Показываем загрузку пока проверяем верификацию
  if (isVerified === null) {
    return (
      <div className="max-w-7xl mx-auto p-8 bg-white shadow-lg rounded-2xl mt-8">
        <div className="flex justify-center items-center h-40">
          <div className="text-xl text-gray-600 font-medium">{t("common.loading")}</div>
        </div>
      </div>
    );
  }

  // Если пользователь не верифицирован, не показываем контент (будет редирект)
  if (!isVerified) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto p-8 bg-white shadow-lg rounded-2xl mt-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">{t("search.tenant_registry")}</h2>
      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => setActiveTab("tenants")}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            activeTab === "tenants" 
              ? "bg-blue-600 text-white shadow-md" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {t("search.tenants")}
        </button>
        <button
          onClick={() => setActiveTab("landlords")}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            activeTab === "landlords" 
              ? "bg-blue-600 text-white shadow-md" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {t("search.landlords")}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <input
          type="text"
          placeholder={t("search.placeholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
        <input
          type="text"
          placeholder={t("search.address_placeholder")}
          value={addressQuery}
          onChange={(e) => setAddressQuery(e.target.value)}
          className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
        <input
          type="text"
          placeholder={t("search.court_score_placeholder")}
          value={courtScore}
          onChange={(e) => setCourtScore(e.target.value)}
          className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
      </div>
      <fieldset className="mb-8">
        <legend className="font-semibold mb-4 text-lg text-gray-700">{t("search.filter_reasons")}</legend>
        <div className="flex flex-wrap gap-4">
          {reasons.map((reason) => (
            <label key={reason.id} className="inline-flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedReasons.includes(reason.id)}
                onChange={() => toggleReason(reason.id)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">{t(`search.reason.${reason.reason}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <button
        onClick={fetchUsers}
        className="w-full md:w-auto bg-blue-600 text-white py-3 px-8 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg"
      >
        {t("search.apply_filters")}
      </button>
      {users.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">{t("search.no_complaints")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("search.tenant")}</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("search.iin")}</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("search.complaints_count")}</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("search.complaint_dates")}</th>
                {/* <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("search.rating")}</th> */}
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("search.court_scores")}</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("search.complaint_reasons")}</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("search.profile")}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.identifier} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.identifier}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.complaint_count ?? 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.complaint_dates && user.complaint_dates.length > 0
                      ? user.complaint_dates
                          .map((date) => new Date(date).toLocaleDateString("ru-RU"))
                          .join(", ")
                      : "-"}
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.rating ? <MyComponent value={user.rating} /> : "—"}
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.court_scores || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {getTranslatedReasons(user.complaint_reasons)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/user/${user.username}`}
                      className="text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium"
                    >
                      {t("search.profile")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TenantRegistry;