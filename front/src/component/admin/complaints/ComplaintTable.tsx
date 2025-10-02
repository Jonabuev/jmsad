import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { 
  EyeIcon, 
  CheckIcon, 
  XMarkIcon, 
  ClockIcon,
  UserIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import { moderateComplaint } from '@/api/adminApi';
import { useAdminNotifications } from '@/component/hooks/useAdminNotifications';
import { logger } from '@/utils/logger';

interface Complaint {
  id: number;
  uuid: string;
  complainant: {
    id: number;
    username: string;
    email: string;
    role?: string;
  };
  accused: {
    id: number;
    username: string;
    email: string;
    role?: string;
  };
  description: string;
  status: 'pending' | 'reviewed' | 'rejected';
  created_at: string;
  updated_at: string;
  support_count: number;
  admin_comment?: string;
  moderated_by?: {
    username: string;
  };
  moderated_at?: string;
  disputes_count?: number;
}

interface ComplaintTableProps {
  complaints: Complaint[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onComplaintAction: (complaintUuid: string, action: string) => void;
}

export const ComplaintTable: React.FC<ComplaintTableProps> = ({
  complaints,
  loading,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  onComplaintAction,
}) => {
  const { t } = useTranslation('common');
  const [moderatingComplaint, setModeratingComplaint] = useState<string | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const { addNotification } = useAdminNotifications();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: t('complaints.filters.pending') },
      reviewed: { color: 'bg-green-100 text-green-800', icon: CheckIcon, text: t('complaints.filters.reviewed') },
      rejected: { color: 'bg-red-100 text-red-800', icon: XMarkIcon, text: t('complaints.filters.rejected') },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleModerate = async (complaintUuid: string, action: 'approve' | 'reject') => {
    try {
      setModeratingComplaint(complaintUuid);
      
      await moderateComplaint(complaintUuid, action, adminComment);
      onComplaintAction(complaintUuid, action);
      
      setAdminComment('');
      setModeratingComplaint(null);
      
      addNotification(
        'success',
        `Жалоба ${action === 'approve' ? 'одобрена' : 'отклонена'}`
      );
    } catch (error: unknown) {
      logger.error('Error moderating complaint:', error);
      addNotification('error', 'Ошибка при модерации жалобы');
    } finally {
      setModeratingComplaint(null);
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          {t('complaints.table.title')} ({totalCount})
        </h2>
      </div>

      {complaints.length === 0 ? (
        <div className="p-6 text-center">
          <div className="text-gray-500 text-lg mb-2">{t('complaints.table.no_complaints')}</div>
          <div className="text-gray-400 text-sm">
            {t('complaints.table.no_complaints_subtitle')}
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('complaints.table.id')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('complaints.table.complainant_accused')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('complaints.table.description')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('complaints.table.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('complaints.table.created_at')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('complaints.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {complaints.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{complaint.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <UserIcon className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="font-medium">{complaint.complainant.username}</span>
                          <span className="text-gray-500 ml-2">→</span>
                          <span className="text-gray-600">{complaint.accused.username}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {complaint.complainant.id} → {complaint.accused.id}
                        </div>
                        {(complaint.complainant.role || complaint.accused.role) && (
                          <div className="text-xs text-blue-600">
                            {complaint.complainant.role === 'tenant' ? 'Арендатор' : 
                             complaint.complainant.role === 'landlord' ? 'Арендодатель' : ''} → 
                            {complaint.accused.role === 'tenant' ? 'Арендатор' : 
                             complaint.accused.role === 'landlord' ? 'Арендодатель' : ''}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate">
                        {truncateText(complaint.description)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(complaint.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(complaint.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/complaints/${complaint.uuid}`}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Просмотр деталей"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Link>
                        
                        {complaint.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleModerate(complaint.uuid, 'approve')}
                              disabled={moderatingComplaint === complaint.uuid}
                              className="text-green-600 hover:text-green-900 transition-colors disabled:opacity-50"
                              title="Одобрить"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleModerate(complaint.uuid, 'reject')}
                              disabled={moderatingComplaint === complaint.uuid}
                              className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50"
                              title="Отклонить"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {complaint.disputes_count && complaint.disputes_count > 0 && (
                          <div className="flex items-center text-orange-600" title="Есть оспаривания">
                            <ChatBubbleLeftIcon className="w-4 h-4" />
                            <span className="ml-1 text-xs">{complaint.disputes_count}</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  {t('complaints.table.showing')} {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, totalCount)} {t('complaints.table.of')} {totalCount}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('complaints.table.previous')}
                  </button>
                  
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = Math.max(1, currentPage - 2) + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={`px-3 py-1 text-sm border rounded-md ${
                          pageNum === currentPage
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('complaints.table.next')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
