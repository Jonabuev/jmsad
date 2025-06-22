import { IHouse } from "@/component/type/properties.interface";
import { useApi } from "../useApi";

export function useRentals(startDate?: string, endDate?: string) {
  const isFiltered = !!(startDate && endDate);
  const url = isFiltered ? "/available-houses/" : "/all-houses/";
  const params = isFiltered ? { start_date: startDate, end_date: endDate } : {};

  const { data: rentals, loading, error, fetchData } = useApi<IHouse[]>(
    url,
    { params },
    { skip: isFiltered && (!startDate || !endDate) }
  );

  return { rentals: rentals || [], loading, error, fetchData };
}
