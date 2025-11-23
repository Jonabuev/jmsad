import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { createComplaintReason, updateComplaintReason, getComplaintReasons } from '@/api/adminApi';
import { useAdminNotifications } from '@/component/hooks/useAdminNotifications';
import styles from './ComplaintReasonForm.module.scss';

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
      <div className={styles.complaintReasonForm}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.complaintReasonForm}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerInfo}>
            <h1 className={styles.pageTitle}>
              {isEdit ? t('admin.settings.complaintReasons.edit') : t('admin.settings.complaintReasons.create')}
            </h1>
            <p className={styles.pageSubtitle}>
              {isEdit ? t('admin.settings.complaintReasons.edit_subtitle') : t('admin.settings.complaintReasons.create_subtitle')}
            </p>
          </div>
          <Link
            href="/admin/settings/complaint-reasons"
            className={styles.backButton}
          >
            {t('admin.settings.complaintReasons.back_to_list')}
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          {/* Russian (Required) */}
          <div className={`${styles.languageSection} ${styles.languageSectionFull}`}>
            <h3 className={styles.languageHeader}>
              🇷🇺 {t('admin.settings.complaintReasons.russian')} *
            </h3>
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                reason *
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                className={styles.formTextarea}
                rows={3}
                required
              />
            </div>
          </div>

          {/* Kazakh */}
          <div className={styles.languageSection}>
            <h3 className={styles.languageHeader}>
              🇰🇿 {t('admin.settings.complaintReasons.kazakh')}
            </h3>
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                reason_kz
              </label>
              <textarea
                value={formData.reason_kz}
                onChange={(e) => handleInputChange('reason_kz', e.target.value)}
                className={styles.formTextarea}
                rows={3}
              />
            </div>
          </div>

          {/* English */}
          <div className={styles.languageSection}>
            <h3 className={styles.languageHeader}>
              🇺🇸 {t('admin.settings.complaintReasons.english')}
            </h3>
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                reason_en
              </label>
              <textarea
                value={formData.reason_en}
                onChange={(e) => handleInputChange('reason_en', e.target.value)}
                className={styles.formTextarea}
                rows={3}
              />
            </div>
          </div>

          {/* Settings */}
          <div className={styles.settingsSection}>
            <h3 className={styles.settingsHeader}>
              {t('admin.settings.complaintReasons.settings')}
            </h3>
            <div className={styles.settingsGrid}>
              <div className={styles.settingsField}>
                <label className={styles.settingsLabel}>
                  {t('admin.settings.complaintReasons.type')}
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className={styles.settingsSelect}
                >
                  <option value="tenant">{t('admin.settings.complaintReasons.type_tenant')}</option>
                  <option value="landlord">{t('admin.settings.complaintReasons.type_landlord')}</option>
                </select>
              </div>
              <div className={styles.settingsField}>
                <label className={styles.settingsLabel}>
                  {t('admin.settings.complaintReasons.order')}
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => handleInputChange('order', Number(e.target.value))}
                  className={styles.settingsInput}
                  min="0"
                />
              </div>
              <div className={styles.settingsField}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => handleInputChange('is_default', e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxText}>
                    {t('admin.settings.complaintReasons.is_default')}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.formActions}>
          <Link
            href="/admin/settings/complaint-reasons"
            className={styles.cancelButton}
          >
            {t('admin.settings.complaintReasons.cancel')}
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
                {isEdit ? t('admin.settings.complaintReasons.updating') : t('admin.settings.complaintReasons.creating')}
              </>
            ) : (
              isEdit ? t('admin.settings.complaintReasons.update') : t('admin.settings.complaintReasons.create')
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ComplaintReasonForm;