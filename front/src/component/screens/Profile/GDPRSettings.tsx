/**
 * GDPR Settings Component
 * 
 * Предоставляет пользователям управление их персональными данными в соответствии с GDPR:
 * - Экспорт данных (Article 20)
 * - Удаление данных (Article 17)
 * - Информация о правах
 */

import { useState } from 'react';
import api from '@/service/api';
import styles from './GDPRSettings.module.scss';

interface GDPRSettingsProps {
  userId: number;
  username: string;
}

const GDPRSettings: React.FC<GDPRSettingsProps> = ({ userId, username }) => {
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
        text: 'Данные успешно экспортированы'
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Ошибка при экспорте данных'
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
        text: 'Введите ваш username для подтверждения'
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
        text: response.data.message || 'Данные успешно удалены'
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
        text: error.response?.data?.message || 'Ошибка при удалении данных'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.gdprSettings}>
      <h2 className={styles.title}>🛡️ Управление данными (GDPR)</h2>
      
      <div className={styles.section}>
        <h3>Ваши права</h3>
        <ul className={styles.rightsList}>
          <li>✅ Право на доступ к своим данным</li>
          <li>✅ Право на исправление данных</li>
          <li>✅ Право на удаление ("право быть забытым")</li>
          <li>✅ Право на перенос данных</li>
        </ul>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {/* Экспорт данных */}
      <div className={styles.section}>
        <h3>📤 Экспорт данных</h3>
        <p className={styles.description}>
          Скачайте все ваши персональные данные в формате JSON. 
          Включает личные данные, историю аренды, жалобы.
        </p>
        <button
          onClick={handleExportData}
          disabled={loading}
          className={styles.exportButton}
        >
          {loading ? 'Экспорт...' : '📥 Скачать мои данные'}
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

