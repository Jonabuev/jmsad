import { FC, useState } from "react";
import { useTranslation } from "next-i18next";
import { requestPasswordReset, confirmPasswordReset } from "@/api/passwordApi";

type Step = "email" | "code" | "newPassword" | "success";

const PasswordResetFlow: FC = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const response = await requestPasswordReset(email);
      setMessage(response.data.success);
      setStep("code");
    } catch (error: any) {
      setError(error.response?.data?.error || "Ошибка отправки кода");
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const response = await confirmPasswordReset(email, code, newPassword);
      setMessage(response.data.success);
      setStep("success");
    } catch (error: any) {
      setError(error.response?.data?.error || "Неверный код");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      {step === "email" && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {t("password.reset.title")}
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("password.reset.email_label")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            {t("password.reset.send_code")}
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {t("password.reset.enter_code")}
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("password.reset.code_label")}
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("password.reset.new_password_label")}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={8}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            {t("password.reset.change_password")}
          </button>
        </form>
      )}

      {step === "success" && (
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {t("password.reset.success_title")}
          </h2>
          <p className="text-gray-600">{t("password.reset.success_message")}</p>
          <a
            href="/login"
            className="inline-block bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            {t("password.reset.go_to_login")}
          </a>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      {message && (
        <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
          {message}
        </div>
      )}
    </div>
  );
};

export default PasswordResetFlow;