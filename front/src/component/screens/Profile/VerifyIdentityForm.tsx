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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 backdrop-blur-sm">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t("verify.identityVerification")}
          </h2>
          <p className="text-gray-600 text-sm">
            Загрузите документ для верификации вашей личности
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Выберите документ
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all duration-200 cursor-pointer"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Отправка...
              </>
            ) : (
              "Отправить документ"
            )}
          </button>

          {message && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-600 text-sm text-center font-medium">{message}</p>
            </div>
          )}
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm text-center font-medium">{error}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default VerifyIdentityForm;
