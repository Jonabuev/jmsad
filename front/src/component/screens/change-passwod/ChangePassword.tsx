import { FC, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getCookie } from "@/utils/cookieUtils";
import PasswordResetFlow from "./PasswordResetFlow";
import PasswordChangeFlow from "./PasswordChangeFlow";
import styles from "./ChangePassword.module.scss";

const ChangePassword: FC = () => {
  const router = useRouter();
  const { flow } = router.query;
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Проверяем, что мы на клиенте
    if (typeof window === 'undefined') return;

    const token = getCookie('access_token');
    setIsAuthenticated(!!token);
  }, []);

  // Show nothing while checking authentication status
  if (isAuthenticated === null) {
    return null;
  }
  
  return (
    <div className={styles.changePassword}>
      {!isAuthenticated ? (
        <PasswordResetFlow />
      ) : (
        <PasswordChangeFlow />
      )}
    </div>
  );
};

export default ChangePassword;
