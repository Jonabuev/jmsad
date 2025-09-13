import React from 'react';
import { useTranslation } from 'next-i18next';

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
  metadata: Record<string, any>;
  created_at: string;
}

interface ActivityLogsTableProps {
  logs: ActivityLog[];
  loading: boolean;
  pagination: {
    count: number;
    next: string | null;
    previous: string | null;
    page: number;
    page_size: number;
  };
  onPageChange: (page: number) => void;
}

const ActivityLogsTable: React.FC<ActivityLogsTableProps> = ({
  logs,
  loading,
  pagination,
  onPageChange
}) => {
  const { t } = useTranslation('common');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionIcon = (actionType: string) => {
    const icons: Record<string, string> = {
      'user_register': '👤',
      'user_login': '🔑',
      'user_logout': '🚪',
      'user_ban': '🚫',
      'user_unban': '✅',
      'user_verify': '🔍',
      'user_make_admin': '👑',
      'user_remove_admin': '👤',
      'complaint_create': '📝',
      'complaint_moderate': '⚖️',
      'complaint_resolve': '✅',
      'faq_create': '❓',
      'faq_update': '✏️',
      'faq_delete': '🗑️',
      'complaint_reason_create': '📋',
      'complaint_reason_update': '✏️',
      'complaint_reason_delete': '🗑️',
      'rental_create': '🏠',
      'rental_confirm': '✅',
      'rental_reject': '❌',
      'comment_create': '💬',
      'system_error': '⚠️',
    };
    return icons[actionType] || '📋';
  };

  const getActionColor = (actionType: string) => {
    const colors: Record<string, string> = {
      'user_register': 'bg-green-100 text-green-800',
      'user_login': 'bg-blue-100 text-blue-800',
      'user_logout': 'bg-gray-100 text-gray-800',
      'user_ban': 'bg-red-100 text-red-800',
      'user_unban': 'bg-green-100 text-green-800',
      'user_verify': 'bg-blue-100 text-blue-800',
      'user_make_admin': 'bg-purple-100 text-purple-800',
      'user_remove_admin': 'bg-orange-100 text-orange-800',
      'complaint_create': 'bg-orange-100 text-orange-800',
      'complaint_moderate': 'bg-purple-100 text-purple-800',
      'complaint_resolve': 'bg-green-100 text-green-800',
      'faq_create': 'bg-indigo-100 text-indigo-800',
      'faq_update': 'bg-yellow-100 text-yellow-800',
      'faq_delete': 'bg-red-100 text-red-800',
      'complaint_reason_create': 'bg-indigo-100 text-indigo-800',
      'complaint_reason_update': 'bg-yellow-100 text-yellow-800',
      'complaint_reason_delete': 'bg-red-100 text-red-800',
      'rental_create': 'bg-blue-100 text-blue-800',
      'rental_confirm': 'bg-green-100 text-green-800',
      'rental_reject': 'bg-red-100 text-red-800',
      'comment_create': 'bg-cyan-100 text-cyan-800',
      'system_error': 'bg-red-100 text-red-800',
    };
    return colors[actionType] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('admin.activity.loading')}</p>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('admin.activity.no_logs')}
          </h3>
          <p className="text-gray-500">
            {t('admin.activity.no_logs_description')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.activity.table.action')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.activity.table.user')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.activity.table.description')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.activity.table.object')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.activity.table.ip')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.activity.table.date')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{getActionIcon(log.action_type)}</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action_type)}`}>
                      {log.action_type_display}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {log.user_username ? (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {log.user_username}
                      </div>
                      <div className="text-sm text-gray-500">
                        {log.user_email}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">
                      {t('admin.activity.system')}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs">
                    <div className="truncate">
                      {log.action_description}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.target_object_type && log.target_object_id ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {log.target_object_type} #{log.target_object_id}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.ip_address || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div title={new Date(log.created_at).toISOString()}>
                    {formatDate(log.created_at)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={!pagination.previous}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('admin.activity.pagination.previous')}
          </button>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.next}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('admin.activity.pagination.next')}
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              {t('admin.activity.pagination.showing')}{' '}
              <span className="font-medium">
                {(pagination.page - 1) * pagination.page_size + 1}
              </span>{' '}
              {t('admin.activity.pagination.to')}{' '}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.page_size, pagination.count)}
              </span>{' '}
              {t('admin.activity.pagination.of')}{' '}
              <span className="font-medium">{pagination.count}</span>{' '}
              {t('admin.activity.pagination.results')}
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={!pagination.previous}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('admin.activity.pagination.previous')}
              </button>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={!pagination.next}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('admin.activity.pagination.next')}
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogsTable;
