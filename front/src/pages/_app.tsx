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

const AppContent = (props: AppProps) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <props.Component {...props.pageProps} />
      </main>
      <Footer />
    </div>
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
