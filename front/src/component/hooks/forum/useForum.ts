import { IComplaint } from "@/component/type/users.interface";
import { useApi } from "../useApi";
import { useMemo } from "react";

interface LocationFilters {
  region: string;
  city: string;
  district: string;
  address: string;
}

export const useComplaints = (
  filter: string,
  locationFilters: LocationFilters
) => {
  const params = useMemo(() => ({
    filter,
    ...(locationFilters.region && { region: locationFilters.region }),
    ...(locationFilters.city && { city: locationFilters.city }),
    ...(locationFilters.district && { district: locationFilters.district }),
    ...(locationFilters.address && { address: locationFilters.address }),
  }), [filter, locationFilters]);

  const { data: complaints, loading, error, fetchData } = useApi<IComplaint[]>('/forum/', { params });

  return { complaints: complaints || [], loading, error, fetchComplaints: fetchData };
};
