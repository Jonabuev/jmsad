import random
from django.core.mail import send_mail
from .models import CustomUser, ActivityLog

def generate_code():
    return str(random.randint(100000, 999999))

def send_confirmation_code(email, code):
    send_mail(
        subject="Код подтверждения смены пароля",
        message=f"Ваш код подтверждения: {code}",
        from_email="noreply@yourapp.com",
        recipient_list=[email],
        fail_silently=False,
    )

def generate_anonymous_name():
    """Генерирует случайное анонимное имя для пользователя"""
    # Списки для генерации анонимных имен
    ANONYMOUS_ADJECTIVES = [
        'Тихий', 'Веселый', 'Серьезный', 'Дружелюбный', 'Спокойный', 'Активный', 
        'Умный', 'Творческий', 'Надежный', 'Ответственный', 'Вежливый', 'Оптимистичный',
        'Скромный', 'Энергичный', 'Терпеливый', 'Добрый', 'Честный', 'Смелый',
        'Заботливый', 'Трудолюбивый', 'Любознательный', 'Справедливый', 'Щедрый',
        'Скромный', 'Смешной', 'Мудрый', 'Быстрый', 'Сильный', 'Гибкий', 'Устойчивый'
    ]
    
    ANONYMOUS_NOUNS = [
        'Сосед', 'Житель', 'Арендатор', 'Арендодатель', 'Пользователь', 'Клиент',
        'Гость', 'Хозяин', 'Квартирант', 'Владелец', 'Постоялец', 'Резидент',
        'Обитатель', 'Насельник', 'Квартиросъемщик', 'Домовладелец', 'Арендатор',
        'Постоялец', 'Жилец', 'Квартирант', 'Съемщик', 'Хозяин', 'Владелец',
        'Арендодатель', 'Квартиросъемщик', 'Постоялец', 'Житель', 'Сосед'
    ]
    
    ANONYMOUS_COLORS = [
        'Красный', 'Синий', 'Зеленый', 'Желтый', 'Оранжевый', 'Фиолетовый', 
        'Розовый', 'Коричневый', 'Серый', 'Черный', 'Белый', 'Голубой',
        'Бирюзовый', 'Малиновый', 'Золотой', 'Серебряный', 'Бронзовый', 'Медный',
        'Изумрудный', 'Сапфировый', 'Рубиновый', 'Аметистовый', 'Топазовый'
    ]
    
    ANONYMOUS_ANIMALS = [
        'Кот', 'Пес', 'Лев', 'Тигр', 'Медведь', 'Волк', 'Лиса', 'Заяц', 'Еж',
        'Белка', 'Олень', 'Лось', 'Кабан', 'Косуля', 'Кролик', 'Хомяк', 'Мышь',
        'Крыса', 'Морская свинка', 'Хорек', 'Норка', 'Выдра', 'Бобр', 'Ондатра'
    ]
    
    # Выбираем случайные элементы из списков
    adjective = random.choice(ANONYMOUS_ADJECTIVES)
    noun = random.choice(ANONYMOUS_NOUNS)
    color = random.choice(ANONYMOUS_COLORS)
    animal = random.choice(ANONYMOUS_ANIMALS)
    
    # Создаем несколько вариантов анонимных имен
    name_variants = [
        f"{adjective} {noun}",
        f"{color} {animal}",
        f"{adjective} {color} {noun}",
        f"{noun} {animal}",
        f"{adjective} {animal}",
        f"{color} {noun}",
        f"{adjective} {noun} {animal}",
        f"{color} {adjective} {noun}"
    ]
    
    # Выбираем случайный вариант
    anonymous_name = random.choice(name_variants)
    
    # Проверяем, что такое имя еще не используется
    counter = 1
    original_name = anonymous_name
    while CustomUser.objects.filter(anonymous_name=anonymous_name).exists():
        anonymous_name = f"{original_name} {counter}"
        counter += 1
        if counter > 100:  # Защита от бесконечного цикла
            break
    
    return anonymous_name

def assign_anonymous_names_to_existing_users():
    """Назначает анонимные имена всем существующим пользователям, у которых их нет"""
    users_without_anonymous_names = CustomUser.objects.filter(anonymous_name__isnull=True)
    
    for user in users_without_anonymous_names:
        user.anonymous_name = generate_anonymous_name()
        user.save()
    
    return users_without_anonymous_names.count()


