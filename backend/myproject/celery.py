from celery import Celery
from celery.schedules import crontab
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')

app = Celery('myproject')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Периодические задачи
app.conf.beat_schedule = {
    'parse-emails-every-15-minutes': {
        'task': 'rentapp.tasks.parse_emails_task',
        'schedule': crontab(minute='*/15'),  # Каждые 15 минут
    },
}