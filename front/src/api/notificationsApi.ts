import api from '@/service/api';

// Типы для уведомлений
export interface Notification {
  id: number;
  type: string;
  type_display: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  priority_display: string;
  title: string;
  message: string;
  is_read: boolean;
  action_url: string | null;
  metadata: any;
  created_at: string;
  read_at: string | null;
  time_ago: string;
}

export interface NotificationSettings {
  email_enabled: boolean;
  email_complaints: boolean;
  email_rentals: boolean;
  email_system: boolean;
  email_promotions: boolean;
  push_enabled: boolean;
  push_complaints: boolean;
  push_rentals: boolean;
  push_system: boolean;
  push_promotions: boolean;
  sms_enabled: boolean;
  sms_urgent_only: boolean;
  phone_number: string;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  digest_frequency: 'none' | 'daily' | 'weekly';
}

export interface NotificationsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Notification[];
}

export interface UnreadCountResponse {
  unread_count: number;
}

// API функции для уведомлений
export const getNotifications = (params?: {
  page?: number;
  page_size?: number;
  type?: string;
  priority?: string;
  is_read?: boolean;
  days?: number;
  unread_only?: boolean;
  search?: string;
  ordering?: string;
}) => api.get<NotificationsResponse>('/notifications/', { params });

export const getUnreadCount = () => api.get<UnreadCountResponse>('/notifications/unread-count/');

export const markNotificationAsRead = (id: number) => 
  api.patch(`/notifications/${id}/read/`);

export const markAllNotificationsAsRead = () => 
  api.post('/notifications/mark-all-read/');

export const deleteNotification = (id: number) => 
  api.delete(`/notifications/${id}/delete/`);

export const bulkDeleteNotifications = (notificationIds: number[]) => 
  api.post('/notifications/bulk-delete/', { notification_ids: notificationIds });

export const getNotificationSettings = () => 
  api.get<NotificationSettings>('/notifications/settings/');

export const updateNotificationSettings = (settings: Partial<NotificationSettings>) => 
  api.put('/notifications/settings/', settings);

// Функция для получения иконки уведомления по типу
export const getNotificationIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    // Жалобы
    'complaint_received': '📋',
    'complaint_status_updated': '🔄',
    'complaint_supported': '👍',
    'complaint_commented': '💬',
    
    // Аренда
    'rental_confirmed': '✅',
    'rental_rejected': '❌',
    'rental_request_received': '📝',
    'rental_starting_soon': '⏰',
    'rental_ending_soon': '⏳',
    
    // Пользователи
    'user_verified': '✅',
    'user_banned': '🚫',
    'user_unbanned': '🔓',
    'profile_updated': '👤',
    
    // Системные
    'system_maintenance': '🔧',
    'system_update': '🆕',
    'security_alert': '⚠️',
    
    // Новые возможности
    'new_feature': '✨',
    'promotion': '🎉',
    'reminder': '⏰',
  };
  
  return iconMap[type] || '🔔';
};

// Функция для получения цвета приоритета
export const getPriorityColor = (priority: string): string => {
  const colorMap: Record<string, string> = {
    'low': 'text-gray-500 bg-gray-100',
    'normal': 'text-blue-600 bg-blue-100',
    'high': 'text-orange-600 bg-orange-100',
    'urgent': 'text-red-600 bg-red-100',
  };
  
  return colorMap[priority] || 'text-gray-600 bg-gray-100';
};

// Функция для получения цвета типа уведомления
export const getTypeColor = (type: string): string => {
  if (type.startsWith('complaint')) {
    return 'text-red-600 bg-red-50 border-red-200';
  } else if (type.startsWith('rental')) {
    return 'text-green-600 bg-green-50 border-green-200';
  } else if (type.startsWith('user')) {
    return 'text-blue-600 bg-blue-50 border-blue-200';
  } else if (type.startsWith('system')) {
    return 'text-purple-600 bg-purple-50 border-purple-200';
  } else {
    return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};