def get_client_ip(request):
    """Получение IP адреса клиента"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_activity(action_type, description, user=None, target_object=None, 
                request=None, metadata=None):
    """
    Утилита для записи активности в систему
    
    Args:
        action_type (str): Тип действия из ACTION_TYPES
        description (str): Описание действия
        user (CustomUser, optional): Пользователь, совершивший действие
        target_object (Model, optional): Объект, над которым совершено действие
        request (HttpRequest, optional): HTTP запрос для получения IP и User-Agent
        metadata (dict, optional): Дополнительные метаданные
    
    Returns:
        ActivityLog: Созданная запись лога
    """
    try:
        activity = ActivityLog.objects.create(
            user=user,
            action_type=action_type,
            action_description=description,
            target_object_type=target_object.__class__.__name__.lower() if target_object else None,
            target_object_id=target_object.id if target_object else None,
            ip_address=get_client_ip(request) if request else None,
            user_agent=request.META.get('HTTP_USER_AGENT', '') if request else '',
            metadata=metadata or {}
        )
        return activity
    except Exception as e:
        # Логируем ошибку, но не прерываем выполнение основного кода
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Ошибка при записи лога активности: {e}")
        return None


# backend/rentapp/utils.py

import email
import imaplib
import os
from email.header import decode_header
from datetime import datetime
from typing import List, Dict, Optional
from django.conf import settings
from django.core.files.base import ContentFile
import logging

logger = logging.getLogger(__name__)

def _decode_mime_words(s):
    """Декодирует MIME-заголовки (имя файла, тема и т.д.)"""
    if not s:
        return ''
    decoded_parts = decode_header(s)
    decoded = []
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            try:
                decoded.append(part.decode(encoding or 'utf-8'))
            except:
                decoded.append(part.decode('utf-8', errors='ignore'))
        else:
            decoded.append(str(part))
    return ''.join(decoded)


class EmailParser:
    """Парсер для извлечения PDF документов из email."""

    def __init__(self):
        self.email_host = settings.EMAIL_HOST
        self.email_user = settings.EMAIL_HOST_USER
        self.email_password = settings.EMAIL_HOST_PASSWORD
        self.imap_server = None

    def connect(self):
        """Подключение к IMAP серверу Gmail."""
        try:
            logger.info(f"Подключение к imap.gmail.com как {self.email_user}")
            self.imap_server = imaplib.IMAP4_SSL('imap.gmail.com')
            self.imap_server.login(self.email_user, self.email_password)
            logger.info("Подключение успешно")
            return True
        except Exception as e:
            logger.error(f"Ошибка подключения к email: {e}")
            return False

    def disconnect(self):
        """Отключение от IMAP сервера."""
        if self.imap_server:
            try:
                self.imap_server.close()
                self.imap_server.logout()
            except:
                pass
            self.imap_server = None

    def get_unprocessed_emails(self, sender_filter: Optional[str] = None) -> List[Dict]:
        """Получить письма с PDF, которые ещё не обработаны."""
        if not self.connect():
            logger.error("Не удалось подключиться к email серверу")
            return []

        try:
            self.imap_server.select('INBOX')
            logger.info("Папка INBOX выбрана")

            # Формируем критерий поиска
            if sender_filter:
                search_criteria = f'(FROM "{sender_filter}")'
            else:
                search_criteria = 'ALL'

            status, messages = self.imap_server.search(None, search_criteria)
            if status != 'OK':
                logger.error(f"Ошибка поиска: {status}")
                return []

            email_ids = messages[0].split()
            logger.info(f"Найдено писем: {len(email_ids)}")

            emails_data = []
            for email_id in email_ids:
                email_data = self._parse_email(email_id)
                if email_data:
                    # Фильтруем уже обработанные вложения
                    from rentapp.models import EmailDocument
                    
                    unprocessed_attachments = []
                    for attachment in email_data['pdf_attachments']:
                        exists = EmailDocument.objects.filter(
                            email_id=email_data['email_id'],
                            filename=attachment['filename']
                        ).exists()
                        
                        if not exists:
                            unprocessed_attachments.append(attachment)
                            logger.info(f"Необработанное вложение: {attachment['filename']}")
                        else:
                            logger.info(f"Вложение уже обработано: {attachment['filename']}")
                    
                    # Добавляем письмо только если есть необработанные вложения
                    if unprocessed_attachments:
                        email_data['pdf_attachments'] = unprocessed_attachments
                        emails_data.append(email_data)
                        logger.info(f"Письмо {email_data['email_id']} добавлено с {len(unprocessed_attachments)} вложениями")
                    else:
                        logger.info(f"Все вложения письма {email_data['email_id']} уже обработаны")

            logger.info(f"К обработке: {len(emails_data)} писем с необработанными вложениями")
            return emails_data

        except Exception as e:
            logger.error(f"Ошибка получения писем: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return []
        finally:
            self.disconnect()
    def _parse_email(self, email_id: bytes) -> Optional[Dict]:
        """Парсинг отдельного письма с декодированием имени файла."""
        try:
            status, msg_data = self.imap_server.fetch(email_id, '(RFC822)')
            if status != 'OK':
                return None

            email_body = msg_data[0][1]
            message = email.message_from_bytes(email_body)

            subject = _decode_mime_words(message['Subject'])
            sender = _decode_mime_words(message['From'])
            date_str = message['Date']

            try:
                date = email.utils.parsedate_to_datetime(date_str)
            except:
                date = datetime.now()

            pdf_attachments = []
            for part in message.walk():
                if part.get_content_maintype() == 'multipart':
                    continue
                if part.get('Content-Disposition') is None:
                    continue

                filename = part.get_filename()
                if not filename:
                    continue

                # ДЕКОДИРУЕМ ИМЯ ФАЙЛА
                decoded_filename = _decode_mime_words(filename)
                if not decoded_filename.lower().endswith('.pdf'):
                    continue

                pdf_data = part.get_payload(decode=True)
                if not pdf_data:
                    continue

                pdf_attachments.append({
                    'filename': decoded_filename,
                    'data': pdf_data
                })
                logger.info(f"PDF найден: {decoded_filename}")

            if not pdf_attachments:
                return None

            return {
                'email_id': email_id.decode(),
                'subject': subject,
                'sender': sender,
                'date': date,
                'pdf_attachments': pdf_attachments
            }

        except Exception as e:
            logger.error(f"Ошибка парсинга письма {email_id}: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return None

    def mark_as_read(self, email_id: str):
        """Пометить письмо как прочитанное."""
        if not self.connect():
            return False
        try:
            self.imap_server.select('INBOX')
            self.imap_server.store(email_id.encode(), '+FLAGS', '\\Seen')
            logger.info(f"Письмо {email_id} помечено как прочитанное")
            return True
        except Exception as e:
            logger.error(f"Ошибка пометки письма: {e}")
            return False
        finally:
            self.disconnect()

