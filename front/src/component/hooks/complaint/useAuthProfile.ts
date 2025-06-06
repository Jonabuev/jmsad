import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { IProfile } from "@/component/type/users.interface";

export function useAuthProfile() {
  const [profile, setProfile] = useState<IProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("access_token");
      const refreshToken = localStorage.getItem("refresh_token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await axios.get("http://127.0.0.1:8000/api/profile/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(response.data);
      } catch (error) {
        if (
          axios.isAxiosError(error) &&
          error.response?.status === 401 &&
          refreshToken
        ) {
          // Попробуем обновить токен
          try {
            const refreshRes = await axios.post(
              "http://127.0.0.1:8000/api/token/refresh/",
              {
                refresh: refreshToken,
              }
            );
            const newAccessToken = refreshRes.data.access;
            localStorage.setItem("access_token", newAccessToken);

            // Повторно пробуем получить профиль
            const retryRes = await axios.get(
              "http://127.0.0.1:8000/api/profile/",
              {
                headers: { Authorization: `Bearer ${newAccessToken}` },
              }
            );
            setProfile(retryRes.data);
            return;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (refreshErr) {
            console.warn("Refresh token истёк");
          }
        }

        console.error("Ошибка авторизации:", error);
        router.push("/login");
      } finally {
        setAuthLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  return { profile, setProfile, authLoading };
}
