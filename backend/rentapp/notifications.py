# from django.core.mail import send_mail
# from django.template.loader import render_to_string
# from django.conf import settings
# from django.utils.html import strip_tags
# from django.utils import timezone
# from datetime import timedelta
# from .models import Notification, NotificationSettings
# import logging

# logger = logging.getLogger(__name__)

# def get_notification_icon(notification_type):
#     """
#     Возвращает иконку для типа уведомления
#     """
#     icon_map = {
#         'complaint_received': '📋',
#         'complaint_status_updated': '🔄',
#         'complaint_supported': '👍',
#         'complaint_commented': '💬',
#         'rental_confirmed': '✅',
#         'rental_rejected': '❌',
#         'rental_request_received': '📝',
#         'rental_starting_soon': '⏰',
#         'rental_ending_soon': '⏳',
#         'user_verified': '✅',
#         'user_banned': '🚫',
#         'user_unbanned': '🔓',
#         'profile_updated': '👤',
#         'system_maintenance': '🔧',
#         'system_update': '🆕',
#         'security_alert': '⚠️',
#         'new_feature': '✨',
#         'promotion': '🎉',
#         'reminder': '⏰',
#     }
#     return icon_map.get(notification_type, '🔔')

# def get_action_text(notification_type):
#     """
#     Возвращает текст для кнопки действия
#     """
#     action_text_map = {
#         'complaint_received': 'Просмотреть жалобу',
#         'rental_confirmed': 'Просмотреть аренду',
#         'user_verified': 'Перейти в профиль',
#         'promotion': 'Воспользоваться предложением',
#         'system_update': 'Подробнее об обновлении',
#     }
#     return action_text_map.get(notification_type, 'Перейти к уведомлению')

# def get_notification_specific_context(notification):
#     """
#     Возвращает специфичный контекст для разных типов уведомлений
#     """
#     context = {}
    
#     if notification.type == 'complaint_received' and notification.related_complaint:
#         complaint = notification.related_complaint
#         context.update({
#             'complaint_id': complaint.id,
#             'complaint_description': complaint.description,
#             'complainant_name': complaint.complainant.get_full_name() or complaint.complainant.username,
#             'complaint_date': complaint.created_at.strftime('%d.%m.%Y %H:%M'),
#             'property_address': getattr(complaint.property, 'address', 'Не указан') if complaint.property else None,
#             'complaint_url': f"{getattr(settings, 'FRONTEND_URL', 'https://arno.kz')}/complaint/{complaint.id}",
#             'complaints_dashboard_url': f"{getattr(settings, 'FRONTEND_URL', 'https://arno.kz')}/admin/complaints",
#         })
    
#     elif notification.type == 'rental_confirmed' and notification.related_rental:
#         rental = notification.related_rental
#         context.update({
#             'rental_id': rental.id,
#             'property_title': getattr(rental.property, 'title', 'Объект недвижимости'),
#             'rental_start_date': rental.start_date.strftime('%d.%m.%Y'),
#             'rental_end_date': rental.end_date.strftime('%d.%m.%Y'),
#             'rental_duration': f"{(rental.end_date - rental.start_date).days} дней",
#             'rental_price': rental.total_amount,
#             'landlord_name': rental.property.owner.get_full_name() or rental.property.owner.username,
#             'confirmation_date': rental.updated_at.strftime('%d.%m.%Y %H:%M'),
#             'property_address': getattr(rental.property, 'address', 'Не указан'),
#             'rental_url': f"{getattr(settings, 'FRONTEND_URL', 'https://arno.kz')}/rental/{rental.id}",
#         })
    
#     elif notification.type == 'user_verified':
#         context.update({
#             'user_initial': notification.user.username[0].upper(),
#             'user_name': notification.user.get_full_name() or notification.user.username,
#             'user_role_display': notification.user.get_role_display(),
#             'verification_date': notification.created_at.strftime('%d.%m.%Y %H:%M'),
#             'profile_url': f"{getattr(settings, 'FRONTEND_URL', 'https://arno.kz')}/profile",
#         })
    
