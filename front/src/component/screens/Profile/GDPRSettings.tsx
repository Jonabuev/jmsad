/**
 * GDPR Settings Component
 * 
 * Предоставляет пользователям управление их персональными данными в соответствии с GDPR:
 * - Экспорт данных (Article 20)
 * - Удаление данных (Article 17)
 * - Информация о правах
 */

import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import api from '@/service/api';
import styles from './GDPRSettings.module.scss';

interface GDPRSettingsProps {
  userId: number;
  username: string;
}

const GDPRSettings: React.FC<GDPRSettingsProps> = ({ userId, username }) => {
  const { t } = useTranslation("common");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  /**
   * Экспорт данных пользователя
   */
  const handleExportData = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await api.get('/gdpr/export-data/');
      
      // Создаем blob из JSON данных
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json'
      });
      
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my_data_${username}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setMessage({
        type: 'success',
        text: t('gdpr.exportSuccess')
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('gdpr.exportError')
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Удаление данных пользователя
   */
  const handleDeleteData = async () => {
    if (deleteConfirmText !== username) {
      setMessage({
        type: 'error',
        text: t('gdpr.deleteConfirmText')
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await api.post('/gdpr/delete-data/', {
        confirm: true
      });
      
      setMessage({
        type: 'success',
        text: response.data.message || t('gdpr.deleteSuccess')
      });
      
      // Через 3 секунды перенаправляем на страницу выхода
      setTimeout(() => {
        // Очищаем токены и перенаправляем
        document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login?deleted=true';
      }, 3000);
      
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('gdpr.deleteError')
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.gdprSettings}>
      <h2 className={styles.title}>{t('gdpr.title')}</h2>
      
      <div className={styles.section}>
        <h3>{t('gdpr.yourRights')}</h3>
        <ul className={styles.rightsList}>
          <li>{t('gdpr.rightAccess')}</li>
          <li>{t('gdpr.rightCorrection')}</li>
          <li>{t('gdpr.rightDeletion')}</li>
          <li>{t('gdpr.rightPortability')}</li>
        </ul>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {/* Экспорт данных */}
      <div className={styles.section}>
        <h3>{t('gdpr.exportTitle')}</h3>
        <p className={styles.description}>
          {t('gdpr.exportDescription')}
        </p>
        <button
          onClick={handleExportData}
          disabled={loading}
          className={styles.exportButton}
        >
          {loading ? t('gdpr.exporting') : t('gdpr.exportButton')}
        </button>
      </div>

      {/* Удаление данных */}
      <div className={styles.section}>
        <h3>🗑️ Удаление данных</h3>
        <p className={styles.description}>
          <strong>⚠️ ВНИМАНИЕ:</strong> Это действие необратимо!
        </p>
        
        {!showDeleteConfirm ? (
          <>
            <p className={styles.warningText}>
              При удалении будут анонимизированы:
            </p>
            <ul className={styles.deleteList}>
              <li>❌ Email и телефон</li>
              <li>❌ Имя и личные данные</li>
              <li>❌ Аватар</li>
              <li>❌ Документы удостоверяющие личность</li>
              <li>❌ ИИН/БИН</li>
            </ul>
            <p className={styles.warningText}>
              Будут сохранены (анонимизированы):
            </p>
            <ul className={styles.deleteList}>
              <li>📝 История аренды (для отчетности)</li>
              <li>📝 Жалобы (для юридических целей)</li>
            </ul>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className={styles.deleteButton}
            >
              Удалить мои данные
            </button>
          </>
        ) : (
          <div className={styles.confirmBox}>
            <p className={styles.confirmText}>
              Введите ваш username <strong>{username}</strong> для подтверждения:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Введите username"
              className={styles.confirmInput}
            />
            <div className={styles.confirmButtons}>
              <button
                onClick={handleDeleteData}
                disabled={loading || deleteConfirmText !== username}
                className={styles.confirmDeleteButton}
              >
                {loading ? 'Удаление...' : 'Подтвердить удаление'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                className={styles.cancelButton}
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Информация о GDPR */}
      <div className={styles.section}>
        <h3>ℹ️ О GDPR</h3>
        <p className={styles.infoText}>
          GDPR (General Data Protection Regulation) - это регламент ЕС о защите персональных данных.
          Он дает вам контроль над вашими данными.
        </p>
        <p className={styles.infoText}>
          Для вопросов свяжитесь с нами: <a href="mailto:arno.help.service@gmail.com">arno.help.service@gmail.com</a>
        </p>
      </div>
    </div>
  );
};

export default GDPRSettings;

