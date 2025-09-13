import React from 'react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';

interface FAQ {
  id: number;
  question_ru: string;
  answer_ru: string;
  question_kz?: string;
  answer_kz?: string;
  question_en?: string;
  answer_en?: string;
  category: string;
  user_type: string;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
  created_by_username: string;
}

interface FAQTableProps {
  faqs: FAQ[];
  loading: boolean;
  onDelete: (id: number) => void;
}

const FAQTable: React.FC<FAQTableProps> = ({ faqs, loading, onDelete }) => {
  const { t } = useTranslation('common');

  const getCategoryLabel = (category: string) => {
    const categories = {
      'general': t('admin.settings.faq.categories.general'),
      'rental': t('admin.settings.faq.categories.rental'),
      'complaints': t('admin.settings.faq.categories.complaints'),
      'verification': t('admin.settings.faq.categories.verification'),
      'payments': t('admin.settings.faq.categories.payments'),
    };
    return categories[category as keyof typeof categories] || category;
  };

  const getUserTypeLabel = (userType: string) => {
    const types = {
      'both': t('admin.settings.faq.user_type_both'),
      'tenants': t('admin.settings.faq.user_type_tenants'),
      'landlords': t('admin.settings.faq.user_type_landlords'),
    };
    return types[userType as keyof typeof types] || userType;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('admin.settings.faq.loading')}</p>
        </div>
      </div>
    );
  }

  if (faqs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.settings.faq.no_faq')}</h3>
          <p className="text-gray-600">{t('admin.settings.faq.no_faq_description')}</p>
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
                {t('admin.settings.faq.question')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                🇰🇿 KZ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                🇺🇸 EN
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.settings.faq.category')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.settings.faq.user_type')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.settings.faq.is_active')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.settings.faq.order')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.settings.faq.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {faqs.map((faq) => (
              <tr key={faq.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                    {faq.question_ru}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {faq.question_kz ? (
                    <span className="text-green-600">✅</span>
                  ) : (
                    <span className="text-red-400">❌</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {faq.question_en ? (
                    <span className="text-green-600">✅</span>
                  ) : (
                    <span className="text-red-400">❌</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {getCategoryLabel(faq.category)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                    {getUserTypeLabel(faq.user_type)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    faq.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {faq.is_active ? t('admin.settings.faq.active') : t('admin.settings.faq.inactive')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {faq.order}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <Link
                      href={`/admin/settings/faq/${faq.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {t('admin.settings.faq.edit')}
                    </Link>
                    <button
                      onClick={() => onDelete(faq.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      {t('admin.settings.faq.delete')}
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

export default FAQTable;
