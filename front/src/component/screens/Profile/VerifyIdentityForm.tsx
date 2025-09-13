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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t("verify.identityVerification")}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Загрузите документ для верификации вашей личности и получения доступа ко всем функциям платформы
            </p>
          </div>

          {/* Verification Status */}
          {profile?.user && (
            <div className="bg-gray-50 rounded-xl p-6 border-l-4 border-gray-400 mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Информация о пользователе</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Имя пользователя:</p>
                  <p className="font-semibold text-gray-900">{profile.user.username}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ИИН:</p>
                  <p className="font-semibold text-gray-900">{profile.user.identifier}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Тип документа:</p>
                  <p className="font-semibold text-gray-900">{profile.user.document_type || 'Не указан'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Статус верификации:</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    profile.user.is_verified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      profile.user.is_verified ? 'bg-green-400' : 'bg-yellow-400'
                    }`}></span>
                    {profile.user.is_verified ? 'Верифицирован' : 'Не верифицирован'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {message && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700 font-medium">{message}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Document Upload */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Загрузка документа</h3>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors duration-200">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="document-upload"
                />
                <label htmlFor="document-upload" className="cursor-pointer">
                  <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-4 text-lg text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">Нажмите для загрузки</span> или перетащите файл сюда
                  </p>
                  <p className="text-sm text-gray-500 mt-2">PNG, JPG, JPEG, PDF до 10MB</p>
                  {file && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700 font-medium">
                        ✓ Выбран файл: {file.name}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Размер: {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-400">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">Инструкции по загрузке:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Убедитесь, что документ четко читается</li>
                    <li>• Поддерживаемые форматы: PNG, JPG, JPEG, PDF</li>
                    <li>• Максимальный размер файла: 10MB</li>
                    <li>• Документ должен содержать ваши данные: {profile?.user?.username} и {profile?.user?.identifier}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <button
                type="submit"
                disabled={loading || !file}
                className={`w-full inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  loading || !file ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Отправка документа...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Отправить документ
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyIdentityForm;
