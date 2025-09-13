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