#     elif notification.type == 'promotion':
#         # Для промо-акций берем данные из metadata
#         metadata = notification.metadata or {}
#         from datetime import datetime, timedelta
#         end_date = metadata.get('end_date')
#         if end_date:
#             end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
#             now = timezone.now()
#             diff = end_date - now
#             context.update({
#                 'promotion_title': metadata.get('title', 'Специальное предложение'),
#                 'promotion_description': metadata.get('description', 'Не упустите возможность сэкономить!'),
#                 'discount_amount': metadata.get('discount', 10),
#                 'promotion_end_date': end_date.strftime('%d.%m.%Y'),
#                 'promotion_start_date': notification.created_at.strftime('%d.%m.%Y'),
#                 'days_left': max(0, diff.days),
#                 'hours_left': max(0, diff.seconds // 3600),
#                 'minutes_left': max(0, (diff.seconds % 3600) // 60),
#                 'promo_code': metadata.get('code', ''),
#                 'terms_and_conditions': metadata.get('terms', 'Действует до окончания срока акции'),
#                 'promotion_url': f"{getattr(settings, 'FRONTEND_URL', 'https://arno.kz')}/promotions/{metadata.get('id', '')}",
#             })
    
#     elif notification.type in ['system_update', 'system_maintenance', 'new_feature']:
#         metadata = notification.metadata or {}
#         context.update({
#             'version_number': metadata.get('version', '1.0.0'),
#             'update_date': notification.created_at.strftime('%d.%m.%Y'),
#             'maintenance_window': metadata.get('maintenance_window'),
#             'downtime_expected': metadata.get('downtime'),
#             'maintenance_impact': metadata.get('impact'),
#             'changelog_url': f"{getattr(settings, 'FRONTEND_URL', 'https://arno.kz')}/changelog",
#             'new_features': metadata.get('features', []),
#             'update_timeline': metadata.get('timeline', []),
#         })
    
#     return context

# def create_notification(user, notification_type, title, message, related_complaint=None, 
#                        related_rental=None, related_house=None, priority='normal', 
#                        action_url=None, expires_in_days=None, metadata=None):
#     """
#     Создает уведомление в базе данных с расширенными параметрами
#     """
#     expires_at = None
#     if expires_in_days:
#         expires_at = timezone.now() + timedelta(days=expires_in_days)
    
#     notification = Notification.objects.create(
#         user=user,
#         type=notification_type,
#         priority=priority,
#         title=title,
#         message=message,
#         related_complaint=related_complaint,
#         related_rental=related_rental,
#         related_house=related_house,
#         action_url=action_url,
#         expires_at=expires_at,
#         metadata=metadata or {}
#     )
    
#     # Отправляем уведомления согласно настройкам пользователя
#     send_notification_to_user(notification)
    
#     return notification


# def send_notification_to_user(notification):
#     """
#     Отправляет уведомление пользователю согласно его настройкам
#     """
#     try:
#         # Получаем настройки пользователя
#         settings_obj, created = NotificationSettings.objects.get_or_create(
#             user=notification.user,
#             defaults={}
#         )
        
#         # Проверяем, нужно ли отправлять уведомление
#         if not settings_obj.should_send_notification(notification.type, notification.priority):
#             logger.info(f"Уведомление {notification.id} не отправлено из-за настроек пользователя")
#             return
        
#         # Отправляем email
#         if settings_obj.email_enabled and not notification.is_email_sent:
#             send_email_notification(notification)
#             notification.is_email_sent = True
        
#         # Отправляем push уведомление
#         if settings_obj.push_enabled and not notification.is_push_sent:
#             send_push_notification(notification)
#             notification.is_push_sent = True
        
#         # Отправляем SMS для срочных уведомлений
#         if (settings_obj.sms_enabled and 
#             notification.priority in ['urgent', 'high'] and 
#             not notification.is_sms_sent):
#             send_sms_notification(notification)
#             notification.is_sms_sent = True
        
