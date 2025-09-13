import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { createComplaintReason, updateComplaintReason, getComplaintReasons } from '@/api/adminApi';
import { useAdminNotifications } from '@/component/hooks/useAdminNotifications';

interface ComplaintReasonFormProps {
  isEdit?: boolean;
}

interface ComplaintReasonData {
  reason: string;
  reason_kz: string;
  reason_en: string;
  type: string;
  is_default: boolean;
  order: number;
}

const ComplaintReasonForm: React.FC<ComplaintReasonFormProps> = ({ isEdit = false }) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { addNotification } = useAdminNotifications();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ComplaintReasonData>({
    reason: '',
    reason_kz: '',
    reason_en: '',
    type: 'tenant',
    is_default: false,
    order: 0,
  });

  useEffect(() => {
    if (isEdit && router.query.id) {
      // Load existing complaint reason data for editing
      loadComplaintReasonData(Number(router.query.id));
    }
  }, [isEdit, router.query.id]);

  const loadComplaintReasonData = async (id: number) => {
    try {
      setLoading(true);
      const response = await getComplaintReasons();
      const reason = response.data.find((item: any) => item.id === id);
      if (reason) {
        setFormData({
          reason: reason.reason || '',
          reason_kz: reason.reason_kz || '',
          reason_en: reason.reason_en || '',
          type: reason.type || 'tenant',
          is_default: reason.is_default || false,
          order: reason.order || 0,
        });
      }
    } catch (error) {
      console.error('Error loading complaint reason:', error);
      addNotification('error', t('admin.settings.complaintReasons.error_loading'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ComplaintReasonData, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reason.trim()) {
      addNotification('error', t('admin.settings.complaintReasons.validation.reason_required'));
      return;
    }

    try {
      setLoading(true);
      
      if (isEdit && router.query.id) {
        await updateComplaintReason(Number(router.query.id), formData);
        addNotification('success', t('admin.settings.complaintReasons.updated_successfully'));
      } else {
        await createComplaintReason(formData);
        addNotification('success', t('admin.settings.complaintReasons.created_successfully'));
      }
      
      router.push('/admin/settings/complaint-reasons');
    } catch (error: any) {
      console.error('Error saving complaint reason:', error);
      addNotification('error', isEdit ? t('admin.settings.complaintReasons.error_updating') : t('admin.settings.complaintReasons.error_creating'));
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="p-6">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? t('admin.settings.complaintReasons.edit') : t('admin.settings.complaintReasons.create')}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit ? t('admin.settings.complaintReasons.edit_subtitle') : t('admin.settings.complaintReasons.create_subtitle')}
            </p>
          </div>
          <Link
            href="/admin/settings/complaint-reasons"
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            {t('admin.settings.complaintReasons.back_to_list')}
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Russian (Required) */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🇷🇺 {t('admin.settings.complaintReasons.russian')} *
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  reason *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>
            </div>
          </div>

          {/* Kazakh */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🇰🇿 {t('admin.settings.complaintReasons.kazakh')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  reason_kz
                </label>
                <textarea
                  value={formData.reason_kz}
                  onChange={(e) => handleInputChange('reason_kz', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* English */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🇺🇸 {t('admin.settings.complaintReasons.english')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  reason_en
                </label>
                <textarea
                  value={formData.reason_en}
                  onChange={(e) => handleInputChange('reason_en', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('admin.settings.complaintReasons.settings')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.settings.complaintReasons.type')}
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="tenant">{t('admin.settings.complaintReasons.type_tenant')}</option>
                  <option value="landlord">{t('admin.settings.complaintReasons.type_landlord')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.settings.complaintReasons.order')}
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => handleInputChange('order', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
              <div>
                <label className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => handleInputChange('is_default', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {t('admin.settings.complaintReasons.is_default')}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <Link
            href="/admin/settings/complaint-reasons"
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            {t('admin.settings.complaintReasons.cancel')}
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (isEdit ? t('admin.settings.complaintReasons.updating') : t('admin.settings.complaintReasons.creating')) : (isEdit ? t('admin.settings.complaintReasons.update') : t('admin.settings.complaintReasons.create'))}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ComplaintReasonForm;