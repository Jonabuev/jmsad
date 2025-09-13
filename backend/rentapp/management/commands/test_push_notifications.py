from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import models
from rentapp.models import FCMToken
from rentapp.notifications import send_push_notification, create_notification
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Тестирует отправку push уведомлений'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user-id',
            type=int,
            help='ID пользователя для отправки тестового уведомления'
        )
        parser.add_argument(
            '--all-users',
            action='store_true',
            help='Отправить тестовое уведомление всем пользователям с FCM токенами'
        )
        parser.add_argument(
            '--token',
            type=str,
            help='Конкретный FCM токен для тестирования'
        )

    def handle(self, *args, **options):
        user_id = options.get('user_id')
        all_users = options.get('all_users')
        token = options.get('token')

        if token:
            self.test_specific_token(token)
        elif user_id:
            self.test_user_notification(user_id)
        elif all_users:
            self.test_all_users()
        else:
            self.show_help()

    def test_specific_token(self, token):
        """Тестирует отправку на конкретный токен"""
        self.stdout.write(f'Тестирование токена: {token[:20]}...')
        
        try:
            from rentapp.notifications import send_fcm_notification
            
            result = send_fcm_notification(
                token=token,
                title='Тестовое уведомление ARNO',
                body='Это тестовое push уведомление от системы ARNO',
                data={
                    'type': 'test',
                    'notification_id': 999,
                    'action_url': '/notifications',
                    'timestamp': '2024-01-01T00:00:00Z'
                }
            )
            
            if result:
                self.stdout.write(
                    self.style.SUCCESS('✅ Push уведомление успешно отправлено!')
                )
            else:
                self.stdout.write(
                    self.style.ERROR('❌ Ошибка отправки push уведомления')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Исключение при отправке: {e}')
            )

    def test_user_notification(self, user_id):
        """Тестирует отправку уведомления конкретному пользователю"""
        try:
            user = User.objects.get(id=user_id)
            fcm_tokens = FCMToken.objects.filter(user=user, is_active=True)
            
            if not fcm_tokens.exists():
                self.stdout.write(
                    self.style.WARNING(
                        f'⚠️ У пользователя {user.username} нет активных FCM токенов'
                    )
                )
                return
            
            # Создаем тестовое уведомление
            notification = create_notification(
                user=user,
                title='Тестовое уведомление ARNO',
                message='Это тестовое push уведомление от системы ARNO. Проверьте, что оно пришло на ваше устройство.',
                type='test',
                priority='normal'
            )
            
            # Отправляем push уведомление
            result = send_push_notification(notification)
            
            if result:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Push уведомление отправлено пользователю {user.username} '
                        f'на {fcm_tokens.count()} устройств'
                    )
                )
            else:
                self.stdout.write(
                    self.style.ERROR(
                        f'❌ Ошибка отправки push уведомления пользователю {user.username}'
                    )
                )
                
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ Пользователь с ID {user_id} не найден')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Исключение: {e}')
            )

    def test_all_users(self):
        """Тестирует отправку уведомления всем пользователям с FCM токенами"""
        users_with_tokens = User.objects.filter(
            fcm_tokens__is_active=True
        ).distinct()
        
        if not users_with_tokens.exists():
            self.stdout.write(
                self.style.WARNING('⚠️ Нет пользователей с активными FCM токенами')
            )
            return
        
        success_count = 0
        error_count = 0
        
        for user in users_with_tokens:
            try:
                # Создаем тестовое уведомление
                notification = create_notification(
                    user=user,
                    title='Массовое тестовое уведомление ARNO',
                    message='Это массовое тестовое push уведомление от системы ARNO.',
                    type='test',
                    priority='normal'
                )
                
                # Отправляем push уведомление
                result = send_push_notification(notification)
                
                if result:
                    success_count += 1
                    self.stdout.write(
                        f'✅ {user.username} - отправлено'
                    )
                else:
                    error_count += 1
                    self.stdout.write(
                        f'❌ {user.username} - ошибка'
                    )
                    
            except Exception as e:
                error_count += 1
                self.stdout.write(
                    f'❌ {user.username} - исключение: {e}'
                )
        
        self.stdout.write('\n' + '='*50)
        self.stdout.write(f'Всего пользователей: {users_with_tokens.count()}')
        self.stdout.write(
            self.style.SUCCESS(f'Успешно отправлено: {success_count}')
        )
        self.stdout.write(
            self.style.ERROR(f'Ошибок: {error_count}')
        )

    def show_help(self):
        """Показывает справку по использованию команды"""
        self.stdout.write('Использование команды test_push_notifications:')
        self.stdout.write('')
        self.stdout.write('1. Тест конкретного пользователя:')
        self.stdout.write('   python manage.py test_push_notifications --user-id 1')
        self.stdout.write('')
        self.stdout.write('2. Тест всех пользователей с FCM токенами:')
        self.stdout.write('   python manage.py test_push_notifications --all-users')
        self.stdout.write('')
        self.stdout.write('3. Тест конкретного FCM токена:')
        self.stdout.write('   python manage.py test_push_notifications --token "your-fcm-token"')
        self.stdout.write('')
        self.stdout.write('4. Показать статистику FCM токенов:')
        self.stdout.write('   python manage.py test_push_notifications --stats')
        
        # Показываем статистику FCM токенов
        total_tokens = FCMToken.objects.count()
        active_tokens = FCMToken.objects.filter(is_active=True).count()
        users_with_tokens = User.objects.filter(fcm_tokens__is_active=True).distinct().count()
        
        self.stdout.write('\n' + '='*50)
        self.stdout.write('Статистика FCM токенов:')
        self.stdout.write(f'Всего токенов: {total_tokens}')
        self.stdout.write(f'Активных токенов: {active_tokens}')
        self.stdout.write(f'Пользователей с токенами: {users_with_tokens}')
        
        if active_tokens > 0:
            self.stdout.write('\nАктивные токены по типам устройств:')
            device_stats = FCMToken.objects.filter(is_active=True).values('device_type').annotate(
                count=models.Count('id')
            )
            for stat in device_stats:
                self.stdout.write(f'  {stat["device_type"]}: {stat["count"]}')
