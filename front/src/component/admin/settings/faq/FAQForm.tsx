import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { createFAQ, updateFAQ, getFAQ } from '@/api/adminApi';
import { useAdminNotifications } from '@/component/hooks/useAdminNotifications';
import styles from './FAQForm.module.scss';

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
      <div className={styles.faqForm}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.faqForm}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerInfo}>
            <h1 className={styles.pageTitle}>
              {isEdit ? t('admin.settings.faq.edit') : t('admin.settings.faq.create')}
            </h1>
            <p className={styles.pageSubtitle}>
              {isEdit ? t('admin.settings.faq.edit_subtitle') : t('admin.settings.faq.create_subtitle')}
            </p>
          </div>
          <Link
            href="/admin/settings/faq"
            className={styles.backButton}
          >
            {t('admin.settings.faq.back_to_list')}
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          {/* Russian (Required) */}
          <div className={`${styles.languageSection} ${styles.languageSectionFull}`}>
            <h3 className={styles.languageHeader}>
              🇷🇺 {t('admin.settings.faq.russian')} *
            </h3>
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                {t('admin.settings.faq.question')} *
              </label>
              <textarea
                value={formData.question_ru}
                onChange={(e) => handleInputChange('question_ru', e.target.value)}
                className={styles.formTextarea}
                rows={3}
                required
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                {t('admin.settings.faq.answer')} *
              </label>
              <textarea
                value={formData.answer_ru}
                onChange={(e) => handleInputChange('answer_ru', e.target.value)}
                className={styles.formTextarea}
                rows={5}
                required
              />
            </div>
          </div>

          {/* Kazakh */}
          <div className={styles.languageSection}>
            <h3 className={styles.languageHeader}>
              🇰🇿 {t('admin.settings.faq.kazakh')}
            </h3>
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                {t('admin.settings.faq.question')}
              </label>
              <textarea
                value={formData.question_kz}
                onChange={(e) => handleInputChange('question_kz', e.target.value)}
                className={styles.formTextarea}
                rows={3}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                {t('admin.settings.faq.answer')}
              </label>
              <textarea
                value={formData.answer_kz}
                onChange={(e) => handleInputChange('answer_kz', e.target.value)}
                className={styles.formTextarea}
                rows={5}
              />
            </div>
          </div>

          {/* English */}
          <div className={styles.languageSection}>
            <h3 className={styles.languageHeader}>
              🇺🇸 {t('admin.settings.faq.english')}
            </h3>
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                {t('admin.settings.faq.question')}
              </label>
              <textarea
                value={formData.question_en}
                onChange={(e) => handleInputChange('question_en', e.target.value)}
                className={styles.formTextarea}
                rows={3}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                {t('admin.settings.faq.answer')}
              </label>
              <textarea
                value={formData.answer_en}
                onChange={(e) => handleInputChange('answer_en', e.target.value)}
                className={styles.formTextarea}
                rows={5}
              />
            </div>
          </div>

          {/* Settings */}
          <div className={styles.settingsSection}>
            <h3 className={styles.settingsHeader}>
              {t('admin.settings.faq.settings')}
            </h3>
            <div className={styles.settingsGrid}>
              <div className={styles.settingsField}>
                <label className={styles.settingsLabel}>
                  {t('admin.settings.faq.category')}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={styles.settingsSelect}
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.settingsField}>
                <label className={styles.settingsLabel}>
                  {t('admin.settings.faq.user_type')}
                </label>
                <select
                  value={formData.user_type}
                  onChange={(e) => handleInputChange('user_type', e.target.value)}
                  className={styles.settingsSelect}
                >
                  {userTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.settingsField}>
                <label className={styles.settingsLabel}>
                  {t('admin.settings.faq.order')}
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => handleInputChange('order', Number(e.target.value))}
                  className={styles.settingsInput}
                  min="0"
                />
              </div>
            </div>
            <div className={styles.checkboxContainer}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>
                  {t('admin.settings.faq.is_active')}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className={styles.formActions}>
          <Link
            href="/admin/settings/faq"
            className={styles.cancelButton}
          >
            {t('admin.settings.faq.cancel')}
          </Link>
          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? (
              <>
                <svg className={styles.submitButtonSpinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('admin.settings.faq.saving')}
              </>
            ) : (
              isEdit ? t('admin.settings.faq.update') : t('admin.settings.faq.create')
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FAQForm;
