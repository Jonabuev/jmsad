import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "next-i18next";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Image from "next/image";

interface Prediction {
  index: number;
  description: string;
  predicted_label: string;
  prob_reliable: number;
  prob_unreliable: number;
  true_label: string;
}

const TenantsTable: React.FC = () => {
  const { t } = useTranslation();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/analitics/") // Make sure this URL is correct in your urls.py
      .then((res) => {
        const data = res.data;
        setPredictions(data);

        // Calculate model accuracy
        const correctPredictions = data.filter(
          (item: Prediction) => item.predicted_label === item.true_label
        ).length;

        const accuracy = (correctPredictions / data.length) * 100;
        setAccuracy(accuracy);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading predictions:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>{t("loading")}</div>;

  return (
    <div className="p-4 overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">{t("model_predictions.title")}</h2>
      {accuracy !== null && (
        <div className="mb-4 text-lg font-semibold">
          {t("model_predictions.accuracy")}: {accuracy.toFixed(2)}%
        </div>
      )}
      <table className="min-w-full border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">#</th>
            <th className="border px-2 py-1 text-left">
              {t("model_predictions.description")}
            </th>
            <th className="border px-2 py-1">
              {t("model_predictions.prob_reliable")}
            </th>
            <th className="border px-2 py-1">
              {t("model_predictions.prob_unreliable")}
            </th>
            <th className="border px-2 py-1">
              {t("model_predictions.prediction")}
            </th>
            <th className="border px-2 py-1">
              {t("model_predictions.true_label")}
            </th>
          </tr>
        </thead>
        <tbody>
          {predictions.map((item) => (
            <tr key={item.index} className="hover:bg-gray-50">
              <td className="border px-2 py-1 text-center">{item.index}</td>
              <td className="border px-2 py-1">{item.description}</td>

              <td className="border px-2 py-1 text-center">
                {item.prob_reliable}
              </td>
              <td className="border px-2 py-1 text-center">
                {item.prob_unreliable}
              </td>
              <td
                className={`border px-2 py-1 text-center font-semibold ${
                  item.predicted_label === t("model_predictions.unreliable")
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {item.predicted_label}
              </td>
              <td
                className={`border px-2 py-1 text-center ${
                  item.true_label === t("model_predictions.unreliable")
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              >
                {item.true_label}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Image src="http://127.0.0.1:8000/api/roc-curve/" alt="ROC" />
    </div>
  );
};

export default TenantsTable;

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
