"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";

interface TenantPrediction {
  username: string;
  complaint_count: number;
  complaint_score: number;
  rating: number;
  rf_prediction: "Reliable" | "Unreliable";
  knn_prediction: "Reliable" | "Unreliable";
}

const AnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<TenantPrediction[]>([]);
  const [chartBase64, setChartBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await axios.get(
          "http://127.0.0.1:8000/api/analiticsML/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setData(response.data.tenants_predictions);
        setChartBase64(response.data.rating_logreg_graph || null);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.error || t("analytics.load_error"));
        } else {
          setError(t("analytics.unknown_error"));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [t]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{t("analytics.title")}</h1>

      {loading ? (
        <p>{t("loading")}</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg shadow-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">
                  {t("analytics.username")}
                </th>
                <th className="px-4 py-2 text-left">
                  {t("analytics.complaint_count")}
                </th>
                <th className="px-4 py-2 text-left">{t("analytics.rating")}</th>
                <th className="px-4 py-2 text-left">
                  {t("analytics.prediction")}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((tenant, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{tenant.username}</td>
                  <td className="px-4 py-2">{tenant.complaint_count}</td>
                  <td className="px-4 py-2">{tenant.rating}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`font-semibold ${
                        tenant.knn_prediction === "Unreliable"
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {tenant.rf_prediction}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {chartBase64 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">
                {t("analytics.logreg_chart")}
              </h2>
              <Image
                src={`data:image/png;base64,${chartBase64}`}
                alt="LogReg Chart"
                width={600}
                height={400}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", [
        "common",
        "analytics",
      ])),
    },
  };
};
