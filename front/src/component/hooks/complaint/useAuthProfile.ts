import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { IProfile } from "@/component/type/users.interface";
import { fetchUserProfile, refreshAccessToken } from "@/api/userApi";
import { getValidAccessToken, getValidRefreshToken, saveTokens } from "@/utils/tokenUtils";

export function useAuthProfile() {
  const [profile, setProfile] = useState<IProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      // Проверяем, что мы на клиенте
      if (typeof window === 'undefined') return;

      const token = getValidAccessToken();
      const refreshToken = getValidRefreshToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetchUserProfile();
        setProfile(response.data);
      } catch (error: any) {
        if (
          error.response?.status === 401 &&
          refreshToken
        ) {
          // Попробуем обновить токен
          try {
            const refreshRes = await refreshAccessToken(refreshToken);
            const newAccessToken = refreshRes.data.access;
            saveTokens(newAccessToken, refreshToken);

            // Повторно пробуем получить профиль
            const retryRes = await fetchUserProfile();
            setProfile(retryRes.data);
            return;
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