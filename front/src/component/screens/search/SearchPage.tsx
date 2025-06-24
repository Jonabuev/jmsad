import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Link from "next/link";
import { MyComponent } from "@/component/star/Star";
import { ITenant } from "@/component/type/users.interface";
import { useTranslation } from "next-i18next";

interface IComplaintReason {
  id: number;
  reason: string;
}

const TenantRegistry: React.FC = () => {
  const { t } = useTranslation("common");
  const [activeTab, setActiveTab] = useState<"tenants" | "landlords">("tenants");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [courtScore, setCourtScore] = useState("");
  const [reasons, setReasons] = useState<IComplaintReason[]>([]);
  const [selectedReasons, setSelectedReasons] = useState<number[]>([]);
  const [users, setUsers] = useState<ITenant[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchReasons = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          console.error("No token found");
          return;
        }
        const res = await axios.get("http://127.0.0.1:8000/api/all-complaint-reasons/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        let filteredReasons = res.data;
        if (activeTab === "tenants") {
          filteredReasons = res.data.filter((reason: IComplaintReason) =>
            ["Просрочка платежей", "Порча имущества", "Нарушение условий договора", "Жалобы от соседей / нарушение порядка", "Самовольное выселение или отказ освободить помещение"].includes(reason.reason)
          );
        } else {
          filteredReasons = res.data.filter((reason: IComplaintReason) =>
            ["Отсутствие ремонта помещения", "Игнорирование заявок на устранение неисправностей", "Повышение арендной платы без уведомления", "Отказ предоставить документы на жилье", "Нарушение конфиденциальности жильцов"].includes(reason.reason)
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
      const endpoint =
        activeTab === "tenants"
          ? "http://127.0.0.1:8000/api/tenant-registry1/"
          : "http://127.0.0.1:8000/api/landlords/";
      const res = await axios.get(endpoint, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (error) {
      console.error("Ошибка при загрузке:", error);
    }
  }, [activeTab, router, searchQuery, startDate, endDate, addressQuery, courtScore, selectedReasons]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="max-w-10xl mx-auto p-6 bg-white shadow-md rounded-xl mt-10">
      <h2 className="text-2xl font-bold mb-4">{t("search.tenant_registry")}</h2>
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab("tenants")}
          className={`px-4 py-2 rounded ${activeTab === "tenants" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          {t("search.tenants")}
        </button>
        <button
          onClick={() => setActiveTab("landlords")}
          className={`px-4 py-2 rounded ${activeTab === "landlords" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          {t("search.landlords")}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <input
          type="text"
          placeholder={t("search.placeholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder={t("search.address_placeholder")}
          value={addressQuery}
          onChange={(e) => setAddressQuery(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder={t("search.court_score_placeholder")}
          value={courtScore}
          onChange={(e) => setCourtScore(e.target.value)}
          className="border p-2 rounded"
        />
      </div>
      <fieldset className="mb-4">
        <legend className="font-semibold mb-2">{t("search.filter_reasons")}</legend>
        <div className="flex flex-wrap gap-3">
          {reasons.map((reason) => (
            <label key={reason.id} className="inline-flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedReasons.includes(reason.id)}
                onChange={() => toggleReason(reason.id)}
                className="form-checkbox"
              />
              <span>{t(`search.reason.${reason.reason}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <button
        onClick={fetchUsers}
        className="md:col-span-4 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        {t("search.apply_filters")}
      </button>
      {users.length === 0 ? (
        <p className="text-gray-600">{t("search.no_complaints")}</p>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr className="text-left">
                <th className="border px-4 py-2">{t("search.tenant")}</th>
                <th className="border px-4 py-2">{t("search.iin")}</th>
                <th className="border px-4 py-2">{t("search.complaints_count")}</th>
                <th className="border px-4 py-2">{t("search.complaint_dates")}</th>
                <th className="border px-4 py-2">{t("search.rating")}</th>
                <th className="border px-4 py-2">{t("search.court_scores")}</th>
                <th className="border px-4 py-2">{t("search.complaint_reasons")}</th>
                <th className="border px-4 py-2">{t("search.profile")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.identifier} className="border text-center">
                  <td className="border px-4 py-2">{user.username}</td>
                  <td className="border px-4 py-2">{user.identifier}</td>
                  <td className="border px-4 py-2">{user.complaint_count ?? 0}</td>
                  <td className="border px-4 py-2">
                    {user.complaint_dates && user.complaint_dates.length > 0
                      ? user.complaint_dates
                          .map((date) => new Date(date).toLocaleDateString("ru-RU"))
                          .join(", ")
                      : "-"}
                  </td>
                  <td className="border px-4 py-2">
                    {user.rating ? <MyComponent value={user.rating} /> : "—"}
                  </td>
                  <td className="border px-4 py-2">{user.court_scores || "-"}</td>
                  <td className="border px-4 py-2">
                    {getTranslatedReasons(user.complaint_reasons)}
                  </td>
                  <td className="border px-4 py-2">
                    <Link
                      href={`/user/${user.username}`}
                      className="text-blue-600 underline hover:text-blue-800"
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