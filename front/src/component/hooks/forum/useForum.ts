import { useState, useCallback } from "react";
import axios from "axios";
import { IComplaint } from "@/component/type/users.interface";

export const useComplaints = (filter: string, token: string | null) => {
  const [complaints, setComplaints] = useState<IComplaint[]>([]);

  const fetchComplaints = useCallback(async () => {
    if (!token) return;

    try {
      const res = await axios.get("http://127.0.0.1:8000/api/forum/", {
        params: { filter },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setComplaints(res.data);
    } catch (err) {
      console.error("Ошибка при загрузке жалоб:", err);
    }
  }, [filter, token]);

  return { complaints, fetchComplaints };
};
