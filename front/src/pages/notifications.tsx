import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  getNotifications, 
  markAllNotificationsAsRead, 
  bulkDeleteNotifications,
  Notification,
  NotificationsResponse 
} from '../api/notificationsApi';
import { NotificationItem } from '../component/notifications';
import { useAuth } from '../component/hooks/useAuth';

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

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Заголовок */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {t('notifications.page.title', 'Уведомления')}
                </h1>
                <p className="mt-2 text-gray-600">
                  {t('notifications.page.subtitle', 'Управляйте своими уведомлениями')}
                </p>
              </div>
              
              {/* Действия */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
                >
                  {showFilters ? t('common.hide_filters', 'Скрыть фильтры') : t('common.show_filters', 'Показать фильтры')}
                </button>
                
                {selectedNotifications.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100 transition-colors duration-200"
                  >
                    {t('notifications.actions.delete_selected', 'Удалить выбранные')} ({selectedNotifications.length})
                  </button>
                )}
                
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition-colors duration-200"
                >
                  {t('notifications.actions.mark_all_read', 'Отметить все как прочитанные')}
                </button>
              </div>
            </div>
            </div>


          {/* Фильтры */}
          {showFilters && (
            <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('notifications.filters.type', 'Тип')}
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('common.all', 'Все')}</option>
                    <option value="complaint_received">{t('notifications.types.complaint_received', 'Получена жалоба')}</option>
                    <option value="rental_confirmed">{t('notifications.types.rental_confirmed', 'Аренда подтверждена')}</option>
                    <option value="system_update">{t('notifications.types.system_update', 'Обновление системы')}</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('notifications.filters.priority', 'Приоритет')}
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('common.all', 'Все')}</option>
                    <option value="low">{t('notifications.priority.low', 'Низкий')}</option>
                    <option value="normal">{t('notifications.priority.normal', 'Обычный')}</option>
                    <option value="high">{t('notifications.priority.high', 'Высокий')}</option>
                    <option value="urgent">{t('notifications.priority.urgent', 'Срочный')}</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('notifications.filters.status', 'Статус')}
                  </label>
                  <select
                    value={filters.is_read}
                    onChange={(e) => setFilters(prev => ({ ...prev, is_read: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('common.all', 'Все')}</option>
                    <option value="false">{t('notifications.status.unread', 'Непрочитанные')}</option>
                    <option value="true">{t('notifications.status.read', 'Прочитанные')}</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('notifications.filters.days', 'Период')}
                  </label>
                  <select
                    value={filters.days}
                    onChange={(e) => setFilters(prev => ({ ...prev, days: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="7">{t('notifications.period.7_days', '7 дней')}</option>
                    <option value="30">{t('notifications.period.30_days', '30 дней')}</option>
                    <option value="90">{t('notifications.period.90_days', '90 дней')}</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('common.search', 'Поиск')}
                  </label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder={t('notifications.search_placeholder', 'Поиск по уведомлениям...')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Статистика */}
          <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="text-sm text-gray-600">
                  {t('notifications.stats.total', 'Всего')}: <span className="font-medium">{totalCount}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {t('notifications.stats.unread', 'Непрочитанные')}: <span className="font-medium text-red-600">
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                </div>
              </div>
              
              {notifications.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={selectedNotifications.length === notifications.length ? deselectAll : selectAll}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
                  >
                    {selectedNotifications.length === notifications.length 
                      ? t('common.deselect_all', 'Снять выбор') 
                      : t('common.select_all', 'Выбрать все')
                    }
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Список уведомлений */}
          <div className="bg-white rounded-lg border border-gray-200">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">{t('notifications.loading', 'Загрузка...')}</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-red-600">{error}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('notifications.empty.title', 'Нет уведомлений')}
                </h3>
                <p className="text-gray-600">
                  {t('notifications.empty.description', 'У вас пока нет уведомлений')}
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="relative">
                      {selectedNotifications.length > 0 && (
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                          <input
                            type="checkbox"
                            checked={selectedNotifications.includes(notification.id)}
                            onChange={() => toggleNotificationSelection(notification.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                      )}
                      <div className={selectedNotifications.length > 0 ? 'pl-12' : ''}>
                        <NotificationItem
                          notification={notification}
                          onUpdate={handleNotificationUpdate}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Пагинация */}
                {(hasNext || hasPrevious) && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => fetchNotifications(page - 1, true)}
                        disabled={!hasPrevious}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        {t('common.previous', 'Назад')}
                      </button>
                      
                      <span className="text-sm text-gray-700">
                        {t('common.page', 'Страница')} {page}
                      </span>
                      
                      <button
                        onClick={() => fetchNotifications(page + 1, true)}
                        disabled={!hasNext}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        {t('common.next', 'Далее')}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'ru', ['common'])),
    },
  };
};

export default NotificationsPage;
