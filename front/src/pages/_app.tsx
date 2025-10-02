import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { appWithTranslation } from "next-i18next";
import { Provider, useDispatch } from "react-redux";
import { store } from "@/component/store/store";
import { useEffect } from "react";
import { fetchUserProfile } from "@/component/store/auth/authSlice";
import { AppDispatch } from "@/component/store/store";
import Header from "@/component/header/Header";
import Footer from "@/component/footer/Footer";
import { checkAndCleanExpiredTokens, getValidAccessToken } from "@/utils/tokenUtils";
import { useTokenValidation } from "@/component/hooks/useTokenValidation";
import { useAutoRefreshToken } from "@/component/hooks/useAutoRefreshToken";
import { reportWebVitals } from "@/utils/webVitals";
import { logger } from "@/utils/logger";
// Push-уведомления инициализируются через PushNotificationPrompt
import Head from "next/head";

const AppContent = (props: AppProps) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Используем хук для валидации токенов
  useTokenValidation();
  
  // Используем хук для автоматического обновления токенов
  useAutoRefreshToken();

  useEffect(() => {
    // Проверяем, что мы на клиенте
    if (typeof window === 'undefined') return;

    // ✅ Инициализируем мониторинг производительности
    reportWebVitals();

    const initializeAuth = async () => {
      try {
        // Проверяем и очищаем истекшие токены при загрузке приложения
        checkAndCleanExpiredTokens();
        
        const token = getValidAccessToken();
        if (token) {
          logger.log('Valid token found, restoring user profile...');
          await dispatch(fetchUserProfile());
          
          // Push-уведомления будут инициализированы через PushNotificationPrompt
          // когда пользователь явно даст разрешение
        } else {
          logger.log('No valid token found');
        }
      } catch (error) {
        logger.error('Error during auth initialization:', error);
      }
    };

    // Добавляем небольшую задержку для стабилизации состояния
    const timeoutId = setTimeout(() => {
      initializeAuth();
    }, 50);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [dispatch]);

  // Слушатель push-уведомлений настраивается в usePushNotifications хуке

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      </Head>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex flex-col">
          <props.Component {...props.pageProps} />
        </main>
        <Footer />
      </div>
    </>
  );
};

function App(props: AppProps) {
  return (
    <Provider store={store}>
      <AppContent {...props} />
    </Provider>
  );
}

export default appWithTranslation(App);
