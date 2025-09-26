// pages/admin/pdf-check/index.tsx
import React, { FC, useState } from "react";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import AdminLayout from "@/component/admin/AdminLayout";
import axios from "axios";
import { apiUrl } from "@/utils/url";

const PDFCheckPage: FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("pdf_file", file);

    try {
        // Используем централизованную функцию для формирования URL
        const response = await axios.post(apiUrl("/pdf/"), formData, {
            headers: {
            "Content-Type": "multipart/form-data",
            },
        });
        setResult(response.data);
        } catch (err: any) {
        setError(err.response?.data?.error || "Upload failed");
        } finally {
        setLoading(false);
        }
    };

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">PDF Check</h1>

        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="border p-2 mb-4"
        />

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload & Check"}
        </button>

        {error && <p className="text-red-600 mt-4">{error}</p>}

        {result && (
          <div className="mt-6 bg-gray-50 p-4 rounded shadow">
            <h2 className="font-semibold mb-2">Results:</h2>
            <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PDFCheckPage;

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", ["common"])),
    },
  };
};
