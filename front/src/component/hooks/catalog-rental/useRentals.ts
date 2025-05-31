import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export interface Rental {
  id: number;
  type_p: string;
  address: string;
  price: number;
  rooms: number;
  description: string;
  latitude: number;
  longitude: number;
}

export function useRentals(startDate: string, endDate: string) {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    if (!startDate || !endDate) return;
    setLoading(true);
    axios
      .get("http://127.0.0.1:8000/api/available-houses/", {
        params: { start_date: startDate, end_date: endDate },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      .then((res) => setRentals(res.data))
      .catch((err) => console.error("Ошибка загрузки:", err))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { rentals, loading, fetchData };
}