#         notification.save()
        
#     except Exception as e:
#         logger.error(f"Ошибка при отправке уведомления {notification.id}: {e}")


# def send_email_notification(notification):
#     """
#     Отправляет email уведомление с использованием красивых HTML шаблонов
#     """
#     try:
#         subject = f'ARNO - {notification.title}'
        
#         # Определяем шаблон по типу уведомления
#         template_map = {
#             'complaint_received': 'emails/notifications/complaint_received.html',
#             'complaint_status_updated': 'emails/notifications/base.html',
#             'complaint_supported': 'emails/notifications/base.html',
#             'complaint_commented': 'emails/notifications/base.html',
#             'rental_confirmed': 'emails/notifications/rental_confirmed.html',
#             'rental_rejected': 'emails/notifications/base.html',
#             'rental_request_received': 'emails/notifications/base.html',
#             'rental_starting_soon': 'emails/notifications/base.html',
#             'rental_ending_soon': 'emails/notifications/base.html',
#             'user_verified': 'emails/notifications/user_verified.html',
#             'user_banned': 'emails/notifications/base.html',
#             'user_unbanned': 'emails/notifications/base.html',
#             'profile_updated': 'emails/notifications/base.html',
#             'system_maintenance': 'emails/notifications/system_update.html',
#             'system_update': 'emails/notifications/system_update.html',
#             'security_alert': 'emails/notifications/base.html',
#             'new_feature': 'emails/notifications/system_update.html',
#             'promotion': 'emails/notifications/promotion.html',
#             'reminder': 'emails/notifications/base.html',
#         }
        
#         template = template_map.get(notification.type, 'emails/notifications/base.html')
        
#         # Подготавливаем контекст для шаблона
#         context = {
#             'title': notification.title,
#             'message': notification.message,
#             'icon': get_notification_icon(notification.type),
#             'priority': notification.priority,
#             'priority_display': notification.get_priority_display(),
#             'action_url': notification.action_url,
#             'action_text': get_action_text(notification.type),
#             'metadata': notification.metadata,
#             'site_url': getattr(settings, 'FRONTEND_URL', 'https://arno.kz'),
#             'profile_url': f"{getattr(settings, 'FRONTEND_URL', 'https://arno.kz')}/profile",
#             'notifications_url': f"{getattr(settings, 'FRONTEND_URL', 'https://arno.kz')}/notifications",
#             'settings_url': f"{getattr(settings, 'FRONTEND_URL', 'https://arno.kz')}/profile#settings",
#             'unsubscribe_url': f"{getattr(settings, 'FRONTEND_URL', 'https://arno.kz')}/unsubscribe?token={notification.user.id}",
#         }
        
#         # Добавляем специфичные данные для разных типов уведомлений
#         context.update(get_notification_specific_context(notification))
        
#         try:
#             html_message = render_to_string(template, context)
#             plain_message = strip_tags(html_message)
#         except Exception as e:
#             logger.error(f"Ошибка рендеринга шаблона {template}: {e}")
#             plain_message = notification.message
#             html_message = None
        
#         send_mail(
#             subject=subject,
#             message=plain_message,
#             from_email=settings.DEFAULT_FROM_EMAIL,
#             recipient_list=[notification.user.email],
#             html_message=html_message,
#             fail_silently=True,
#         )
        
#         logger.info(f"Email уведомление отправлено пользователю {notification.user.username}")
        
#     except Exception as e:
#         logger.error(f"Ошибка отправки email уведомления: {e}")


# def send_push_notification(notification):
#     """
#     Отправляет push уведомление через Firebase Cloud Messaging
#     """
#     try:
#         from .models import FCMToken
        
#         # Получаем активные FCM токены пользователя
#         fcm_tokens = FCMToken.objects.filter(
#             user=notification.user,
#             is_active=True
#         )
        
