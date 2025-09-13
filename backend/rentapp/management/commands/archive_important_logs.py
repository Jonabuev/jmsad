"""
Команда для архивирования важных логов в файлы
"""
import json
import os
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from rentapp.models import ActivityLog
from django.conf import settings

class Command(BaseCommand):
    help = 'Архивирует важные логи в JSON файлы'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Архивировать логи старше указанного количества дней'
        )
        parser.add_argument(
            '--archive-dir',
            type=str,
            default='logs/archive',
            help='Директория для архивирования'
        )

    def handle(self, *args, **options):
        days = options['days']
        archive_dir = options['archive_dir']
        
        # Создаем директорию для архива
        full_archive_dir = os.path.join(settings.BASE_DIR, archive_dir)
        os.makedirs(full_archive_dir, exist_ok=True)

        # Важные типы логов для архивирования
        important_actions = [
            'user_ban', 'user_unban', 'user_make_admin', 'user_remove_admin',
            'complaint_moderate', 'system_error'
        ]

        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Получаем важные логи для архивирования
        important_logs = ActivityLog.objects.filter(
            created_at__lt=cutoff_date,
            action_type__in=important_actions
        ).order_by('created_at')

        if not important_logs.exists():
            self.stdout.write("Нет важных логов для архивирования")
            return

        # Создаем архивный файл
        archive_filename = f"important_logs_{timezone.now().strftime('%Y%m%d_%H%M%S')}.json"
        archive_path = os.path.join(full_archive_dir, archive_filename)

        logs_data = []
        for log in important_logs:
            logs_data.append({
                'id': log.id,
                'user_username': log.user_username,
                'user_email': log.user_email,
                'action_type': log.action_type,
                'action_description': log.action_description,
                'target_object_type': log.target_object_type,
                'target_object_id': log.target_object_id,
                'ip_address': log.ip_address,
                'metadata': log.metadata,
                'created_at': log.created_at.isoformat(),
            })

        # Сохраняем в файл
        with open(archive_path, 'w', encoding='utf-8') as f:
            json.dump(logs_data, f, ensure_ascii=False, indent=2)

        self.stdout.write(
            self.style.SUCCESS(f"Архивировано {len(logs_data)} важных логов в {archive_path}")
        )
