import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  getNotifications, 
  markAllNotificationsAsRead, 
  bulkDeleteNotifications,
  Notification,
  NotificationsResponse 
} from '../../../api/notificationsApi';
import { useAuth } from '../../hooks/useAuth';
import NotificationsHeader from './components/NotificationsHeader';
import NotificationsFilters from './components/NotificationsFilters';
import NotificationsStats from './components/NotificationsStats';
import NotificationsList from './components/NotificationsList';
import styles from './NotificationsPage.module.scss';

interface NotificationsPageProps {}

const NotificationsPage: React.FC<NotificationsPageProps> = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Фильтры
  const [filters, setFilters] = useState({
    type: '',
    priority: '',
    is_read: '',
    days: '30',
    search: '',
  });

  // Загрузка уведомлений
  const fetchNotifications = async (pageNum: number = 1, reset: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pageNum,
        page_size: 20,
        ...(filters.type && { type: filters.type }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.is_read && { is_read: filters.is_read === 'true' }),
        ...(filters.days && { days: parseInt(filters.days) }),
        ...(filters.search && { search: filters.search }),
      };

      const response = await getNotifications(params);
      const data: NotificationsResponse = response.data;
      
      if (reset) {
        setNotifications(data.results);
      } else {
        setNotifications(prev => [...prev, ...data.results]);
      }
      
      setHasNext(!!data.next);
      setHasPrevious(!!data.previous);
      setTotalCount(data.count);
      setPage(pageNum);
      
    } catch (error: any) {
      console.error('Ошибка загрузки уведомлений:', error);
      setError(error.message || 'Ошибка загрузки уведомлений');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка при монтировании
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(1, true);
    }
  }, [isAuthenticated]);

  // Применение фильтров
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(1, true);
    }
  }, [filters, isAuthenticated]);

  // Проверка аутентификации
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Обработчик обновления уведомления
  const handleNotificationUpdate = () => {
    fetchNotifications(page, true);
  };

  // Отметить все как прочитанные
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      handleNotificationUpdate();
    } catch (error) {
      console.error('Ошибка при отметке всех уведомлений как прочитанных:', error);
    }
  };

  // Массовое удаление
  const handleBulkDelete = async () => {
    if (selectedNotifications.length === 0) return;
    
    try {
      await bulkDeleteNotifications(selectedNotifications);
      setSelectedNotifications([]);
      handleNotificationUpdate();
    } catch (error) {
      console.error('Ошибка при массовом удалении:', error);
    }
  };

  // Переключение выбора уведомления
  const toggleNotificationSelection = (id: number) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(nId => nId !== id)
        : [...prev, id]
    );
  };

  // Выбрать все
  const selectAll = () => {
    setSelectedNotifications(notifications.map(n => n.id));
  };

  // Снять выбор со всех
  const deselectAll = () => {
    setSelectedNotifications([]);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{t('notifications.page.title', 'Уведомления')} - ARNO</title>
        <meta name="description" content={t('notifications.page.description', 'Управление уведомлениями')} />
      </Head>

      <div className={styles.notificationsPage}>
        <div className={styles.container}>
          {/* Заголовок */}
          <NotificationsHeader
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            selectedCount={selectedNotifications.length}
            onBulkDelete={handleBulkDelete}
            onMarkAllAsRead={handleMarkAllAsRead}
          />

          {/* Фильтры */}
          {showFilters && (
            <NotificationsFilters
              filters={filters}
              setFilters={setFilters}
            />
          )}

          {/* Статистика */}
          <NotificationsStats
            totalCount={totalCount}
            unreadCount={notifications.filter(n => !n.is_read).length}
            notifications={notifications}
            selectedCount={selectedNotifications.length}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
          />

          {/* Список уведомлений */}
          <NotificationsList
            notifications={notifications}
            loading={loading}
            error={error}
            selectedNotifications={selectedNotifications}
            onToggleSelection={toggleNotificationSelection}
            onUpdate={handleNotificationUpdate}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
            currentPage={page}
            onPageChange={fetchNotifications}
          />
        </div>
      </div>
    </>
  );
};

export default NotificationsPage;
