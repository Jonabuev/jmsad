import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import React from "react";
import { useTranslation } from "react-i18next";

export default function TermsAndPolicyPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-8">{t("termsPolicy.title")}</h1>

      {/* 1. Accuracy of Published Information */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">
          {t("termsPolicy.section1.title")}
        </h2>
        <p>{t("termsPolicy.section1.description")}</p>
        <h3 className="text-xl font-semibold mt-4 mb-2">
          {t("termsPolicy.section1.prohibited.title")}
        </h3>
        <ul className="list-disc list-inside space-y-1">
          <li>{t("termsPolicy.section1.prohibited.items.0")}</li>
          <li>{t("termsPolicy.section1.prohibited.items.1")}</li>
          <li>{t("termsPolicy.section1.prohibited.items.2")}</li>
        </ul>
        <h3 className="text-xl font-semibold mt-4 mb-2">
          {t("termsPolicy.section1.allowed.title")}
        </h3>
        <ul className="list-disc list-inside space-y-1">
          <li>{t("termsPolicy.section1.allowed.items.0")}</li>
          <li>{t("termsPolicy.section1.allowed.items.1")}</li>
        </ul>
        <h3 className="text-xl font-semibold mt-4 mb-2">
          {t("termsPolicy.section1.sanctions.title")}
        </h3>
        <p>{t("termsPolicy.section1.sanctions.description")}</p>
      </section>

      {/* 2. Confidentiality and Protection of Personal Data */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">
          {t("termsPolicy.section2.title")}
        </h2>
        <h3 className="text-xl font-semibold mb-2">
          {t("termsPolicy.section2.prohibited.title")}
        </h3>
        <ul className="list-disc list-inside space-y-1">
          <li>{t("termsPolicy.section2.prohibited.items.0")}</li>
          <li>{t("termsPolicy.section2.prohibited.items.1")}</li>
          <li>{t("termsPolicy.section2.prohibited.items.2")}</li>
        </ul>
        <h3 className="text-xl font-semibold mt-4 mb-2">
          {t("termsPolicy.section2.allowed.title")}
        </h3>
        <ul className="list-disc list-inside space-y-1">
          <li>{t("termsPolicy.section2.allowed.items.0")}</li>
          <li>{t("termsPolicy.section2.allowed.items.1")}</li>
        </ul>
        <h3 className="text-xl font-semibold mt-4 mb-2">
          {t("termsPolicy.section2.sanctions.title")}
        </h3>
        <p>{t("termsPolicy.section2.sanctions.description")}</p>
      </section>

      {/* 3 - 10 sections follow similarly */}
      {Array.from({ length: 8 }, (_, i) => (
        <section className="mb-10" key={i + 3}>
          <h2 className="text-2xl font-semibold mb-4">
            {t(`termsPolicy.section${i + 3}.title`)}
          </h2>
          <p>{t(`termsPolicy.section${i + 3}.description`)}</p>
          {t(`termsPolicy.section${i + 3}.additional`, {
            defaultValue: "",
          }) && (
            <p className="mt-2">
              {t(`termsPolicy.section${i + 3}.additional`)}
            </p>
          )}
        </section>
      ))}

      {/* Warnings System */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">
          {t("termsPolicy.warningsSystem.title")}
        </h2>
        <table className="w-full border border-gray-300 mt-4 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">
                {t("termsPolicy.warningsSystem.table.headers.0")}
              </th>
              <th className="border p-2">
                {t("termsPolicy.warningsSystem.table.headers.1")}
              </th>
              <th className="border p-2">
                {t("termsPolicy.warningsSystem.table.headers.2")}
              </th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((row) => (
              <tr key={row}>
                <td className="border p-2">
                  {t(`termsPolicy.warningsSystem.table.rows.${row}.violation`)}
                </td>
                <td className="border p-2">
                  {t(
                    `termsPolicy.warningsSystem.table.rows.${row}.firstMeasure`
                  )}
                </td>
                <td className="border p-2">
                  {t(`termsPolicy.warningsSystem.table.rows.${row}.repeat`)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", [
        "termsPolicy",
        "common",
      ])),
    },
  };
};
