// Типы для системы уведомлений

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  is_read: boolean;
  is_email_sent: boolean;
  is_sms_sent: boolean;
  is_push_sent: boolean;
  action_url?: string;
  created_at: string;
  read_at?: string;
  expires_at?: string;
  metadata: Record<string, any>;
  related_rental?: number;
  related_house?: number;
}

export interface NotificationSettings {
  id: number;
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
  phone_number?: string;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone: string;
  digest_frequency: DigestFrequency;
}

export interface FCMToken {
  id: number;
  token: string;
  device_type: DeviceType;
  device_info: Record<string, any>;
  is_active: boolean;
  last_used: string;
  created_at: string;
}

export interface NotificationsResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Notification[];
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface NotificationFilters {
  type?: NotificationType;
  priority?: NotificationPriority;
  is_read?: boolean;
  days?: number;
  search?: string;
  page?: number;
  page_size?: number;
}

// Типы уведомлений
export type NotificationType = 
  | 'complaint_received'
  | 'complaint_status_updated'
  | 'complaint_supported'
  | 'complaint_commented'
  | 'rental_confirmed'
  | 'rental_rejected'
  | 'rental_request_received'
  | 'rental_starting_soon'
  | 'rental_ending_soon'
  | 'user_verified'
  | 'user_banned'
  | 'user_unbanned'
  | 'profile_updated'
  | 'system_maintenance'
  | 'system_update'
  | 'security_alert'
  | 'new_feature'
  | 'promotion'
  | 'reminder';

// Приоритеты уведомлений
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

// Типы устройств
export type DeviceType = 'web' | 'android' | 'ios' | 'desktop';

// Частота дайджестов
export type DigestFrequency = 'never' | 'daily' | 'weekly' | 'monthly';

// Данные для push уведомлений
export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    type: NotificationType;
    priority: NotificationPriority;
    notification_id: number;
    action_url?: string;
    timestamp: string;
  };
}

// Настройки для отправки уведомлений
export interface NotificationSendOptions {
  email?: boolean;
  push?: boolean;
  sms?: boolean;
  priority?: NotificationPriority;
  expires_at?: string;
  action_url?: string;
  metadata?: Record<string, any>;
}

// Статистика уведомлений
export interface NotificationStats {
  total: number;
  unread: number;
  by_type: Record<NotificationType, number>;
  by_priority: Record<NotificationPriority, number>;
  recent_activity: Notification[];
}

// Конфигурация для Firebase
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Утилиты для работы с типами
export const NOTIFICATION_TYPES: Record<NotificationType, string> = {
  complaint_received: 'complaint_received',
  complaint_status_updated: 'complaint_status_updated',
  complaint_supported: 'complaint_supported',
  complaint_commented: 'complaint_commented',
  rental_confirmed: 'rental_confirmed',
  rental_rejected: 'rental_rejected',
  rental_request_received: 'rental_request_received',
  rental_starting_soon: 'rental_starting_soon',
  rental_ending_soon: 'rental_ending_soon',
  user_verified: 'user_verified',
  user_banned: 'user_banned',
  user_unbanned: 'user_unbanned',
  profile_updated: 'profile_updated',
  system_maintenance: 'system_maintenance',
  system_update: 'system_update',
  security_alert: 'security_alert',
  new_feature: 'new_feature',
  promotion: 'promotion',
  reminder: 'reminder',
};

export const NOTIFICATION_PRIORITIES: Record<NotificationPriority, string> = {
  low: 'low',
  normal: 'normal',
  high: 'high',
  urgent: 'urgent',
};

export const DEVICE_TYPES: Record<DeviceType, string> = {
  web: 'web',
  android: 'android',
  ios: 'ios',
  desktop: 'desktop',
};

export const DIGEST_FREQUENCIES: Record<DigestFrequency, string> = {
  never: 'never',
  daily: 'daily',
  weekly: 'weekly',
  monthly: 'monthly',
};
