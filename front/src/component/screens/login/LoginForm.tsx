import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { login, fetchProfileWithToken } from "@/api/authApi";
import { saveTokens } from "@/utils/tokenUtils";
import GoogleLoginButton from "@/component/common/GoogleLoginButton";
import { useTranslation } from "next-i18next";

const LoginForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { t } = useTranslation("common");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Авторизация
      const loginResponse = await login(formData.username, formData.password);
      const accessToken = loginResponse.data.access_token;
      const refreshToken = loginResponse.data.refresh_token;
      
      // Сохраняем токены с проверкой валидности
      saveTokens(accessToken, refreshToken);

      // 2. Получаем профиль пользователя
      const profileResponse = await fetchProfileWithToken(accessToken);
      const profileData = profileResponse.data;
      localStorage.setItem("profile", JSON.stringify(profileData));

      // 3. Переход на страницу профиля
      router.push("/profile");
    } catch (err: any) {
      setError("Неверное имя пользователя или пароль.");
      console.error(
        "Login error:",
        err.response ? err.response.data : err
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Войти</h1>
          <p className="text-gray-600">
            Нет аккаунта?{" "}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Зарегистрироваться
            </Link>
          </p>
        </div>

        {/* Google кнопка */}
        {isClient && (
          <div className="mb-6">
            <GoogleLoginButton 
              onSuccess={() => {
                console.log("Google login successful from login form");
              }}
              onError={(error) => {
                console.error("Google login error:", error);
              }}
              className="w-full"
            />
          </div>
        )}

        {/* Разделитель */}
        {isClient && (
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">{t("registration.or")}</span>
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        
        {isClient && (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Имя пользователя
            </label>
            <input
              type="text"
              name="username"
              id="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите имя пользователя"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              type="password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите пароль"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 mt-6"
          >
            Войти
          </button>
        </form>
        )}
      </div>
    </div>
  );
};

export default LoginForm;
