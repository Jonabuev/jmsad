import React, { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
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
  const { t } = useTranslation("common");

  const fetchRequests = async () => {
    const token = localStorage.getItem("access_token");
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
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      await updateRentalStatus(id, newStatus, token);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error("Ошибка обновления статуса:", err);
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
                          className="px-2 py-1 bg-green-500 text-white rounded"
                        >
                          {t("rentalTable.accept")}
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(id, "declined")}
                          className="px-2 py-1 bg-red-500 text-white rounded"
                        >
                          {t("rentalTable.decline")}
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
