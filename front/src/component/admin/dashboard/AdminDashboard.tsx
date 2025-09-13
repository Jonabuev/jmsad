import { FC, useState, useEffect } from "react";
import { useTranslation } from "next-i18next";
import StatsCards from "./StatsCards";
import RecentActivity from "./RecentActivity";
import QuickActions from "./QuickActions";
import { getDashboardStats } from "@/api/adminApi";

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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t("admin.welcome")}</h1>
            <p className="text-blue-100 text-lg">{t("admin.welcomeSubtitle")}</p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <StatsCards stats={stats} />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>

        {/* Quick Actions */}
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
