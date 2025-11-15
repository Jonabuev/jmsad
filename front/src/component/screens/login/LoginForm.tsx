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
    email: "",  // ✅ Изменено с username на email
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
      // 1. Авторизация
      const loginResponse = await login(formData.email, formData.password);  // ✅ Передаем email
      const accessToken = loginResponse.data.access_token;
      const refreshToken = loginResponse.data.refresh_token;
      
      // Сохраняем токены
      saveTokens(accessToken, refreshToken);

      // 2. Получаем профиль пользователя
      const profileResponse = await fetchProfileWithToken(accessToken);
      const profileData = profileResponse.data;
      
      // Сохраняем профиль в cookie
      setCookie("profile", JSON.stringify(profileData), {
        expires: 7,
        path: '/',
        secure: false,
        sameSite: 'lax'
      });

      // 3. Обновляем Redux store
      await dispatch(fetchUserProfile());

      // 4. Переход на профиль
      try {
        await router.push("/profile");
        
        setTimeout(() => {
          if (router.asPath !== "/profile") {
            window.location.href = "/profile";
          }
        }, 1000);
        
      } catch (redirectError) {
        window.location.href = "/profile";
      }
    } catch (err: any) {
      setError("Неверный email или пароль.");
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
                try {
                  await dispatch(fetchUserProfile());
                  router.push("/profile");
                } catch (error) {
                  window.location.href = "/profile";
                }
              }}
              onError={(error) => {
                setError("Ошибка входа через Google");
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
            {/* ✅ Изменено поле на email */}
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.inputLabel}>
                {t("login.email")}
              </label>
              <input
                type="email"  // ✅ Тип изменен на email
                name="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className={styles.input}
                placeholder={t("login.emailPlaceholder")}
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