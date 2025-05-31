import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Link from "next/link";
import { MyComponent } from "@/component/star/Star";
import { ITenant } from "@/component/type/users.interface";
import { useTranslation } from "next-i18next"; // Импортируем useTranslation

const TenantRegistry: React.FC = () => {
  const { t } = useTranslation("common"); // Используем хук для перевода
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const router = useRouter();
  const [tenants, setTenants] = useState<ITenant[]>([]);

  const fetchComplaints = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const profileRes = await axios.get("http://127.0.0.1:8000/api/profile/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const profile = profileRes.data;

      if (!profile.user.email_confirmed) {
        router.push("/profile");
        return;
      }

      const params: Record<string, string> = {};
      if (searchQuery) params.search = searchQuery;
      if (startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      }

      const res = await axios.get(
        "http://127.0.0.1:8000/api/tenant-registry1/",
        {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTenants(res.data);
    } catch (error) {
      console.error("Ошибка при загрузке жалоб:", error);
    }
  }, [router, searchQuery, startDate, endDate]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  return (
    <div className="max-w-10xl mx-auto p-6 bg-white shadow-md rounded-xl mt-10">
      <h2 className="text-2xl font-bold mb-4">{t("search.tenant_registry")}</h2>
      {/* Фильтры */}
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
        <button
          onClick={fetchComplaints}
          className="md:col-span-4 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {t("search.apply_filters")}
        </button>
      </div>
      {tenants.length === 0 ? (
        <p className="text-gray-600">{t("search.no_complaints")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr className="text-left">
                <th className="border px-4 py-2">{t("search.tenant")}</th>
                <th className="border px-4 py-2">{t("search.iin")}</th>
                <th className="border px-4 py-2">
                  {t("search.complaints_count")}
                </th>
                <th className="border px-4 py-2">{t("search.entry_date")}</th>
                <th className="border px-4 py-2">{t("search.rating")}</th>
                <th className="border px-4 py-2">{t("search.profile")}</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.identifier} className="border text-center">
                  <td className="border px-4 py-2">{tenant.username}</td>
                  <td className="border px-4 py-2">{tenant.identifier}</td>
                  <td className="border px-4 py-2">
                    {tenant.complaint_count ?? 0}
                  </td>
                  <td className="border px-4 py-2">
                    {tenant.r_date
                      ? new Date(tenant.r_date).toLocaleDateString("ru-RU")
                      : "-"}
                  </td>

                  <td className="border px-4 py-2">
                    {tenant.rating ? (
                      <MyComponent value={tenant.rating} />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="border px-4 py-2">
                    <Link
                      href={`/user/${tenant.username}`}
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
