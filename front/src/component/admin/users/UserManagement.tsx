import { FC, useState, useEffect } from "react";
import { useTranslation } from "next-i18next";
import UserTable from "./UserTable";
import UserFilters from "./UserFilters";
import { getAdminUsers } from "@/api/adminApi";
import { IProfileData } from "@/component/type/users.interface";
import { useAdminNotifications } from "@/component/hooks/useAdminNotifications";
import AdminNotification from "../AdminNotification";

interface UserManagementState {
  users: IProfileData[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

const UserManagement: FC = () => {
  const { t } = useTranslation("common");
  const { notifications, addNotification, removeNotification } = useAdminNotifications();
  const [state, setState] = useState<UserManagementState>({
    users: [],
    loading: true,
    error: null,
    totalCount: 0,
    currentPage: 1,
    pageSize: 10,
  });

  const [filters, setFilters] = useState({
    search: "",
    role: "",
    verification_status: "",
    is_banned: "",
  });

  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

  const fetchUsers = async (page = 1, searchFilters = filters) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const params = {
        page,
        page_size: state.pageSize,
        ...searchFilters,
      };

      // Убираем пустые значения
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] === "") {
          delete params[key as keyof typeof params];
        }
      });

      const response = await getAdminUsers(params);
      
      setState(prev => ({
        ...prev,
        users: response.data.results || [],
        totalCount: response.data.count || 0,
        currentPage: page,
        loading: false,
      }));
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setState(prev => ({
        ...prev,
        error: error.message || t("admin.errorFetchingUsers"),
        loading: false,
      }));
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    fetchUsers(1, newFilters);
  };

  const handlePageChange = (page: number) => {
    fetchUsers(page, filters);
  };

  const handleUserAction = async (userId: number, action: string) => {
    const actionKey = `${action}_${userId}`;
    
    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }));
      
      // Оптимистичное обновление UI
      const userIndex = state.users.findIndex(user => user.id === userId);
      if (userIndex !== -1) {
        const updatedUsers = [...state.users];
        const user = updatedUsers[userIndex];
        
        // Предварительно обновляем UI
        if (action === 'ban') {
          user.is_banned = true;
          addNotification('success', t('admin.userBannedSuccessfully'));
        } else if (action === 'unban') {
          user.is_banned = false;
          addNotification('success', t('admin.userUnbannedSuccessfully'));
        }
        
        setState(prev => ({
          ...prev,
          users: updatedUsers
        }));
      }
      
      // Выполняем реальные API вызовы
      const { banUser, unbanUser } = await import('@/api/adminApi');
      
      console.log(`Executing ${action} for user ${userId}`);
      
      if (action === 'ban') {
        const response = await banUser(userId, 'Banned by administrator');
        console.log('Ban response:', response);
      } else if (action === 'unban') {
        const response = await unbanUser(userId);
        console.log('Unban response:', response);
      }
      
      // Обновляем данные с сервера
      await fetchUsers(state.currentPage, filters);
    } catch (error: any) {
      console.error('Error handling user action:', error);
      addNotification('error', error.message || t('admin.errorPerformingAction'));
      // Восстанавливаем данные с сервера в случае ошибки
      await fetchUsers(state.currentPage, filters);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  if (state.loading && state.users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("admin.users")}</h1>
            <p className="text-gray-600 mt-1">{t("admin.usersSubtitle")}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              {t("admin.totalUsers")}: <span className="font-semibold text-gray-900">{state.totalCount}</span>
            </div>
            <button
              onClick={() => fetchUsers(state.currentPage, filters)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t("admin.refresh")}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <UserFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        loading={state.loading}
      />

      {/* Error Message */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800">{state.error}</p>
          </div>
        </div>
      )}

      {/* Users Table */}
      <UserTable
        users={state.users}
        loading={state.loading}
        onUserAction={handleUserAction}
        totalCount={state.totalCount}
        currentPage={state.currentPage}
        pageSize={state.pageSize}
        onPageChange={handlePageChange}
        actionLoading={actionLoading}
      />

      {/* Notifications */}
      {notifications.map((notification) => (
        <AdminNotification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          duration={notification.duration}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

export default UserManagement;
