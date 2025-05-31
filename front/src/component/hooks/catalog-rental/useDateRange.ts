import { useState, useEffect } from "react";

export function useDateRange() {
  const getFirstAndLastDayOfMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  };

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!startDate || !endDate) {
      const { start, end } = getFirstAndLastDayOfMonth();
      setStartDate(start);
      setEndDate(end);
    }
  }, [startDate, endDate]);

  return { startDate, endDate, setStartDate, setEndDate };
}
