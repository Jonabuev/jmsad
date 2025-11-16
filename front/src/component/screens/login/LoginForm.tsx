import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { login, fetchProfileWithToken } from "@/api/authApi";
import { saveTokens } from "@/utils/tokenUtils";
import { setCookie } from "@/utils/cookieUtils";
import GoogleLoginButton from "@/component/common/GoogleLoginButton";
import { useTranslation } from "next-i18next";
import { fetchUserProfile } from "@/component/store/auth/authSlice";
import { AppDispatch } from "@/component/store/store";
import styles from "./LoginForm.module.scss";

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
      // БЕЗОПАСНОСТЬ: НЕ логируем токены или чувствительные данные в console
      
      // 1. Авторизация
      const loginResponse = await login(formData.username, formData.password);
      const accessToken = loginResponse.data.access_token;
      const refreshToken = loginResponse.data.refresh_token;
      
      // Сохраняем токены с проверкой валидности
      saveTokens(accessToken, refreshToken);

      // 2. Получаем профиль пользователя и обновляем Redux store
      const profileResponse = await fetchProfileWithToken(accessToken);
      const profileData = profileResponse.data;
      
      // Сохраняем профиль в cookie (для совместимости)
      setCookie("profile", JSON.stringify(profileData), {
        expires: 7, // 7 дней
        path: '/',
        secure: false,
        sameSite: 'lax'
      });

      // 3. Обновляем Redux store
      await dispatch(fetchUserProfile());

      // 4. Переход на страницу профиля
      // БЕЗОПАСНОСТЬ: НЕ логируем данные пользователя
      
      try {
        // Перенаправление на профиль
        await router.push("/profile");
        
        // Если router.push не сработал, попробуем альтернативы
        setTimeout(() => {
          // БЕЗОПАСНОСТЬ: НЕ логируем данные
          
          if (router.asPath !== "/profile") {
            window.location.href = "/profile";
          }
        }, 1000);
        
      } catch (redirectError) {
        // Альтернативный способ перенаправления
        window.location.href = "/profile";
      }
    } catch (err: any) {
      // Показываем ошибку пользователю
      setError(t("login.errorMessage") || "Неверное имя пользователя или пароль.");
    }
  };

  return (
    <div className={styles.loginForm}>
      <div className={styles.loginCard}>
        {/* Заголовок */}
        <div className={styles.header}>
          <h1 className={styles.title}>{t("login.title")}</h1>
          <p className={styles.subtitle}>
            {t("login.noAccount")}{" "}
            <Link href="/register" className={styles.registerLink}>
              {t("login.register")}
            </Link>
          </p>
        </div>

        {/* Google кнопка */}
        {isClient && (
          <div className={styles.googleButtonContainer}>
            <GoogleLoginButton 
              onSuccess={async () => {
                // БЕЗОПАСНОСТЬ: НЕ логируем токены
                try {
                  await dispatch(fetchUserProfile());
                  router.push("/profile");
                } catch (error) {
                  // Fallback на window.location
                  window.location.href = "/profile";
                }
              }}
              onError={(error) => {
                // Показываем ошибку пользователю
                setError(t("login.googleError") || "Ошибка входа через Google");
              }}
              className="w-full"
            />
          </div>
        )}

        {/* Разделитель */}
        {isClient && (
          <div className={styles.divider}>
            <div className={styles.dividerLine}></div>
            <div className={styles.dividerText}>
              <span>{t("registration.or")}</span>
            </div>
          </div>
        )}

        {error && <p className={styles.errorMessage}>{error}</p>}
        
        {isClient && (
          <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="username" className={styles.inputLabel}>
              {t("login.username")}
            </label>
            <input
              type="text"
              name="username"
              id="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              className={styles.input}
              placeholder={t("login.usernamePlaceholder")}
            />
          </div>
          <div className={styles.inputGroup}>
            <div className={styles.inputLabelRow}>
              <label htmlFor="password" className={styles.inputLabel}>
                {t("login.password")}
              </label>
              <Link 
                href="/reset-password" 
                className={styles.forgotPasswordLink}
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
              className={styles.input}
              placeholder={t("login.passwordPlaceholder")}
            />
          </div>
          <button
            type="submit"
            className={styles.submitButton}
          >
            {t("login.submit")}
          </button>
          <div className={styles.forgotPasswordContainer}>
            <Link 
                  href="/reset-password" 
                  className={styles.forgotPasswordLink}
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
