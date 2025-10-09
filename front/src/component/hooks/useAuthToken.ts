import { useEffect, useState } from "react";
import { getCookie } from "@/utils/cookieUtils";

export const useAuthToken = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = getCookie("access_token");
      setToken(storedToken);
    }
  }, []);

  return token;
};
