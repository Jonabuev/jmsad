# from django.apps import AppConfig
# import logging

# class RentappConfig(AppConfig):
#     default_auto_field = 'django.db.models.BigAutoField'
#     name = 'rentapp'

#     def ready(self):
#         # Импортируем сигналы
#         import rentapp.signals

#         # Проверка и обновление суперюзеров
#         try:
#             from rentapp.models import CustomUser
#             CustomUser.objects.filter(is_superuser=True, email_confirmed=False).update(email_confirmed=True)
#         except Exception as e:
#             logging.getLogger(__name__).warning(f"Не удалось обновить суперюзеров: {e}")
