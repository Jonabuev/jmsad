import { useState, useCallback } from "react";
import axios from "axios";
import { IComplaint } from "@/component/type/users.interface";

interface LocationFilters {
  region: string;
  city: string;
  district: string;
  address: string;
}

export const useComplaints = (
  filter: string,
  token: string | null,
  locationFilters: LocationFilters
) => {
  const [complaints, setComplaints] = useState<IComplaint[]>([]);

  const fetchComplaints = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        filter,
        ...(locationFilters.region && { region: locationFilters.region }),
        ...(locationFilters.city && { city: locationFilters.city }),
        ...(locationFilters.district && { district: locationFilters.district }),
        ...(locationFilters.address && { address: locationFilters.address }),
      });

      const response = await axios.get(
        `http://127.0.0.1:8000/api/forum/?${params.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      setComplaints(response.data);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    }
  }, [filter, token, locationFilters]);

  return { complaints, fetchComplaints };
};
