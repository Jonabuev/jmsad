import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import { ComplaintFilters } from './ComplaintFilters';
import { ComplaintTable } from './ComplaintTable';
import { getAdminComplaints, getComplaintStatistics } from '@/api/adminApi';
import { useAdminNotifications } from '@/component/hooks/useAdminNotifications';
import { ComplaintStats } from './ComplaintStats';
import { logger } from '@/utils/logger';

interface Complaint {
  id: number;
  uuid: string;
  complainant: {
    id: number;
    username: string;
    email: string;
  };
  accused: {
    id: number;
    username: string;
    email: string;
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

interface ComplaintFilters {
  status?: string;
  search?: string;
  ordering?: string;
  reason?: number;
  user_iin_bin?: string;
}

interface ComplaintStatistics {
  total_complaints: number;
  pending_complaints: number;
  reviewed_complaints: number;
  rejected_complaints: number;
  recent_complaints: number;
  monthly_complaints: number;
  total_disputes: number;
  recent_disputes: number;
  complaint_types: Array<{
    reasons__reason: string;
    count: number;
  }>;
}

export const ComplaintManagement: React.FC = () => {
  const { t } = useTranslation('common');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [statistics, setStatistics] = useState<ComplaintStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ComplaintFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { addNotification } = useAdminNotifications();

  const fetchComplaints = async (page: number = 1, filterParams: ComplaintFilters = {}) => {
    try {
      setLoading(true);
      const params = {
        page,
        ...filterParams,
      };
      
      const response = await getAdminComplaints(params);
      const data = response.data;
      
      logger.log('Complaints API response:', data);
      
      // API возвращает массив напрямую, а не объект с results и count
      const complaintsArray = Array.isArray(data) ? data : (data.results || []);
      const totalCount = Array.isArray(data) ? data.length : (data.count || 0);
      
      logger.log('Complaints results:', complaintsArray);
      logger.log('Total count:', totalCount);
      
      setComplaints(complaintsArray);
      setTotalPages(Math.ceil(totalCount / 20) || 1);
      setTotalCount(totalCount);
      setCurrentPage(page);
    } catch (error: unknown) {
      logger.error('Error fetching complaints:', error);
      addNotification('error', t('complaints.table.error_loading'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await getComplaintStatistics();
      setStatistics(response.data);
    } catch (error: unknown) {
      logger.error('Error fetching statistics:', error);
      addNotification('error', t('complaints.statistics.error_loading'));
    }
  }, [addNotification, t]);

  useEffect(() => {
    fetchComplaints(1, filters);
    fetchStatistics();
  }, [fetchStatistics, filters]);

  const handleFilterChange = (newFilters: ComplaintFilters) => {
    setFilters(newFilters);
    fetchComplaints(1, newFilters);
  };

  const handlePageChange = (page: number) => {
    fetchComplaints(page, filters);
  };

  const handleComplaintAction = async (complaintUuid: string, action: string) => {
    try {
      // Обновляем локально для оптимистичного UI
      setComplaints(prev => 
        prev.map(complaint => 
          complaint.uuid === complaintUuid 
            ? { 
                ...complaint, 
                status: action === 'approve' ? 'reviewed' : 'rejected',
                moderated_at: new Date().toISOString()
              }
            : complaint
        )
      );

      // Обновляем статистику
      await fetchStatistics();
      
      addNotification(
        'success',
        action === 'approve' ? t('complaints.moderation.approve_success') : t('complaints.moderation.reject_success')
      );
    } catch (error: any) {
      console.error('Error handling complaint action:', error);
      addNotification('error', t('complaints.moderation.error'));
      
      // Откатываем изменения при ошибке
      fetchComplaints(currentPage, filters);
    }
  };

  return (
    <div className="space-y-6">
      {/* Статистика */}
      {statistics && (
        <ComplaintStats statistics={statistics} />
      )}

      {/* Фильтры */}
      <ComplaintFilters 
        onFilterChange={handleFilterChange}
        currentFilters={filters}
      />

      {/* Таблица жалоб */}
      <ComplaintTable
        complaints={complaints}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onComplaintAction={handleComplaintAction}
      />
    </div>
  );
};
