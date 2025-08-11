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

    // Проверяем и очищаем истекшие токены при загрузке приложения
    checkAndCleanExpiredTokens();
    
    const token = getValidAccessToken();
    if (token) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch]);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      </Head>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
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
