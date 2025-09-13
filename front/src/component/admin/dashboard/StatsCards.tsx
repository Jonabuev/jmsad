import { FC } from "react";
import { useTranslation } from "next-i18next";
import Link from "next/link";

interface StatsCardsProps {
  stats: {
    total_users: number;
    total_complaints: number;
    pending_verifications: number;
    active_disputes: number;
    recent_complaints: number;
    recent_users: number;
  };
}

const StatsCards: FC<StatsCardsProps> = ({ stats }) => {
  const { t } = useTranslation("common");

  const cards = [
    {
      title: t("admin.totalUsers"),
      value: stats.total_users,
      change: `+${stats.recent_users} ${t("admin.thisWeek")}`,
      changeType: "positive" as const,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      href: "/admin/users",
      color: "blue",
    },
    {
      title: t("admin.totalComplaints"),
      value: stats.total_complaints,
      change: `+${stats.recent_complaints} ${t("admin.thisWeek")}`,
      changeType: "positive" as const,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      href: "/admin/complaints",
      color: "red",
    },
    {
      title: t("admin.pendingVerifications"),
      value: stats.pending_verifications,
      change: t("admin.requiresAttention"),
      changeType: "warning" as const,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: "/admin/users",
      color: "yellow",
    },
    {
      title: t("admin.activeDisputes"),
      value: stats.active_disputes,
      change: t("admin.inProgress"),
      changeType: "neutral" as const,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      href: "/admin/complaints",
      color: "purple",
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "red":
        return "bg-red-50 text-red-600 border-red-200";
      case "yellow":
        return "bg-yellow-50 text-yellow-600 border-yellow-200";
      case "purple":
        return "bg-purple-50 text-purple-600 border-purple-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case "positive":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Link
          key={index}
          href={card.href}
          className="group block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{card.value}</p>
              <p className={`text-sm ${getChangeColor(card.changeType)}`}>
                {card.change}
              </p>
            </div>
            <div className={`p-3 rounded-lg border ${getColorClasses(card.color)} group-hover:scale-110 transition-transform duration-200`}>
              {card.icon}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default StatsCards;
