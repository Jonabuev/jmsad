import React, { useEffect, useState } from "react";
import { IProfile } from "@/component/type/users.interface";
import { useTranslation } from "next-i18next";
import { fetchUserProfile, verifyIdentity } from "@/api/userApi";

const VerifyIdentityForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<IProfile | null>(null);
  const { t } = useTranslation("common");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      // Проверяем, что мы на клиенте
      if (typeof window === 'undefined') return;

      const token = localStorage.getItem("access_token");
      if (!token) return;
      try {
        const response = await fetchUserProfile();
        setProfile(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке профиля:", error);
      }
    };
    fetchProfileData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Вы не авторизованы.");
      setLoading(false);
      return;
    }

    if (!file) {
      setError("Пожалуйста, выберите файл.");
      setLoading(false);
      return;
    }

    const user = profile?.user;
    if (!user || !user.username ) {
      setError("Ошибка: данные пользователя не загружены.");
      setLoading(false);
      return;
    }

    const textsToFind = [user.username, user.identifier];

    const formData = new FormData();
    formData.append("id_document", file);
    formData.append("texts_to_find", JSON.stringify(textsToFind));
    formData.append("passport_expiry", user.passport_expiry || "");
    formData.append("document_type", user.document_type || "");
    if (user.document_type === "visa" && user.visa_number) {
      formData.append("visa_number", user.visa_number);
    }

    try {
      const response = await verifyIdentity(formData, token);
      setMessage(response.data.message || "Успешно отправлено!");
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Ошибка при верификации документа."
      );
      console.error("Ошибка сервера:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md space-y-4"
    >
      <h2 className="text-xl font-bold">{t("verify.identityVerification")}</h2>

      <input
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "Отправка..." : "Отправить документ"}
      </button>

      {message && <p className="text-green-600">{message}</p>}
      {error && <p className="text-red-600">{error}</p>}
    </form>
  );
};

export default VerifyIdentityForm;
