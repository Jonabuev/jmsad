import { FC, useState } from "react";
import axios from "axios";
import { useTranslation } from "next-i18next";
import Link from "next/link";

type Step = "requestCode" | "verifyCode" | "newPassword" | "success";

const PasswordChangeFlow: FC = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("requestCode");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRequestCode = async () => {
    setError("");
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        "http://127.0.0.1:8000/api/request-password-change/",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
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
      const response = await axios.post(
        "http://127.0.0.1:8000/api/confirm-password-change/",
        { code, new_password: newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
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
      const response = await axios.post(
        "http://127.0.0.1:8000/api/change-password/",
        { code, new_password: newPassword }
      );
      setMessage(response.data.message);
      setStep("success");
    } catch (error: any) {
      setError(error.response?.data?.error || "Error changing password");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      {step === "requestCode" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {t("password.change.title")}
          </h2>
          <p className="text-gray-600 mb-4">
            {t("password.change.description")}
          </p>
          <button
            onClick={handleRequestCode}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            {t("password.change.send_code")}
          </button>
        </div>
      )}

      {step === "verifyCode" && (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {t("password.change.enter_code_and_password")}
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("password.change.code_label")}
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
              {t("password.change.new_password_label")}
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
            {t("password.change.confirm")}
          </button>
        </form>
      )}

      {step === "success" && (
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {t("password.change.success_title")}
          </h2>
          <p className="text-gray-600">
            {t("password.change.success_message")}
          </p>
          <Link
            href="/profile"
            className="inline-block bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            {t("password.change.back_to_profile")}
          </Link>
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

export default PasswordChangeFlow;
