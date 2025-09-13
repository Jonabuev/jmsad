import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { 
  getNotificationSettings, 
  updateNotificationSettings,
  NotificationSettings as NotificationSettingsType 
} from '../../api/notificationsApi';
import { useAdminNotifications } from '../hooks/useAdminNotifications';

interface NotificationSettingsProps {
  className?: string;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ className = '' }) => {
  const { t } = useTranslation('common');
  const { addNotification } = useAdminNotifications();
  
  const [settings, setSettings] = useState<NotificationSettingsType>({
    email_enabled: true,
    email_complaints: true,
    email_rentals: true,
    email_system: true,
    email_promotions: false,
    push_enabled: true,
    push_complaints: true,
    push_rentals: true,
    push_system: true,
    push_promotions: false,
    sms_enabled: false,
    sms_urgent_only: true,
    phone_number: '',
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    timezone: 'Asia/Almaty',
    digest_frequency: 'none',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Загрузка настроек
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await getNotificationSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Ошибка загрузки настроек уведомлений:', error);
      addNotification('error', 'Ошибка загрузки настроек');
    } finally {
      setLoading(false);
    }
  };

  // Сохранение настроек
  const saveSettings = async () => {
    try {
      setSaving(true);
      await updateNotificationSettings(settings);
      addNotification('success', 'Настройки уведомлений сохранены');
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      addNotification('error', 'Ошибка сохранения настроек');
    } finally {
      setSaving(false);
    }
  };

  // Загрузка при монтировании
  useEffect(() => {
    fetchSettings();
  }, []);

  // Обработчики изменений
  const handleEmailToggle = (field: keyof NotificationSettingsType, value: boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handlePushToggle = (field: keyof NotificationSettingsType, value: boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSmsToggle = (field: keyof NotificationSettingsType, value: boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleTimeChange = (field: 'quiet_hours_start' | 'quiet_hours_end', value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectChange = (field: keyof NotificationSettingsType, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (field: keyof NotificationSettingsType, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('notifications.settings.title', 'Настройки уведомлений')}
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          {t('notifications.settings.subtitle', 'Выберите, какие уведомления вы хотите получать')}
        </p>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* Email уведомления */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">
              {t('notifications.settings.email.title', 'Email уведомления')}
            </h4>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.email_enabled}
                onChange={(e) => handleEmailToggle('email_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.email_enabled && (
            <div className="space-y-3 ml-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">
                  {t('notifications.settings.email.complaints', 'Жалобы')}
                </label>
                <input
                  type="checkbox"
                  checked={settings.email_complaints}
                  onChange={(e) => handleEmailToggle('email_complaints', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">
                  {t('notifications.settings.email.rentals', 'Аренда')}
                </label>
                <input
                  type="checkbox"
                  checked={settings.email_rentals}
                  onChange={(e) => handleEmailToggle('email_rentals', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">
                  {t('notifications.settings.email.system', 'Системные')}
                </label>
                <input
                  type="checkbox"
                  checked={settings.email_system}
                  onChange={(e) => handleEmailToggle('email_system', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">
                  {t('notifications.settings.email.promotions', 'Промо и акции')}
                </label>
                <input
                  type="checkbox"
                  checked={settings.email_promotions}
                  onChange={(e) => handleEmailToggle('email_promotions', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Push уведомления */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">
              {t('notifications.settings.push.title', 'Push уведомления')}
            </h4>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.push_enabled}
                onChange={(e) => handlePushToggle('push_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.push_enabled && (
            <div className="space-y-3 ml-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">
                  {t('notifications.settings.push.complaints', 'Жалобы')}
                </label>
                <input
                  type="checkbox"
                  checked={settings.push_complaints}
                  onChange={(e) => handlePushToggle('push_complaints', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">
                  {t('notifications.settings.push.rentals', 'Аренда')}
                </label>
                <input
                  type="checkbox"
                  checked={settings.push_rentals}
                  onChange={(e) => handlePushToggle('push_rentals', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">
                  {t('notifications.settings.push.system', 'Системные')}
                </label>
                <input
                  type="checkbox"
                  checked={settings.push_system}
                  onChange={(e) => handlePushToggle('push_system', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">
                  {t('notifications.settings.push.promotions', 'Промо и акции')}
                </label>
                <input
                  type="checkbox"
                  checked={settings.push_promotions}
                  onChange={(e) => handlePushToggle('push_promotions', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* SMS уведомления */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">
              {t('notifications.settings.sms.title', 'SMS уведомления')}
            </h4>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.sms_enabled}
                onChange={(e) => handleSmsToggle('sms_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.sms_enabled && (
            <div className="space-y-3 ml-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('notifications.settings.sms.phone_number', 'Номер телефона')}
                </label>
                <input
                  type="tel"
                  value={settings.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">
                  {t('notifications.settings.sms.urgent_only', 'Только срочные')}
                </label>
                <input
                  type="checkbox"
                  checked={settings.sms_urgent_only}
                  onChange={(e) => handleSmsToggle('sms_urgent_only', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Тихие часы */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">
            {t('notifications.settings.quiet_hours.title', 'Тихие часы')}
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('notifications.settings.quiet_hours.start', 'Начало')}
              </label>
              <input
                type="time"
                value={settings.quiet_hours_start}
                onChange={(e) => handleTimeChange('quiet_hours_start', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('notifications.settings.quiet_hours.end', 'Конец')}
              </label>
              <input
                type="time"
                value={settings.quiet_hours_end}
                onChange={(e) => handleTimeChange('quiet_hours_end', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {t('notifications.settings.quiet_hours.description', 'В это время уведомления не будут отправляться')}
          </p>
        </div>

        {/* Часовой пояс */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('notifications.settings.timezone', 'Часовой пояс')}
          </label>
          <select
            value={settings.timezone}
            onChange={(e) => handleSelectChange('timezone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Asia/Almaty">Asia/Almaty (UTC+6)</option>
            <option value="Asia/Aqtobe">Asia/Aqtobe (UTC+5)</option>
            <option value="Asia/Aqtau">Asia/Aqtau (UTC+5)</option>
          </select>
        </div>

        {/* Частота дайджеста */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('notifications.settings.digest_frequency', 'Частота дайджеста')}
          </label>
          <select
            value={settings.digest_frequency}
            onChange={(e) => handleSelectChange('digest_frequency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="none">{t('notifications.settings.digest.none', 'Не отправлять')}</option>
            <option value="daily">{t('notifications.settings.digest.daily', 'Ежедневно')}</option>
            <option value="weekly">{t('notifications.settings.digest.weekly', 'Еженедельно')}</option>
          </select>
        </div>
      </div>

      {/* Кнопка сохранения */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {saving ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {t('common.saving', 'Сохранение...')}
            </div>
          ) : (
            t('common.save', 'Сохранить')
          )}
        </button>
      </div>
    </div>
  );
};

export default NotificationSettings;
