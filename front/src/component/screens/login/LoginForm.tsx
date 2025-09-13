import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { login, fetchProfileWithToken } from "@/api/authApi";
import { saveTokens } from "@/utils/tokenUtils";
import GoogleLoginButton from "@/component/common/GoogleLoginButton";
import { useTranslation } from "next-i18next";
import { fetchUserProfile } from "@/component/store/auth/authSlice";
import { AppDispatch } from "@/component/store/store";

const LoginForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
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
      console.log("🔐 Начинаем процесс входа...");
      
      // 1. Авторизация
      const loginResponse = await login(formData.username, formData.password);
      const accessToken = loginResponse.data.access_token;
      const refreshToken = loginResponse.data.refresh_token;
      
      console.log("✅ Получены токены, сохраняем...");
      
      // Сохраняем токены с проверкой валидности
      saveTokens(accessToken, refreshToken);

      // 2. Получаем профиль пользователя и обновляем Redux store
      console.log("📋 Получаем профиль пользователя...");
      const profileResponse = await fetchProfileWithToken(accessToken);
      const profileData = profileResponse.data;
      localStorage.setItem("profile", JSON.stringify(profileData));

      // 3. Обновляем Redux store
      console.log("🔄 Обновляем Redux store...");
      await dispatch(fetchUserProfile());

      // 4. Переход на страницу профиля
      console.log("🚀 Перенаправляем на профиль...");
      console.log("📍 Текущий путь:", router.asPath);
      console.log("🔗 Router объект:", router);
      
      try {
        // Попробуем несколько способов перенаправления
        console.log("🔄 Способ 1: router.push()");
        await router.push("/profile");
        
        // Если router.push не сработал, попробуем альтернативы
        setTimeout(() => {
          console.log("⏰ Проверяем, произошло ли перенаправление...");
          console.log("📍 Новый путь:", router.asPath);
          
          if (router.asPath === "/profile") {
            console.log("✅ Перенаправление успешно через router.push()");
          } else {
            console.log("❌ router.push() не сработал, пробуем window.location");
            window.location.href = "/profile";
          }
        }, 1000);
        
      } catch (redirectError) {
        console.error("❌ Ошибка при перенаправлении:", redirectError);
        console.log("🔄 Пробуем альтернативный способ: window.location");
        window.location.href = "/profile";
      }
    } catch (err: any) {
      console.error("❌ Ошибка входа:", err);
      setError("Неверное имя пользователя или пароль.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("login.title")}</h1>
          <p className="text-gray-600">
            {t("login.noAccount")}{" "}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              {t("login.register")}
            </Link>
          </p>
        </div>

        {/* Google кнопка */}
        {isClient && (
          <div className="mb-6">
            <GoogleLoginButton 
              onSuccess={async () => {
                console.log("✅ Google login successful from login form");
                console.log("🔄 Обновляем Redux store...");
                try {
                  await dispatch(fetchUserProfile());
                  console.log("🚀 Перенаправляем на профиль...");
                  router.push("/profile");
                } catch (error) {
                  console.error("❌ Ошибка при обновлении Redux store:", error);
                  // Fallback на window.location
                  window.location.href = "/profile";
                }
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
              {t("login.username")}
            </label>
            <input
              type="text"
              name="username"
              id="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("login.usernamePlaceholder")}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t("login.password")}
              </label>
              <Link 
                href="/reset-password" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
              >
                {t("login.forgotPassword")}
              </Link>
            </div>
            <input
              type="password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("login.passwordPlaceholder")}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 mt-6"
          >
            {t("login.submit")}
          </button>
          <div className="flex items-center justify-center mb-1">
            <Link 
                  href="/reset-password" 
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                >
                  {t("login.forgotPassword")}
            </Link>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default LoginForm;
