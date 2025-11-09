"""
Celery задачи для управления логами
"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from rentapp.models import ActivityLog
from rentapp.management.commands.cleanup_old_logs import Command as CleanupCommand
from rentapp.management.commands.archive_important_logs import Command as ArchiveCommand
import logging

logger = logging.getLogger(__name__)

@shared_task
def cleanup_old_activity_logs():
    """
    Периодическая очистка старых логов активности
    Выполняется еженедельно
    """
    try:
        # Очищаем логи старше 90 дней
        cleanup_cmd = CleanupCommand()
        cleanup_cmd.handle(days=90, keep_count=10000)
        
        logger.info("Автоматическая очистка логов выполнена успешно")
        return "Логи очищены успешно"
    except Exception as e:
        logger.error(f"Ошибка при очистке логов: {e}")
        return f"Ошибка: {e}"

@shared_task
def archive_important_logs():
    """
    Периодическое архивирование важных логов
    Выполняется ежемесячно
    """
    try:
        # Архивируем важные логи старше 30 дней
        archive_cmd = ArchiveCommand()
        archive_cmd.handle(days=30)
        
        logger.info("Архивирование важных логов выполнено успешно")
        return "Важные логи архивированы успешно"
    except Exception as e:
        logger.error(f"Ошибка при архивировании логов: {e}")
        return f"Ошибка: {e}"

@shared_task
def get_log_stats():
    """
    Получение статистики по логам для мониторинга
    """
    try:
        total_logs = ActivityLog.objects.count()
        logs_today = ActivityLog.objects.filter(
            created_at__date=timezone.now().date()
        ).count()
        
        logs_this_week = ActivityLog.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=7)
        ).count()
        
        stats = {
            'total_logs': total_logs,
            'logs_today': logs_today,
            'logs_this_week': logs_this_week,
            'timestamp': timezone.now().isoformat()
        }
        
        logger.info(f"Статистика логов: {stats}")
        return stats
    except Exception as e:
        logger.error(f"Ошибка при получении статистики логов: {e}")
        return f"Ошибка: {e}"
