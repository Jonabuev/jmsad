#!/bin/bash
# Скрипт для автоматической очистки логов
# Добавить в crontab: 0 2 * * 0 /path/to/cleanup_logs_cron.sh

cd /path/to/your/project/backend
source venv/bin/activate

# Очистка старых логов (еженедельно)
python manage.py cleanup_old_logs --days 90 --keep-count 10000

# Архивирование важных логов (ежемесячно)
python manage.py archive_important_logs --days 30

echo "$(date): Логи очищены и архивированы" >> /var/log/activity_logs_cleanup.log
