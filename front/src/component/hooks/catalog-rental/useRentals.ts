import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { IHouse } from "@/component/type/properties.interface";

export function useRentals(startDate?: string, endDate?: string) {
  const [rentals, setRentals] = useState<IHouse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    const isFiltered = startDate && endDate;
    const url = isFiltered
      ? "http://127.0.0.1:8000/api/available-houses/"
      : "http://127.0.0.1:8000/api/all-houses/";

    const params = isFiltered
      ? { start_date: startDate, end_date: endDate }
      : {};

    axios
      .get(url, {
        params,
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
