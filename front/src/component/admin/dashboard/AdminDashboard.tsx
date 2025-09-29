import { FC, useState, useEffect } from "react";
import { useTranslation } from "next-i18next";
import StatsCards from "./StatsCards";
import RecentActivity from "./RecentActivity";
import QuickActions from "./QuickActions";
import { getDashboardStats } from "@/api/adminApi";
import styles from "./AdminDashboard.module.scss";

interface DashboardStats {
  total_users: number;
  total_complaints: number;
  pending_verifications: number;
  active_disputes: number;
  recent_complaints: number;
  recent_users: number;
}

const AdminDashboard: FC = () => {
  const { t } = useTranslation("common");
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    total_complaints: 0,
    pending_verifications: 0,
    active_disputes: 0,
    recent_complaints: 0,
    recent_users: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getDashboardStats();
        setStats(response.data);
      } catch (error: any) {
        console.error("Error fetching dashboard stats:", error);
        setError(error.message || t("admin.errorFetchingStats"));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [t]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <svg className={styles.errorIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className={styles.errorText}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Welcome section */}
      <div className={styles.welcomeSection}>
        <div className={styles.welcomeContent}>
          <div className={styles.welcomeText}>
            <h1 className={styles.welcomeTitle}>{t("admin.welcome")}</h1>
            <p className={styles.welcomeSubtitle}>{t("admin.welcomeSubtitle")}</p>
          </div>
          <div className={styles.welcomeIcon}>
            <div className={styles.welcomeIconContainer}>
              <svg className={styles.welcomeIconSvg} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <StatsCards stats={stats} />

      {/* Main content grid */}
      <div className={styles.mainGrid}>
        {/* Recent Activity */}
        <div className={styles.recentActivityColumn}>
          <RecentActivity />
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActionsColumn}>
          <QuickActions />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
