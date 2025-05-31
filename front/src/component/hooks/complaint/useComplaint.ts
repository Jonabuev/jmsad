import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { IComplaint } from "@/component/type/users.interface";

export function useComplaint(uuid: string | string[] | undefined) {
  const [complaint, setComplaint] = useState<IComplaint | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          router.push("/login");
          return;
        }

        if (uuid) {
          const response = await axios.get<IComplaint>(
            `http://localhost:8000/api/complaints/${uuid}/`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setComplaint(response.data);
        }
      } catch (error) {
        console.error("Ошибка при загрузке жалобы:", error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [uuid, router]);

  return { complaint, loading };
}
