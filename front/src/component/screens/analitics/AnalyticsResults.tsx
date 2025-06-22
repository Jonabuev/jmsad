import React from "react";
import Image from "next/image";
import { TFunction } from "i18next";

interface TenantPrediction {
  username: string;
  complaint_count: number;
  complaint_score: number;
  rating: number;
  rf_prediction: "Reliable" | "Unreliable";
  knn_prediction: "Reliable" | "Unreliable";
}

interface AnalyticsData {
  tenants_predictions: TenantPrediction[];
  rating_logreg_graph: string | null;
}

interface AnalyticsResultsProps {
  data: AnalyticsData;
  t: TFunction;
}

const AnalyticsResults: React.FC<AnalyticsResultsProps> = ({ data, t }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 rounded-lg shadow-md">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">{t("analytics.username")}</th>
            <th className="px-4 py-2 text-left">{t("analytics.complaint_count")}</th>
            <th className="px-4 py-2 text-left">{t("analytics.rating")}</th>
            <th className="px-4 py-2 text-left">{t("analytics.prediction")}</th>
          </tr>
        </thead>
        <tbody>
          {data.tenants_predictions.map((tenant, idx) => (
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

      {data.rating_logreg_graph && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">{t("analytics.logreg_chart")}</h2>
          <Image
            src={`data:image/png;base64,${data.rating_logreg_graph}`}
            alt="LogReg Chart"
            width={600}
            height={400}
          />
        </div>
      )}
    </div>
  );
};

export default AnalyticsResults; 