#         if not fcm_tokens.exists():
#             logger.info(f"У пользователя {notification.user.username} нет активных FCM токенов")
#             return False
        
#         # Подготавливаем данные для push уведомления
#         push_data = {
#             'title': notification.title,
#             'body': notification.message,
#             'icon': get_notification_icon(notification.type),
#             'badge': '/static/icons/badge.png',
#             'data': {
#                 'type': notification.type,
#                 'priority': notification.priority,
#                 'notification_id': notification.id,
#                 'action_url': notification.action_url or '',
#                 'timestamp': notification.created_at.isoformat(),
#             }
#         }
        
#         # Отправляем push уведомления через FCM
#         results = []
#         for fcm_token in fcm_tokens:
#             try:
#                 result = send_fcm_notification(
#                     token=fcm_token.token,
#                     title=push_data['title'],
#                     body=push_data['body'],
#                     data=push_data['data'],
#                     icon=push_data['icon']
#                 )
#                 results.append(result)
                
#                 # Обновляем время последнего использования токена
#                 fcm_token.save()
                
#             except Exception as e:
#                 logger.error(f"Ошибка отправки push уведомления на токен {fcm_token.token[:20]}...: {e}")
#                 # Если токен недействителен, деактивируем его
#                 if 'invalid' in str(e).lower() or 'not-registered' in str(e).lower():
#                     fcm_token.is_active = False
#                     fcm_token.save()
        
#         # Обновляем статус отправки в уведомлении
#         notification.is_push_sent = True
#         notification.save()
        
#         logger.info(f"Push уведомление отправлено пользователю {notification.user.username} на {len(results)} устройств")
#         return True
        
#     except Exception as e:
#         logger.error(f"Ошибка отправки push уведомления: {e}")
#         return False


# def send_fcm_notification(token, title, body, data=None, icon=None):
#     """
#     Отправляет push уведомление через Firebase Cloud Messaging v1 API
#     """
#     try:
#         import json
#         import requests
#         from django.conf import settings
#         from datetime import datetime, timedelta
        
#         # Получаем настройки Firebase из переменных окружения
#         project_id = getattr(settings, 'FCM_PROJECT_ID', None)
#         private_key = getattr(settings, 'FCM_PRIVATE_KEY', None)
#         client_email = getattr(settings, 'FCM_CLIENT_EMAIL', None)
        
#         # Исправляем формат private key (заменяем \n на реальные переносы строк)
#         if private_key:
#             private_key = private_key.replace('\\n', '\n')
        
#         if not all([project_id, private_key, client_email]):
#             logger.error("Firebase настройки не найдены в settings.py")
#             return False
        
#         # Получаем access token
#         access_token = get_firebase_access_token(private_key, client_email)
#         if not access_token:
#             logger.error("Не удалось получить access token для Firebase")
#             return False
        
#         # URL для FCM v1 API
#         fcm_url = f'https://fcm.googleapis.com/v1/projects/{project_id}/messages:send'
        
#         # Заголовки запроса
#         headers = {
#             'Authorization': f'Bearer {access_token}',
#             'Content-Type': 'application/json'
#         }
        
#         # Данные для отправки в формате v1 API
#         message = {
#             'message': {
#                 'token': token,
#                 'notification': {
#                     'title': title,
#                     'body': body
#                 },
#                 'data': {str(k): str(v) for k, v in (data or {}).items()},
#                 'android': {
#                     'notification': {
#                         'icon': icon or '/static/icons/notification-icon.png',
#                         'sound': 'default'
#                     }
#                 },
#             'webpush': {
#                 'notification': {
#                     'icon': icon or '/static/icons/notification-icon.png',
#                     'badge': '/static/icons/badge.png',
#                     'actions': [
#                         {
#                             'action': 'open',
#                             'title': 'Открыть'
#                         },
#                         {
#                             'action': 'dismiss',
#                             'title': 'Закрыть'
#                         }
#                     ]
#                 }
#             }
#             }
#         }
        
