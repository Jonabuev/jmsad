"""
Команда для очистки старых логов активности
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from rentapp.models import ActivityLog
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Очищает старые логи активности'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=90,
            help='Удалить логи старше указанного количества дней (по умолчанию: 90)'
        )
        parser.add_argument(
            '--keep-count',
            type=int,
            default=10000,
            help='Оставить только указанное количество последних логов (по умолчанию: 10000)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Показать что будет удалено без фактического удаления'
        )

    def handle(self, *args, **options):
        days = options['days']
        keep_count = options['keep_count']
        dry_run = options['dry_run']

        self.stdout.write(f"Начинаем очистку логов активности...")

        # Стратегия 1: Удаление по возрасту
        cutoff_date = timezone.now() - timedelta(days=days)
        old_logs = ActivityLog.objects.filter(created_at__lt=cutoff_date)
        old_count = old_logs.count()

        if dry_run:
            self.stdout.write(f"Будет удалено {old_count} логов старше {days} дней")
        else:
            if old_count > 0:
                old_logs.delete()
                self.stdout.write(
                    self.style.SUCCESS(f"Удалено {old_count} логов старше {days} дней")
                )

        # Стратегия 2: Ограничение по количеству записей
        total_logs = ActivityLog.objects.count()
        if total_logs > keep_count:
            logs_to_delete = total_logs - keep_count
            oldest_logs = ActivityLog.objects.order_by('created_at')[:logs_to_delete]
            
            if dry_run:
                self.stdout.write(f"Будет удалено {logs_to_delete} самых старых логов")
            else:
                oldest_log_ids = list(oldest_logs.values_list('id', flat=True))
                ActivityLog.objects.filter(id__in=oldest_log_ids).delete()
                self.stdout.write(
                    self.style.SUCCESS(f"Удалено {logs_to_delete} самых старых логов")
                )

        remaining_count = ActivityLog.objects.count()
        self.stdout.write(
            self.style.SUCCESS(f"Осталось {remaining_count} логов в базе данных")
        )
