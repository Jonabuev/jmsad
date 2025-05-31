import { FC } from "react";
import { useRouter } from "next/router";
import PasswordResetFlow from "./PasswordResetFlow";
import PasswordChangeFlow from "./PasswordChangeFlow";

const ChangePassword: FC = () => {
  const router = useRouter();
  const { flow } = router.query;

  // Если пользователь не авторизован, показываем PasswordResetFlow
  const isAuthenticated = typeof window !== 'undefined' && localStorage.getItem('access_token');
  
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
