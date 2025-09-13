import { FC, useState, useEffect } from "react";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { requestPasswordChange, confirmPasswordChange, changePassword } from "@/api/passwordApi";
import { fetchUserProfile } from "@/api/userApi";

type Step = "requestCode" | "verifyCode" | "newPassword" | "success";

const PasswordChangeFlow: FC = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("requestCode");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Получаем email пользователя при загрузке компонента
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (token) {
          const response = await fetchUserProfile();
          setUserEmail(response.data.user.email || "");
        }
      } catch (error) {
        console.error("Ошибка при получении email пользователя:", error);
      }
    };
    
    fetchUserEmail();
  }, []);

  const handleRequestCode = async () => {
    setError("");
    try {
      const token = localStorage.getItem("access_token");
      const response = await requestPasswordChange(token!);
      setMessage(response.data.success);
      setStep("verifyCode");
    } catch (error: any) {
      setError(error.response?.data?.error || "Ошибка отправки кода");
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const token = localStorage.getItem("access_token");
      const response = await confirmPasswordChange(code, newPassword, token!);
      setMessage(response.data.success);
      setStep("success");
    } catch (error: any) {
      setError(error.response?.data?.error || "Неверный код");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const response = await changePassword(code, newPassword);
      setMessage(response.data.message);
      setStep("success");
    } catch (error: any) {
      setError(error.response?.data?.error || "Error changing password");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 backdrop-blur-sm">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t("password.change.title")}
          </h2>
          <p className="text-gray-600 text-sm">
            {t("password.change.description")}
          </p>
        </div>

        {step === "requestCode" && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-4">
                {t("password.change.description")}
              </p>
              {userEmail && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-600 mb-1">{t("password.change.emailLabel")}</p>
                  <p className="text-sm font-medium text-gray-900">{userEmail}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleRequestCode}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {t("password.change.send_code")}
            </button>
          </div>
        )}

        {step === "verifyCode" && (
          <form onSubmit={handleVerifyCode} className="space-y-5">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                {t("password.change.enter_code_and_password")}
              </h2>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("password.change.code_label")}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("password.change.new_password_label")}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {t("password.change.confirm")}
            </button>
          </form>
        )}

        {step === "success" && (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {t("password.change.success_title")}
            </h2>
            <p className="text-gray-600">
              {t("password.change.success_message")}
            </p>
            <Link
              href="/profile"
              className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {t("password.change.back_to_profile")}
            </Link>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm text-center font-medium">{error}</p>
          </div>
        )}
        
        {message && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-green-600 text-sm text-center font-medium">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordChangeFlow;
