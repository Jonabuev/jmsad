import { FC, useState, useEffect } from "react";
import { useRouter } from "next/router";
import PasswordResetFlow from "./PasswordResetFlow";
import PasswordChangeFlow from "./PasswordChangeFlow";

const ChangePassword: FC = () => {
  const router = useRouter();
  const { flow } = router.query;
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
  }, []);

  // Show nothing while checking authentication status
  if (isAuthenticated === null) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {!isAuthenticated ? (
          <PasswordResetFlow />
        ) : (
          <PasswordChangeFlow />
        )}
      </div>
    </div>
  );
};

export default ChangePassword;
