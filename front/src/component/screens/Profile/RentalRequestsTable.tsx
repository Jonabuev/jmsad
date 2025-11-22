import React, { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { getCookie } from "@/utils/cookieUtils";
import { fetchRentalRequests, updateRentalStatus } from "@/api/rentalApi";

interface RentalRequest {
  id: number;
  tenant_name: string;
  house_address: string;
  status: "pending" | "active" | "ended" | "declined" | "cancelled";
  start_date: string;
}

const RentalRequestsTable: React.FC = () => {
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const { t } = useTranslation("common");

  const fetchRequests = async () => {
    // Проверяем, что мы на клиенте
    if (typeof window === 'undefined') return;

    const token = getCookie("access_token");
    if (!token) return setError("Нет токена авторизации");

    try {
      const { data } = await fetchRentalRequests(token);
      setRequests(data);
    } catch (err) {
      console.error("Ошибка загрузки заявок:", err);
      setError("Ошибка загрузки заявок");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    id: number,
    newStatus: "active" | "declined"
  ) => {
    // Проверяем, что мы на клиенте
    if (typeof window === 'undefined') return;

    const token = getCookie("access_token");
    if (!token) return;

    setUpdatingStatusId(id);
    try {
      await updateRentalStatus(id, newStatus, token);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error("Ошибка обновления статуса:", err);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (loading) return <p>{t("loading") || "Загрузка..."}</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold mb-4">
        {t("rentalTable.rentalRequests")}
      </h2>
      {requests.length === 0 ? (
        <p>{t("rentalTable.noRequests")}</p>
      ) : (
        <table className="w-full table-auto border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">{t("rentalTable.tenant")}</th>
              <th className="border p-2">{t("rentalTable.address")}</th>
              <th className="border p-2">{t("rentalTable.date")}</th>
              <th className="border p-2">{t("rentalTable.status")}</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(
              ({ id, tenant_name, house_address, start_date, status }) => (
                <tr key={id}>
                  <td className="border p-2">{tenant_name}</td>
                  <td className="border p-2">{house_address}</td>
                  <td className="border p-2">
                    {new Date(start_date).toLocaleDateString()}
                  </td>
                  <td className="border p-2">
                    {status === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateStatus(id, "active")}
                          disabled={updatingStatusId === id}
                          className="px-2 py-1 bg-green-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {updatingStatusId === id ? (
                            <>
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {t("loading") || "Загрузка..."}
                            </>
                          ) : (
                            t("rentalTable.accept")
                          )}
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(id, "declined")}
                          disabled={updatingStatusId === id}
                          className="px-2 py-1 bg-red-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {updatingStatusId === id ? (
                            <>
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {t("loading") || "Загрузка..."}
                            </>
                          ) : (
                            t("rentalTable.decline")
                          )}
                        </button>
                      </div>
                    ) : (
                      t(`rentalTable.statuses.${status}`)
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RentalRequestsTable;
