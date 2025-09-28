// pages/admin/pdf-check/index.tsx
import React, { FC, useState } from "react";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import AdminLayout from "@/component/admin/AdminLayout";
import axios from "axios";
import { apiUrl } from "@/utils/url";

interface Candidate {
  fio: string;
  birth_date: string;
  court_decision_score?: string;
  after: string;
}

const PDFCheckPage: FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Candidate | null>(null);

  const [description, setDescription] = useState("");
  const [courtNumber, setCourtNumber] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // выбор PDF-файла
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setCandidates([]);
      setSelected(null);
      setError(null);
      setSuccess(null);
    }
  };

  // загрузка PDF и парсинг
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("pdf_file", file);

    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(apiUrl("/pdf/"), formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: token ? `Bearer ${token}` : "",
         },
      });

      setCandidates(
        Array.isArray(response.data.main_accused)
          ? response.data.main_accused.map((a: any) => ({
              fio: a.fio,
              after: a.after,
              birth_date: response.data.birth_date,
              court_decision_score: Array.isArray(response.data.case_numbers)
                ? response.data.case_numbers[0]?.replace(/^№\s?/, "")
                : String(response.data.case_numbers || "").replace(/^№\s?/, ""),
            }))
          : []
      );
    } catch (err: any) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  // отправка жалобы
  const handleSubmit = async () => {
    if (!selected || !file) return; // важно: файл обязателен

    const formData = new FormData();
    formData.append("fio", selected.fio);
    formData.append("birth_date", selected.birth_date);
    formData.append("complaint_description", description);
    formData.append("court_decision_score", courtNumber);
    formData.append("is_court_case", "true"); // всегда true
    formData.append("evidence", file); // тот же файл уходит как доказательство

    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(apiUrl("/user_pdf/"), formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: token ? `Bearer ${token}` : "",
         },
        
      });
      setSuccess("Жалоба успешно создана (ID: " + response.data.complaint_id + ")");
    } catch (err: any) {
      setError(err.response?.data?.error || "Submit failed");
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">PDF Check</h1>

        {/* выбор PDF */}
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="border p-2 mb-4"
        />
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Uploading..." : "Upload & Check"}
        </button>

        {error && <p className="text-red-600 mt-4">{error}</p>}
        {success && <p className="text-green-600 mt-4">{success}</p>}

        {/* список кандидатов */}
        {candidates.length > 0 && (
          <div className="mt-6">
            <h2 className="font-semibold mb-2">Найденные кандидаты:</h2>
            <ul className="space-y-2">
              {candidates.map((c, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelected(c);
                    setCourtNumber(c.court_decision_score || "");
                  }}
                  className={`cursor-pointer p-3 border rounded-lg mb-2 ${
                    selected?.fio === c.fio ? "bg-blue-100 border-blue-500" : "bg-white"
                  }`}
                >
                  <div className="text-lg font-semibold">{c.fio}</div>
                  <div className="text-sm text-gray-600">{c.after}</div>
                </div>
              ))}
            </ul>
          </div>
        )}

        {/* форма жалобы */}
        {selected && (
          <div className="mt-6 bg-gray-50 p-4 rounded shadow">
            <h2 className="font-semibold mb-2">Создать жалобу для: {selected.fio}</h2>

            <input
              type="text"
              placeholder="Номер дела"
              value={courtNumber}
              onChange={(e) => setCourtNumber(e.target.value)}
              className="w-full border p-2 mb-2"
            />
            
            <textarea
              placeholder="Описание жалобы"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border p-2 mb-2"
            />

            <input
              type="text"
              placeholder="Дата рождения (ДД.ММ.ГГГГ)"
              value={selected?.birth_date || ""}
              onChange={(e) =>
                setSelected(selected ? { ...selected, birth_date: e.target.value } : null)
              }
              className="w-full border p-2 mb-2"
            />

            <button
              onClick={handleSubmit}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Отправить жалобу
            </button>
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
