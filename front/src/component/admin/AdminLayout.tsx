import { FC, ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import styles from "./AdminLayout.module.scss";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className={styles.adminLayout}>
      <AdminSidebar />
      <div className={styles.mainContent}>
        <AdminHeader />
        <main className={styles.main}>
          <div className={styles.container}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
