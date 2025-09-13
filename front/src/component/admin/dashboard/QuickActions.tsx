import { FC } from "react";
import { useTranslation } from "next-i18next";
import Link from "next/link";

const QuickActions: FC = () => {
  const { t } = useTranslation("common");

  const actions = [
    {
      title: t("admin.approveComplaints"),
      description: t("admin.approveComplaintsDesc"),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: "/admin/complaints?status=pending",
      color: "green",
    },
    {
      title: t("admin.verifyDocuments"),
      description: t("admin.verifyDocumentsDesc"),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      href: "/admin/users?verification=pending",
      color: "blue",
    },
    {
      title: t("admin.manageUsers"),
      description: t("admin.manageUsersDesc"),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      href: "/admin/users",
      color: "purple",
    },
    {
      title: t("admin.systemSettings"),
      description: t("admin.systemSettingsDesc"),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      href: "/admin/settings",
      color: "gray",
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "green":
        return "bg-green-50 text-green-600 border-green-200 hover:bg-green-100";
      case "blue":
        return "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100";
      case "purple":
        return "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100";
      case "gray":
        return "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{t("admin.quickActions")}</h2>
        <p className="text-sm text-gray-600 mt-1">{t("admin.quickActionsDesc")}</p>
      </div>
      
      <div className="p-6 space-y-4">
        {actions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className={`block p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${getColorClasses(action.color)}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {action.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{action.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{action.description}</p>
              </div>
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="px-6 py-3 bg-gray-50 rounded-b-xl">
        <p className="text-xs text-gray-500 text-center">
          {t("admin.quickActionsNote")}
        </p>
      </div>
    </div>
  );
};

export default QuickActions;
