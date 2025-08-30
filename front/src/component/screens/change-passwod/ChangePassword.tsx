import { FC, useState, useEffect } from "react";
import { useRouter } from "next/router";
import PasswordResetFlow from "./PasswordResetFlow";
import PasswordChangeFlow from "./PasswordChangeFlow";

const ChangePassword: FC = () => {
  const router = useRouter();
  const { flow } = router.query;
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Проверяем, что мы на клиенте
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
  }, []);

  // Show nothing while checking authentication status
  if (isAuthenticated === null) {
    return null;
  }
  
  return (
    <>
      {!isAuthenticated ? (
        <PasswordResetFlow />
      ) : (
        <PasswordChangeFlow />
      )}
    </>
  );
};

export default ChangePassword;
