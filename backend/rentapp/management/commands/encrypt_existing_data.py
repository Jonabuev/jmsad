"""
Management command для шифрования существующих данных.

ИСПОЛЬЗОВАНИЕ:
    python manage.py encrypt_existing_data --dry-run  # Тестовый режим
    python manage.py encrypt_existing_data            # Реальное шифрование

ВАЖНО:
    - Создайте backup БД перед запуском!
    - Установите FERNET_KEY в .env
    - Сначала запустите с --dry-run для проверки
"""

from django.core.management.base import BaseCommand
from rentapp.models import CustomUser
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Шифрует существующие незашифрованные данные в БД (identifier, phone_number, documents)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Тестовый режим (не сохраняет изменения)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        self.stdout.write('=' * 70)
        self.stdout.write(self.style.WARNING('  DATABASE ENCRYPTION UTILITY'))
        self.stdout.write('=' * 70)
        self.stdout.write('')
        
        # Проверка FERNET_KEY
        from django.conf import settings
        if not hasattr(settings, 'FERNET_KEYS') or not settings.FERNET_KEYS[0]:
            self.stdout.write(self.style.ERROR('[ERROR] FERNET_KEY not set in settings!'))
            self.stdout.write('Generate key: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"')
            return
        
        self.stdout.write(self.style.SUCCESS('[OK] FERNET_KEY is set'))
        self.stdout.write('')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('[DRY-RUN MODE] No changes will be saved'))
        else:
            self.stdout.write(self.style.ERROR('[LIVE MODE] Changes will be saved!'))
            self.stdout.write(self.style.WARNING('Make sure you have a database backup!'))
            self.stdout.write('')
            confirm = input('Continue? Type "yes" to proceed: ')
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.ERROR('Cancelled by user'))
                return
        
        self.stdout.write('')
        self.stdout.write('-' * 70)
        
        # Получаем всех пользователей
        users = CustomUser.objects.all()
        total = users.count()
        encrypted_count = 0
        skipped_count = 0
        
        self.stdout.write(f'[INFO] Total users in database: {total}')
        self.stdout.write('')
        
        for idx, user in enumerate(users, 1):
            self.stdout.write(f'[{idx}/{total}] Processing user: {user.username} (ID: {user.id})')
            
            changed_fields = []
            
            # Проверяем identifier
            if user.identifier:
                # Проверяем что это не зашифрованная строка (начинается с gAAAAA)
                if not str(user.identifier).startswith('gAAAAA'):
                    self.stdout.write(f'  [ENCRYPT] identifier: {user.identifier[:4]}***')
                    changed_fields.append('identifier')
                else:
                    self.stdout.write(f'  [SKIP] identifier: already encrypted')
                    skipped_count += 1
            
            # Проверяем phone_number
            if user.phone_number:
                if not str(user.phone_number).startswith('gAAAAA'):
                    self.stdout.write(f'  [ENCRYPT] phone_number: {user.phone_number[:3]}***')
                    changed_fields.append('phone_number')
                else:
                    self.stdout.write(f'  [SKIP] phone_number: already encrypted')
            
            # Проверяем documents
            if user.documents:
                # Если это dict - значит не зашифрован
                if isinstance(user.documents, dict):
                    self.stdout.write(f'  [ENCRYPT] documents: {len(user.documents)} keys')
                    changed_fields.append('documents')
                else:
                    self.stdout.write(f'  [SKIP] documents: already encrypted')
            
            # Сохраняем изменения
            if changed_fields:
                if not dry_run:
                    try:
                        # Пересохраняем поля - django-fernet-fields зашифрует автоматически
                        user.save(update_fields=changed_fields)
                        self.stdout.write(self.style.SUCCESS(f'  [SAVED] Encrypted: {", ".join(changed_fields)}'))
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'  [ERROR] Failed to save: {str(e)}'))
                else:
                    self.stdout.write(f'  [DRY-RUN] Would encrypt: {", ".join(changed_fields)}')
                
                encrypted_count += 1
            else:
                self.stdout.write('  [SKIP] No changes needed')
            
            self.stdout.write('')
        
        # Итоги
        self.stdout.write('-' * 70)
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('SUMMARY:'))
        self.stdout.write(f'  Total users: {total}')
        self.stdout.write(f'  Encrypted: {encrypted_count}')
        self.stdout.write(f'  Skipped (already encrypted): {skipped_count}')
        
        if dry_run:
            self.stdout.write('')
            self.stdout.write(self.style.WARNING('[DRY-RUN] No changes were made'))
            self.stdout.write('Run without --dry-run to apply changes')
        else:
            self.stdout.write('')
            self.stdout.write(self.style.SUCCESS('[SUCCESS] Encryption complete!'))
        
        self.stdout.write('')
        self.stdout.write('=' * 70)

