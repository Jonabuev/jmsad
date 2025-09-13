import React from 'react';
import { useTranslation } from 'next-i18next';

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

interface ComplaintStatsProps {
  statistics: ComplaintStatistics;
}

export const ComplaintStats: React.FC<ComplaintStatsProps> = ({ statistics }) => {
  const { t } = useTranslation('common');
  
  const stats = [
    {
      title: t('complaints.statistics.total'),
      value: statistics.total_complaints,
      icon: '📋',
      color: 'bg-blue-500',
      change: null,
    },
    {
      title: t('complaints.statistics.pending'),
      value: statistics.pending_complaints,
      icon: '⏳',
      color: 'bg-yellow-500',
      change: null,
    },
    {
      title: t('complaints.statistics.reviewed'),
      value: statistics.reviewed_complaints,
      icon: '✅',
      color: 'bg-green-500',
      change: null,
    },
    {
      title: t('complaints.statistics.rejected'),
      value: statistics.rejected_complaints,
      icon: '❌',
      color: 'bg-red-500',
      change: null,
    },
    {
      title: t('complaints.statistics.recent'),
      value: statistics.recent_complaints,
      icon: '📅',
      color: 'bg-purple-500',
      change: null,
    },
    {
      title: t('complaints.statistics.disputes'),
      value: statistics.total_disputes,
      icon: '⚖️',
      color: 'bg-orange-500',
      change: null,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {t('complaints.statistics.title')}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center text-white text-xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Топ типов жалоб */}
      {statistics.complaint_types && statistics.complaint_types.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('complaints.statistics.popular_types')}
          </h3>
          <div className="space-y-2">
            {statistics.complaint_types.slice(0, 5).map((type, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <span className="text-sm font-medium text-gray-700">
                  {type.reasons__reason || 'Не указано'}
                </span>
                <span className="text-sm font-bold text-gray-900 bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {type.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
