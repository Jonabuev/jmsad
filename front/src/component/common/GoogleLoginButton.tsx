import React, { useEffect, useState } from "react";
import {
  GoogleOAuthProvider,
  GoogleLogin,
  CredentialResponse,
} from "@react-oauth/google";
import { googleAuth } from "@/api/authApi";
import { saveTokens } from "@/utils/tokenUtils";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/component/store/store";
import { fetchUserProfile } from "@/component/store/auth/authSlice";
import styles from "./GoogleLoginButton.module.scss";

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  className?: string;
  children?: React.ReactNode;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onError,
  className = "",
  children
}) => {
  const initialClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const [clientId, setClientId] = useState<string>(initialClientId);
  const [loading, setLoading] = useState(false);
  const [showGoogleLogin, setShowGoogleLogin] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation("common");

  // Проверяем, что мы на клиенте
  if (typeof window === 'undefined') {
    return (
      <button 
        className={`${styles.googleButton} ${styles.loading} ${className}`}
        disabled
      >
        <svg className={styles.googleIcon} viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Загрузка...
      </button>
    );
  }

  // Client ID теперь берём из переменной окружения NEXT_PUBLIC_GOOGLE_CLIENT_ID
  // Дополнительно оставляем возможность динамически обновить, если потребуется
  useEffect(() => {
    if (!clientId && typeof process !== 'undefined') {
      const fromEnv = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
      if (fromEnv) setClientId(fromEnv);
    }
  }, [clientId]);
  
  const handleLoginSuccess = async (response: CredentialResponse) => {
    console.log("🔐 Google Login Success:", response);
    console.log("📍 Текущий путь до входа:", router.asPath);

    if (!response.credential) {
      console.error("❌ Нет токена");
      return;
    }

    try {
      console.log("📡 Отправляем токен на backend...");
      const { data } = await googleAuth(response.credential);
      console.log("✅ Backend response:", data);

      console.log("💾 Сохраняем токены...");
      saveTokens(data.access, data.refresh);
      localStorage.setItem("user", JSON.stringify(data.user));

      console.log("🔄 Обновляем Redux store...");
      await dispatch(fetchUserProfile());
      console.log("✅ Redux store обновлен");

      console.log("🚀 Перенаправляем на профиль...");
      console.log("📍 Текущий путь:", router.asPath);
      
      if (onSuccess) {
        console.log("✅ Вызываем onSuccess callback");
        onSuccess();
      } else {
        // Если onSuccess не передан, выполняем перенаправление здесь
        try {
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
      }
    } catch (err) {
      console.error("❌ Error sending token:", err);
      if (onError) {
        onError(err);
      }
    }
  };

  const handleLoginError = () => {
    console.error("Google Login Failed");
    if (onError) {
      onError(new Error("Google login failed"));
    }
  };

  const handleButtonClick = () => {
    setShowGoogleLogin(true);
  };

  if (loading) {
    return (
      <button 
        className={`${styles.googleButton} ${styles.loading} ${className}`}
        disabled
      >
        <svg className={styles.googleIcon} viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Загрузка...
      </button>
    );
  }

  if (!clientId) {
    console.error("Google Client ID is missing!");
    return (
      <button 
        className={`${styles.googleButton} ${styles.error} ${className}`}
        disabled
      >
        <svg className={styles.googleIcon} viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Ошибка конфигурации
      </button>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className={className}>
        {!showGoogleLogin ? (
          <button
            onClick={handleButtonClick}
            className={styles.googleButton}
          >
            <svg className={styles.googleIcon} viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t("registration.sign_in_with_google")}
          </button>
        ) : (
          <div className={styles.googleLoginContainer}>
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
              useOneTap={false}
              theme="outline"
              size="large"
              text="continue_with"
              shape="rectangular"
              locale="ru"
              type="standard"
              context="signin"
              auto_select={false}
              cancel_on_tap_outside={true}
              prompt_parent_id="google-login-button"
            />
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  );
};

export default GoogleLoginButton;
