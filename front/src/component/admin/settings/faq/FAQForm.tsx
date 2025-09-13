import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { createFAQ, updateFAQ, getFAQ } from '@/api/adminApi';
import { useAdminNotifications } from '@/component/hooks/useAdminNotifications';

interface FAQFormProps {
  isEdit?: boolean;
}

interface FAQData {
  question_ru: string;
  answer_ru: string;
  question_kz: string;
  answer_kz: string;
  question_en: string;
  answer_en: string;
  category: string;
  user_type: string;
  is_active: boolean;
  order: number;
}

const FAQForm: React.FC<FAQFormProps> = ({ isEdit = false }) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { addNotification } = useAdminNotifications();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FAQData>({
    question_ru: '',
    answer_ru: '',
    question_kz: '',
    answer_kz: '',
    question_en: '',
    answer_en: '',
    category: 'general',
    user_type: 'both',
    is_active: true,
    order: 0,
  });

  const categoryOptions = [
    { value: 'general', label: t('admin.settings.faq.categories.general') },
    { value: 'rental', label: t('admin.settings.faq.categories.rental') },
    { value: 'complaints', label: t('admin.settings.faq.categories.complaints') },
    { value: 'verification', label: t('admin.settings.faq.categories.verification') },
    { value: 'payments', label: t('admin.settings.faq.categories.payments') },
  ];

  const userTypeOptions = [
    { value: 'both', label: t('admin.settings.faq.user_type_both') },
    { value: 'tenants', label: t('admin.settings.faq.user_type_tenants') },
    { value: 'landlords', label: t('admin.settings.faq.user_type_landlords') },
  ];

  useEffect(() => {
    if (isEdit && router.query.id) {
      // Load existing FAQ data for editing
      loadFAQData(Number(router.query.id));
    }
  }, [isEdit, router.query.id]);

  const loadFAQData = async (id: number) => {
    try {
      setLoading(true);
      const response = await getFAQ();
      const faq = response.data.find((item: any) => item.id === id);
      if (faq) {
        setFormData({
          question_ru: faq.question_ru || '',
          answer_ru: faq.answer_ru || '',
          question_kz: faq.question_kz || '',
          answer_kz: faq.answer_kz || '',
          question_en: faq.question_en || '',
          answer_en: faq.answer_en || '',
          category: faq.category || 'general',
          user_type: faq.user_type || 'both',
          is_active: faq.is_active !== undefined ? faq.is_active : true,
          order: faq.order || 0,
        });
      }
    } catch (error) {
      console.error('Error loading FAQ:', error);
      addNotification('error', t('admin.settings.faq.error_loading'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FAQData, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question_ru.trim() || !formData.answer_ru.trim()) {
      addNotification('error', t('admin.settings.faq.fill_required_fields'));
      return;
    }

    try {
      setLoading(true);
      
      if (isEdit && router.query.id) {
        await updateFAQ(Number(router.query.id), formData);
        addNotification('success', t('admin.settings.faq.updated_successfully'));
      } else {
        await createFAQ(formData);
        addNotification('success', t('admin.settings.faq.created_successfully'));
      }
      
      router.push('/admin/settings/faq');
    } catch (error: any) {
      console.error('Error saving FAQ:', error);
      addNotification('error', t('admin.settings.faq.error_saving'));
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
              {isEdit ? t('admin.settings.faq.edit') : t('admin.settings.faq.create')}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit ? t('admin.settings.faq.edit_subtitle') : t('admin.settings.faq.create_subtitle')}
            </p>
          </div>
          <Link
            href="/admin/settings/faq"
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            {t('admin.settings.faq.back_to_list')}
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Russian (Required) */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🇷🇺 {t('admin.settings.faq.russian')} *
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.settings.faq.question')} *
                </label>
                <textarea
                  value={formData.question_ru}
                  onChange={(e) => handleInputChange('question_ru', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.settings.faq.answer')} *
                </label>
                <textarea
                  value={formData.answer_ru}
                  onChange={(e) => handleInputChange('answer_ru', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={5}
                  required
                />
              </div>
            </div>
          </div>

          {/* Kazakh */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🇰🇿 {t('admin.settings.faq.kazakh')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.settings.faq.question')}
                </label>
                <textarea
                  value={formData.question_kz}
                  onChange={(e) => handleInputChange('question_kz', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.settings.faq.answer')}
                </label>
                <textarea
                  value={formData.answer_kz}
                  onChange={(e) => handleInputChange('answer_kz', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={5}
                />
              </div>
            </div>
          </div>

          {/* English */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🇺🇸 {t('admin.settings.faq.english')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.settings.faq.question')}
                </label>
                <textarea
                  value={formData.question_en}
                  onChange={(e) => handleInputChange('question_en', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.settings.faq.answer')}
                </label>
                <textarea
                  value={formData.answer_en}
                  onChange={(e) => handleInputChange('answer_en', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={5}
                />
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('admin.settings.faq.settings')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.settings.faq.category')}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.settings.faq.user_type')}
                </label>
                <select
                  value={formData.user_type}
                  onChange={(e) => handleInputChange('user_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {userTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.settings.faq.order')}
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => handleInputChange('order', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {t('admin.settings.faq.is_active')}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <Link
            href="/admin/settings/faq"
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            {t('admin.settings.faq.cancel')}
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('admin.settings.faq.saving') : (isEdit ? t('admin.settings.faq.update') : t('admin.settings.faq.create'))}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FAQForm;
