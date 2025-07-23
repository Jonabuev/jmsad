import React from "react";
import {
  GoogleOAuthProvider,
  GoogleLogin,
  CredentialResponse,
} from "@react-oauth/google";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { googleAuth } from "@/api/authApi";

const GoogleLoginPage: React.FC = () => {
  const handleLoginSuccess = async (response: CredentialResponse) => {
    console.log("Login Success:", response);

    if (!response.credential) {
      console.error("Нет токена");
      return;
    }

    try {
      const { data } = await googleAuth(response.credential);
      console.log("Backend response:", data);

      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("user", JSON.stringify(data.user));

      window.location.href = "/profile";
    } catch (err) {
      console.error("Error sending token:", err);
    }
  };

  const handleLoginError = () => {
    console.error("Login Failed");
  };

  return (
    <GoogleOAuthProvider
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}
    >
      <div className="flex flex-col items-center justify-center min-h-screen">
        <GoogleLogin
          onSuccess={handleLoginSuccess}
          onError={handleLoginError}
        />
      </div>
    </GoogleOAuthProvider>
  );
};

export default GoogleLoginPage;

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ru", ["common"])),
    },
  };
};
