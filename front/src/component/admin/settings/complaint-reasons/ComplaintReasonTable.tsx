import React from 'react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';

interface ComplaintReason {
  id: number;
  reason: string;
  reason_kz?: string;
  reason_en?: string;
  type: string;
  is_default: boolean;
  order: number;
}

interface ComplaintReasonTableProps {
  reasons: ComplaintReason[];
  loading: boolean;
  onDelete: (id: number) => void;
}

const ComplaintReasonTable: React.FC<ComplaintReasonTableProps> = ({ reasons, loading, onDelete }) => {
  const { t } = useTranslation('common');

  const getTypeLabel = (type: string) => {
    const types = {
      'tenant': t('admin.settings.complaintReasons.types.tenant'),
      'landlord': t('admin.settings.complaintReasons.types.landlord'),
    };
    return types[type as keyof typeof types] || type;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('admin.settings.complaintReasons.loading')}</p>
        </div>
      </div>
    );
  }

  if (reasons.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.settings.complaintReasons.no_reasons')}</h3>
          <p className="text-gray-600">{t('admin.settings.complaintReasons.no_reasons_description')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.settings.complaintReasons.reason')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                🇰🇿 KZ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                🇺🇸 EN
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.settings.complaintReasons.type')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.settings.complaintReasons.is_default')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.settings.complaintReasons.order')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.settings.complaintReasons.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reasons.map((reason) => (
              <tr key={reason.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                    {reason.reason}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {reason.reason_kz ? (
                    <span className="text-green-600">✅</span>
                  ) : (
                    <span className="text-red-400">❌</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {reason.reason_en ? (
                    <span className="text-green-600">✅</span>
                  ) : (
                    <span className="text-red-400">❌</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    reason.type === 'tenant' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {getTypeLabel(reason.type)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    reason.is_default ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {reason.is_default ? t('admin.settings.complaintReasons.default') : t('admin.settings.complaintReasons.custom')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {reason.order}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <Link
                      href={`/admin/settings/complaint-reasons/${reason.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {t('admin.settings.complaintReasons.edit')}
                    </Link>
                    <button
                      onClick={() => onDelete(reason.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      {t('admin.settings.complaintReasons.delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComplaintReasonTable;
