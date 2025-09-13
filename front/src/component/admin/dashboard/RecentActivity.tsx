import { FC, useState, useEffect } from "react";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { getRecentActivity } from "@/api/adminApi";

interface ActivityLog {
  id: number;
  user: number | null;
  user_username: string | null;
  user_email: string | null;
  action_type: string;
  action_type_display: string;
  action_description: string;
  target_object_type: string | null;
  target_object_id: number | null;
  ip_address: string | null;
  metadata: any;
  created_at: string;
}

const RecentActivity: FC = () => {
  const { t } = useTranslation("common");
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getRecentActivity(5);
        setActivities(response.data.results || []);
      } catch (error: any) {
        console.error("Error fetching recent activity:", error);
        setError(error.message || "Ошибка загрузки активности");
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  }, []);

  // Mock data - fallback if API fails
  const mockActivities = [
    {
      id: 1,
      type: "complaint",
      title: t("admin.newComplaint"),
      description: "Жалоба на арендодателя по адресу ул. Абая 123",
      time: "2 минуты назад",
      status: "pending",
      href: "/complaints/uuid-1",
    },
    {
      id: 2,
      type: "verification",
      title: t("admin.verificationCompleted"),
      description: "Пользователь Айдар Нурланов прошел верификацию",
      time: "15 минут назад",
      status: "completed",
      href: "/admin/users/123",
    },
    {
      id: 3,
      type: "dispute",
      title: t("admin.newDispute"),
      description: "Оспаривание жалобы #456 от пользователя Мария Ким",
      time: "1 час назад",
      status: "pending",
      href: "/complaints/uuid-2",
    },
    {
      id: 4,
      type: "user",
      title: t("admin.newUser"),
      description: "Новый пользователь зарегистрировался: Асель Толеуова",
      time: "2 часа назад",
      status: "completed",
      href: "/admin/users/124",
    },
    {
      id: 5,
      type: "complaint",
      title: t("admin.complaintResolved"),
      description: "Жалоба #789 была одобрена и закрыта",
      time: "3 часа назад",
      status: "resolved",
      href: "/complaints/uuid-3",
    },
  ];

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case "user_register":
      case "user_login":
      case "user_logout":
      case "user_ban":
      case "user_unban":
      case "user_verify":
      case "user_make_admin":
      case "user_remove_admin":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        );
      case "complaint_create":
      case "complaint_moderate":
      case "complaint_resolve":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case "rental_create":
      case "rental_confirm":
      case "rental_reject":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case "faq_create":
      case "faq_update":
      case "faq_delete":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "comment_create":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case "system_error":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getMockStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "resolved":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} секунд назад`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} минут назад`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} часов назад`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} дней назад`;
    }
  };

  const getStatusColor = (actionType: string) => {
    if (actionType.includes('ban') || actionType.includes('error')) {
      return "bg-red-100 text-red-800";
    } else if (actionType.includes('verify') || actionType.includes('confirm') || actionType.includes('approve')) {
      return "bg-green-100 text-green-800";
    } else if (actionType.includes('create') || actionType.includes('register')) {
      return "bg-blue-100 text-blue-800";
    } else {
      return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t("admin.recentActivity")}</h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t("admin.recentActivity")}</h2>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const displayActivities = activities.length > 0 ? activities : mockActivities;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t("admin.recentActivity")}</h2>
          <Link
            href="/admin/activity"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {t("admin.viewAll")}
          </Link>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {displayActivities.map((activity) => {
          // Для реальных данных активности
          if ('action_type' in activity) {
            const realActivity = activity as ActivityLog;
            return (
              <div
                key={realActivity.id}
                className="block px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      {getActivityIcon(realActivity.action_type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {t(`admin.activity.actions.${realActivity.action_type}`) || realActivity.action_type_display}
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(realActivity.action_type)}`}>
                        {realActivity.action_type_display}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{realActivity.action_description}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">
                        {realActivity.user_username ? `${realActivity.user_username}` : 'Система'}
                      </p>
                      <p className="text-xs text-gray-500">{formatTimeAgo(realActivity.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          
          // Для mock данных (fallback)
          const mockActivity = activity as any;
          return (
            <Link
              key={mockActivity.id}
              href={mockActivity.href}
              className="block px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    {getActivityIcon(mockActivity.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{mockActivity.title}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMockStatusColor(mockActivity.status)}`}>
                      {mockActivity.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{mockActivity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{mockActivity.time}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      
      <div className="px-6 py-3 bg-gray-50 rounded-b-xl">
        <Link
          href="/admin/activity"
          className="text-sm text-gray-600 hover:text-gray-800 font-medium"
        >
          {t("admin.viewAllActivity")} →
        </Link>
      </div>
    </div>
  );
};

export default RecentActivity;
