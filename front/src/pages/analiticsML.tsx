"use client";

import React from "react";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { useApi } from "@/component/hooks/useApi";
import dynamic from "next/dynamic";

const AnalyticsResults = dynamic(() => import("@/component/screens/analitics/AnalyticsResults"), {
  ssr: false,
});

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

const AnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const { data: analyticsData, loading, error } = useApi<AnalyticsData>('/analiticsML/');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{t("analytics.title")}</h1>

      {loading ? (
        <p>{t("loading")}</p>
      ) : error ? (
        <p className="text-red-500">{error.message || t("analytics.load_error")}</p>
      ) : analyticsData && (
        <AnalyticsResults data={analyticsData} t={t} />
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