#         # Отправляем запрос
#         response = requests.post(fcm_url, json=message, headers=headers, timeout=30)
        
#         if response.status_code == 200:
#             logger.info(f"FCM уведомление успешно отправлено через v1 API")
#             return True
#         else:
#             logger.error(f"FCM HTTP ошибка: {response.status_code} - {response.text}")
#             return False
            
#     except Exception as e:
#         logger.error(f"Ошибка отправки FCM уведомления: {e}")
#         return False


# def get_firebase_access_token(private_key, client_email):
#     """
#     Получает access token для Firebase Admin SDK
#     """
#     try:
#         import jwt
#         import requests
#         from datetime import datetime, timedelta
        
#         # Создаем JWT токен
#         now = datetime.utcnow()
#         payload = {
#             'iss': client_email,
#             'scope': 'https://www.googleapis.com/auth/firebase.messaging',
#             'aud': 'https://oauth2.googleapis.com/token',
#             'iat': now,
#             'exp': now + timedelta(hours=1)
#         }
        
#         # Подписываем JWT
#         token = jwt.encode(payload, private_key, algorithm='RS256')
        
#         # Обмениваем JWT на access token
#         response = requests.post(
#             'https://oauth2.googleapis.com/token',
#             data={
#                 'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
#                 'assertion': token
#             },
#             headers={'Content-Type': 'application/x-www-form-urlencoded'}
#         )
        
#         if response.status_code == 200:
#             return response.json().get('access_token')
#         else:
#             logger.error(f"Ошибка получения access token: {response.status_code} - {response.text}")
#             return None
            
#     except Exception as e:
#         logger.error(f"Ошибка создания JWT токена: {e}")
#         return None


# def send_sms_notification(notification):
#     """
#     Отправляет SMS уведомление (заглушка для будущей интеграции с SMS провайдером)
#     """
#     # TODO: Интеграция с SMS провайдером
#     logger.info(f"SMS уведомление отправлено пользователю {notification.user.username}")

# def send_complaint_received_notification(complaint):
#     """
#     Отправляет уведомление о получении новой жалобы
#     """
#     subject = f'Новая жалоба #{complaint.id} получена'
#     message = f'Ваша жалоба #{complaint.id} получена и будет рассмотрена в ближайшее время.'
    
#     try:
#         html_message = render_to_string('email/complaint_received.html', {
#             'user': complaint.complainant,
#             'complaint': complaint
#         })
#         plain_message = strip_tags(html_message)
#     except:
#         plain_message = message
#         html_message = None
    
#     # Отправляем email
#     send_mail(
#         subject=subject,
#         message=plain_message,
#         from_email=settings.DEFAULT_FROM_EMAIL,
#         recipient_list=[complaint.complainant.email],
#         html_message=html_message,
#         fail_silently=True,
#     )

#     # Создаем уведомление в базе данных
#     create_notification(
#         user=complaint.complainant,
#         notification_type='complaint_received',
#         title=subject,
#         message=message,
#         related_complaint=complaint
#     )

# def send_complaint_status_update_notification(complaint):
#     """
#     Отправляет уведомление об изменении статуса жалобы
#     """
#     subject = f'Статус жалобы #{complaint.id} обновлен'
#     message = f'Статус вашей жалобы #{complaint.id} изменен на "{complaint.get_status_display()}".'
    
#     try:
#         html_message = render_to_string('email/complaint_status_updated.html', {
#             'user': complaint.complainant,
#             'complaint': complaint
#         })
#         plain_message = strip_tags(html_message)
#     except:
#         plain_message = message
#         html_message = None
    
#     # Отправляем email
#     send_mail(
#         subject=subject,
#         message=plain_message,
#         from_email=settings.DEFAULT_FROM_EMAIL,
#         recipient_list=[complaint.complainant.email],
#         html_message=html_message,
#         fail_silently=True,
#     )

