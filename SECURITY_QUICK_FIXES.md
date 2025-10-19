# ⚡ БЫСТРЫЕ ИСПРАВЛЕНИЯ БЕЗОПАСНОСТИ

**Время: ~1 час | Улучшение: 5.0 → 6.5**

---

## 🎯 ТОП-3 КРИТИЧЕСКИХ ИСПРАВЛЕНИЯ

### ✅ ИСПРАВЛЕНИЕ 1: DEFAULT_PERMISSION_CLASSES (15 минут)

**Файл:** `backend/myproject/settings.py`

```python
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',  # ✅ Изменить с AllowAny
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
        'rentapp.authentication.CustomJWTAuthentication',
    ],
}
```

**Затем добавить к публичным endpoints:**

`backend/rentapp/views/auth.py` - уже есть ✅:
- `register` - строка 22
- `login_view` - строка 101  
- `RequestPasswordResetView` - строка 210
- `RequestPasswordChangeView` - строка 242
- `ConfirmPasswordChangeView` - строка 262
- `GoogleAuthView` - строка 350

**Проверить другие views:**
```bash
# Найти все views без permission_classes
grep -r "class.*View" backend/rentapp/views/ | grep -v "permission_classes"
```

---

### ✅ ИСПРАВЛЕНИЕ 2: RATE LIMITING (30 минут)

`django-ratelimit==4.1.0` уже установлен! ✅

**Шаг 1:** Добавить в `backend/rentapp/views/auth.py`:

```python
from django_ratelimit.decorators import ratelimit

# Login (строка 100)
@ratelimit(key='ip', rate='5/m', method='POST')
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    if getattr(request, 'limited', False):
        return Response({
            'error': 'Слишком много попыток входа. Попробуйте через минуту.'
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    # ... существующий код

# Register (строка 21)
@ratelimit(key='ip', rate='3/h', method='POST')
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    if getattr(request, 'limited', False):
        return Response({
            'error': 'Слишком много попыток регистрации. Попробуйте позже.'
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    # ... существующий код
```

**Шаг 2 (опционально):** Настроить Redis для rate limiting

`backend/myproject/settings.py`:
```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',  # Для начала
    }
}
RATELIMIT_USE_CACHE = 'default'
```

---

### ✅ ИСПРАВЛЕНИЕ 3: TOKEN LIFETIME (5 минут)

**Файл:** `backend/myproject/settings.py` (строка 135)

```python
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),   # ✅ Было 300 (5 часов)
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),      # ✅ Было 3 дня
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

**Также обновить backend cookies:**

`backend/rentapp/views/auth.py`:

```python
# Строка 181 (login_view)
response.set_cookie(
    key='access_token',
    value=access_token,
    max_age=30 * 60,  # ✅ 30 минут (было 300 * 60)
    httponly=False,
    secure=False,
    samesite='Lax',
    path='/'
)

# Строка 192 (login_view)
response.set_cookie(
    key='refresh_token',
    value=str(refresh),
    max_age=7 * 24 * 60 * 60,  # ✅ 7 дней (было 3 * 24 * 60 * 60)
    httponly=False,
    secure=False,
    samesite='Lax',
    path='/'
)

# Аналогично в GoogleAuthView (строки 421, 432)
```

---

## 🧪 ТЕСТИРОВАНИЕ

### Тест 1: DEFAULT_PERMISSION_CLASSES

```bash
# Попытка доступа к /api/profile/ без токена
curl http://127.0.0.1:8000/api/profile/

# Должно вернуть: {"detail":"Authentication credentials were not provided."}
```

### Тест 2: Rate Limiting

```bash
# 6 попыток входа за минуту
for i in {1..6}; do
  curl -X POST http://127.0.0.1:8000/api/login/ \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}'
  echo ""
done

# 6-я попытка должна вернуть 429 Too Many Requests
```

### Тест 3: Token Lifetime

```javascript
// В браузере DevTools Console после входа:
const token = document.cookie.match(/access_token=([^;]+)/)[1];
const payload = JSON.parse(atob(token.split('.')[1]));
const expiresIn = (payload.exp * 1000 - Date.now()) / 1000 / 60;
console.log(`Токен истекает через ${expiresIn.toFixed(1)} минут`);

// Должно показать ~30 минут (не 300)
```

---

## 📋 ЧЕКЛИСТ

- [ ] **1. DEFAULT_PERMISSION_CLASSES изменен**
  - [ ] Settings.py обновлен
  - [ ] Все публичные endpoints имеют @permission_classes([AllowAny])
  - [ ] Тест: curl без токена возвращает 401

- [ ] **2. Rate Limiting добавлен**
  - [ ] Импорт django_ratelimit добавлен
  - [ ] login_view защищен (5/m)
  - [ ] register защищен (3/h)
  - [ ] Тест: 6 попыток возвращает 429

- [ ] **3. Token Lifetime сокращен**
  - [ ] SIMPLE_JWT обновлен (30 минут)
  - [ ] set_cookie в login_view обновлен
  - [ ] set_cookie в GoogleAuthView обновлен
  - [ ] Тест: токен живет 30 минут

---

## 🚀 ЗАПУСК

```bash
# 1. Перезапустите backend
cd backend
python manage.py runserver

# 2. Перезапустите frontend
cd front
npm run dev

# 3. Очистите cookies в браузере (F12 → Application → Clear)

# 4. Попробуйте войти и проверьте
```

---

## 📊 РЕЗУЛЬТАТ

**До:**
- Оценка: 5.0/10
- API открыты всем
- Нет защиты от брутфорса
- Токен живет 5 часов

**После:**
- Оценка: 6.5/10 ✅
- API требуют аутентификацию
- Rate limiting защищает от брутфорса
- Токен живет 30 минут

**Улучшение: +30%** 🎉

---

**Готовы начать?** Скажите "начать" и я внедрю все 3 исправления! 🔧

