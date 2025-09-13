from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rentapp.notifications import create_notification
from rentapp.models import Notification

User = get_user_model()

class Command(BaseCommand):
    help = 'Тестирует отправку email уведомлений разных типов'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user-id',
            type=int,
            help='ID пользователя для отправки тестовых уведомлений',
        )
        parser.add_argument(
            '--type',
            type=str,
            choices=[
                'complaint_received',
                'rental_confirmed', 
                'user_verified',
                'system_update',
                'promotion',
                'all'
            ],
            default='all',
            help='Тип уведомления для тестирования'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Только создать уведомления без отправки email'
        )

    def handle(self, *args, **options):
        user_id = options['user_id']
        notification_type = options['type']
        dry_run = options['dry_run']

        if not user_id:
            # Найдем первого пользователя для тестирования
            user = User.objects.first()
            if not user:
                self.stdout.write(
                    self.style.ERROR('Нет пользователей в системе для тестирования')
                )
                return
        else:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Пользователь с ID {user_id} не найден')
                )
                return

        self.stdout.write(f'Тестирование уведомлений для пользователя: {user.username}')
        self.stdout.write(f'Email: {user.email}')
        self.stdout.write(f'Dry run: {dry_run}')
        self.stdout.write('')

        # Тестовые данные для разных типов уведомлений
        test_notifications = {
            'complaint_received': {
                'title': 'Получена новая жалоба #123',
                'message': 'Вам поступила новая жалоба, которая требует вашего внимания. Пожалуйста, рассмотрите её в кратчайшие сроки.',
                'priority': 'high',
                'metadata': {
                    'complaint_id': 123,
                    'complaint_type': 'Нарушение условий аренды',
                    'complainant_name': 'Иван Петров',
                    'property_address': 'ул. Абая, 150, Алматы'
                }
            },
            'rental_confirmed': {
                'title': 'Аренда подтверждена!',
                'message': 'Поздравляем! Ваша заявка на аренду была успешно подтверждена. Подробности в уведомлении.',
                'priority': 'normal',
                'metadata': {
                    'rental_id': 456,
                    'property_title': '2-комнатная квартира в центре',
                    'rental_start_date': '2024-01-15',
                    'rental_end_date': '2024-07-15',
                    'rental_price': 150000,
                    'landlord_name': 'Анна Сидорова'
                }
            },
            'user_verified': {
                'title': 'Аккаунт верифицирован',
                'message': 'Отлично! Ваш аккаунт прошел верификацию и теперь вы можете пользоваться всеми возможностями платформы ARNO.',
                'priority': 'normal',
                'metadata': {}
            },
            'system_update': {
                'title': 'Обновление системы ARNO v2.1.0',
                'message': 'Мы выпустили новое обновление с улучшениями и новыми функциями. Подробности в уведомлении.',
                'priority': 'normal',
                'metadata': {
                    'version': '2.1.0',
                    'features': [
                        {
                            'name': 'Улучшенный поиск',
                            'description': 'Новые фильтры и алгоритмы поиска',
                            'icon': '🔍'
                        },
                        {
                            'name': 'Мобильное приложение',
                            'description': 'Приложение для iOS и Android',
                            'icon': '📱'
                        }
                    ],
                    'timeline': [
                        'Обновление начнется в 02:00 по времени Алматы',
                        'Ожидаемое время простоя: 30 минут',
                        'Все функции будут доступны после обновления'
                    ]
                }
            },
            'promotion': {
                'title': '🎉 Скидка 20% на первый месяц аренды!',
                'message': 'Специальное предложение для новых пользователей! Получите скидку 20% на первый месяц аренды при подаче заявки до конца месяца.',
                'priority': 'normal',
                'metadata': {
                    'title': 'Новогодняя акция',
                    'description': 'Скидка для новых пользователей',
                    'discount': 20,
                    'end_date': (timezone.now() + timedelta(days=7)).isoformat(),
                    'code': 'NEWYEAR2024',
                    'terms': 'Действует до 31 января 2024 года для новых пользователей'
                }
            }
        }

        if notification_type == 'all':
            types_to_test = list(test_notifications.keys())
        else:
            types_to_test = [notification_type]

        success_count = 0
        error_count = 0

        for notif_type in types_to_test:
            if notif_type not in test_notifications:
                continue

            self.stdout.write(f'Создание уведомления типа: {notif_type}')
            
            try:
                notification_data = test_notifications[notif_type]
                
                if dry_run:
                    self.stdout.write(
                        self.style.WARNING(f'  [DRY RUN] Создано уведомление: {notification_data["title"]}')
                    )
                    success_count += 1
                else:
                    notification = create_notification(
                        user=user,
                        notification_type=notif_type,
                        title=notification_data['title'],
                        message=notification_data['message'],
                        priority=notification_data['priority'],
                        action_url=f'https://arno.kz/test/{notif_type}',
                        metadata=notification_data['metadata']
                    )
                    
                    self.stdout.write(
                        self.style.SUCCESS(f'  ✓ Создано уведомление ID: {notification.id}')
                    )
                    success_count += 1

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  ✗ Ошибка создания уведомления {notif_type}: {e}')
                )
                error_count += 1

        self.stdout.write('')
        self.stdout.write(f'Результаты тестирования:')
        self.stdout.write(f'  Успешно: {success_count}')
        self.stdout.write(f'  Ошибок: {error_count}')
        
        if not dry_run:
            total_notifications = Notification.objects.filter(user=user).count()
            self.stdout.write(f'  Всего уведомлений у пользователя: {total_notifications}')
            
            # Проверяем настройки уведомлений
            try:
                from rentapp.models import NotificationSettings
                settings = NotificationSettings.objects.get(user=user)
                self.stdout.write(f'  Email уведомления включены: {settings.email_enabled}')
                self.stdout.write(f'  Push уведомления включены: {settings.push_enabled}')
                self.stdout.write(f'  SMS уведомления включены: {settings.sms_enabled}')
            except NotificationSettings.DoesNotExist:
                self.stdout.write('  Настройки уведомлений не найдены (будут созданы автоматически)')

        self.stdout.write('')
        if not dry_run:
            self.stdout.write('Проверьте почтовый ящик пользователя для получения email уведомлений.')
        else:
            self.stdout.write('Для реальной отправки запустите команду без флага --dry-run')