#     # Создаем уведомление в базе данных
#     create_notification(
#         user=complaint.complainant,
#         notification_type='complaint_status_updated',
#         title=subject,
#         message=message,
#         related_complaint=complaint
#     )

# def send_complaint_supported_notification(complaint, supporter):
#     """
#     Отправляет уведомление о поддержке жалобы
#     """
#     subject = f'Жалоба #{complaint.id} получила поддержку'
#     message = f'Пользователь {supporter.username} поддержал вашу жалобу #{complaint.id}.'
    
#     # Создаем уведомление в базе данных
#     create_notification(
#         user=complaint.complainant,
#         notification_type='complaint_supported',
#         title=subject,
#         message=message,
#         related_complaint=complaint
#     )

# def send_complaint_comment_notification(complaint, comment):
#     """
#     Отправляет уведомление о новом комментарии к жалобе
#     """
#     subject = f'Новый комментарий к жалобе #{complaint.id}'
#     message = f'Пользователь {comment.user.username} оставил комментарий к вашей жалобе #{complaint.id}.'
    
#     # Создаем уведомление в базе данных
#     create_notification(
#         user=complaint.complainant,
#         notification_type='complaint_commented',
#         title=subject,
#         message=message,
#         related_complaint=complaint
#     )

# def send_rental_confirmation_notification(rental):
#     """
#     Отправляет уведомление о подтверждении аренды
#     """
#     subject = f'Аренда подтверждена - {rental.house.address}'
#     message = f'Ваша заявка на аренду {rental.house.address} была подтверждена владельцем.'
    
#     # Отправляем email
#     send_mail(
#         subject=subject,
#         message=message,
#         from_email=settings.DEFAULT_FROM_EMAIL,
#         recipient_list=[rental.tenant.email],
#         fail_silently=False,
#     )

#     # Создаем уведомление в базе данных
#     create_notification(
#         user=rental.tenant,
#         notification_type='rental_confirmed',
#         title=subject,
#         message=message,
#         related_complaint=None
#     )

# def send_rental_rejection_notification(rental):
#     """
#     Отправляет уведомление об отклонении аренды
#     """
#     create_notification(
#         user=rental.tenant,
#         notification_type='rental_rejected',
#         title=f'Аренда отклонена - {rental.house.address}',
#         message=f'К сожалению, ваша заявка на аренду {rental.house.address} была отклонена владельцем.',
#         related_rental=rental,
#         action_url=f'/rentals/{rental.id}',
#         priority='normal'
#     )


# # ==================== НОВЫЕ ФУНКЦИИ УВЕДОМЛЕНИЙ ====================

# def send_rental_request_notification(rental):
#     """
#     Уведомление арендодателю о новой заявке на аренду
#     """
#     create_notification(
#         user=rental.house.owner,
#         notification_type='rental_request_received',
#         title=f'Новая заявка на аренду - {rental.house.address}',
#         message=f'Пользователь {rental.tenant.username} подал заявку на аренду вашего дома {rental.house.address}.',
#         related_rental=rental,
#         action_url=f'/admin/rentals/{rental.id}',
#         priority='normal'
#     )


# def send_rental_reminder_notification(rental, reminder_type):
#     """
#     Напоминания об аренде (начало/конец)
#     """
#     if reminder_type == 'starting_soon':
#         title = f'Аренда скоро начнется - {rental.house.address}'
#         message = f'Ваша аренда {rental.house.address} начнется через 3 дня ({rental.start_date}).'
#         notification_type = 'rental_starting_soon'
#     else:  # ending_soon
#         title = f'Аренда скоро закончится - {rental.house.address}'
#         message = f'Ваша аренда {rental.house.address} закончится через 3 дня ({rental.end_date}).'
#         notification_type = 'rental_ending_soon'
    
#     create_notification(
#         user=rental.tenant,
#         notification_type=notification_type,
#         title=title,
#         message=message,
#         related_rental=rental,
#         action_url=f'/rentals/{rental.id}',
#         priority='normal'
#     )


