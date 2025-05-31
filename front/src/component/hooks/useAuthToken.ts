import { useEffect, useState } from "react";

export const useAuthToken = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("access_token");
      setToken(storedToken);
    }
  }, []);

  return token;
};
