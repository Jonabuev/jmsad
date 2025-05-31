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
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          try {
            setProfile(JSON.parse(userStr));
          } catch {
            console.warn("Ошибка разбора user");
          }
        } else {
          router.push("/login");
          return;
        }

        const token = localStorage.getItem("access_token");
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await axios.get("http://127.0.0.1:8000/api/profile/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(response.data);
      } catch (error) {
        console.error("Ошибка загрузки профиля:", error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.push("/login");
        }
      } finally {
        setAuthLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  return { profile, setProfile, authLoading };
}