# def send_user_verification_notification(user, approved=True):
#     """
#     Уведомление о верификации аккаунта
#     """
#     if approved:
#         title = 'Аккаунт верифицирован'
#         message = 'Поздравляем! Ваш аккаунт успешно верифицирован. Теперь вы можете пользоваться всеми функциями платформы.'
#         notification_type = 'user_verified'
#         priority = 'high'
#     else:
#         title = 'Верификация отклонена'
#         message = 'Ваша верификация была отклонена. Пожалуйста, проверьте документы и подайте заявку повторно.'
#         notification_type = 'user_banned'
#         priority = 'normal'
    
#     create_notification(
#         user=user,
#         notification_type=notification_type,
#         title=title,
#         message=message,
#         action_url='/profile/verification',
#         priority=priority
#     )


# def send_user_ban_notification(user, reason, banned=True):
#     """
#     Уведомление о блокировке/разблокировке аккаунта
#     """
#     if banned:
#         title = 'Аккаунт заблокирован'
#         message = f'Ваш аккаунт был заблокирован. Причина: {reason}'
#         notification_type = 'user_banned'
#         priority = 'urgent'
#     else:
#         title = 'Аккаунт разблокирован'
#         message = 'Ваш аккаунт был разблокирован. Добро пожаловать обратно!'
#         notification_type = 'user_unbanned'
#         priority = 'high'
    
#     create_notification(
#         user=user,
#         notification_type=notification_type,
#         title=title,
#         message=message,
#         action_url='/profile',
#         priority=priority,
#         metadata={'reason': reason} if banned else {}
#     )


# def send_system_maintenance_notification(users, maintenance_start, maintenance_end, description=""):
#     """
#     Системное уведомление о техническом обслуживании
#     """
#     title = 'Запланированное техническое обслуживание'
#     message = f'Планируется техническое обслуживание с {maintenance_start} до {maintenance_end}. {description}'
    
#     for user in users:
#         create_notification(
#             user=user,
#             notification_type='system_maintenance',
#             title=title,
#             message=message,
#             priority='high',
#             action_url='/status',
#             metadata={
#                 'maintenance_start': maintenance_start.isoformat(),
#                 'maintenance_end': maintenance_end.isoformat(),
#                 'description': description
#             }
#         )


# def send_new_feature_notification(users, feature_name, description, feature_url):
#     """
#     Уведомление о новой функции
#     """
#     title = f'Новая функция: {feature_name}'
#     message = f'Мы добавили новую функцию "{feature_name}". {description}'
    
#     for user in users:
#         create_notification(
#             user=user,
#             notification_type='new_feature',
#             title=title,
#             message=message,
#             priority='low',
#             action_url=feature_url,
#             expires_in_days=30  # Уведомление истекает через 30 дней
#         )


# def send_promotion_notification(users, promotion_title, description, promo_url):
#     """
#     Уведомление об акции/промо
#     """
#     title = f'🎉 {promotion_title}'
#     message = description
    
#     for user in users:
#         create_notification(
#             user=user,
#             notification_type='promotion',
#             title=title,
#             message=message,
#             priority='low',
#             action_url=promo_url,
#             expires_in_days=7  # Промо уведомления истекают через неделю
#         )


# def send_security_alert_notification(user, alert_type, description, action_url=None):
#     """
#     Уведомление о безопасности
#     """
#     title_map = {
#         'login_from_new_device': 'Вход с нового устройства',
#         'suspicious_activity': 'Подозрительная активность',
#         'password_changed': 'Пароль изменен',
#         'email_changed': 'Email изменен',
#     }
    
#     title = title_map.get(alert_type, 'Предупреждение безопасности')
    
#     create_notification(
#         user=user,
#         notification_type='security_alert',
#         title=title,
#         message=description,
#         priority='urgent',
#         action_url=action_url or '/security',
#         metadata={'alert_type': alert_type}
#     ) 