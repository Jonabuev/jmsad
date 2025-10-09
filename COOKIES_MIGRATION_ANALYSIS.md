# 🔍 Полный анализ: Переход с localStorage на Cookies

## 📊 Текущее состояние проекта

### Frontend (21 файл с localStorage)

| Файл | Использований | Критичность | Примечания |
|------|---------------|-------------|------------|
| **Утилиты и хуки** |||
| `utils/tokenUtils.ts` | 14 | 🔴 ВЫСОКАЯ | Основная логика токенов |
| `component/hooks/useAuthToken.ts` | 1 | 🔴 ВЫСОКАЯ | Хук для получения токена |
| `component/hooks/useLocalStorage.ts` | 2 | 🟡 СРЕДНЯЯ | Универсальный хук |
| **Firebase** |||
| `utils/firebase.ts` | 5 | 🔴 ВЫСОКАЯ | Push уведомления |
| **Аутентификация** |||
| `screens/login/LoginForm.tsx` | 1 | 🔴 ВЫСОКАЯ | Вход в систему |
| `common/GoogleLoginButton.tsx` | 1 | 🔴 ВЫСОКАЯ | Google OAuth |
| **Формы** |||
| `form/DisputeComplaint.tsx` | 3 | 🟡 СРЕДНЯЯ | Форма диспута |
| `form/EditComplaintForm.tsx` | 3 | 🟡 СРЕДНЯЯ | Редактирование жалобы |
| `form/PropertyForm.tsx` | 1 | 🟡 СРЕДНЯЯ | Форма недвижимости |
| `form/SubmitComplaint.tsx` | 3 | 🟡 СРЕДНЯЯ | Подача жалобы |
| **Профиль** |||
| `screens/Profile/Profile.tsx` | 2 | 🟡 СРЕДНЯЯ | Профиль пользователя |
| `screens/Profile/VerifyIdentityForm.tsx` | 2 | 🟡 СРЕДНЯЯ | Верификация |
| `screens/user-profile/PublicUserProfile.tsx` | 3 | 🟡 СРЕДНЯЯ | Публичный профиль |
| `screens/Profile/RentalRequestsTable.tsx` | 2 | 🟡 СРЕДНЯЯ | Таблица запросов |
| `screens/Profile/user-section/aportoments-section/AportSection.tsx` | 2 | 🟡 СРЕДНЯЯ | Квартиры |
| **Другие компоненты** |||
| `screens/change-passwod/PasswordChangeFlow.tsx` | 3 | 🟡 СРЕДНЯЯ | Смена пароля |
| `screens/change-passwod/ChangePassword.tsx` | 1 | 🟡 СРЕДНЯЯ | Смена пароля |
| `screens/search/SearchPage.tsx` | 5 | 🟡 СРЕДНЯЯ | Поиск |
| `screens/rental-catalog/RentalCatalog.tsx` | 1 | 🟡 СРЕДНЯЯ | Каталог |
| **API** |||
| `api/complaints.ts` | 1 | 🟡 СРЕДНЯЯ | API жалоб |
| **Admin** |||
| `pages/admin/pdf-check/index.tsx` | 2 | 🟢 НИЗКАЯ | Admin функционал |

**Итого:** 58 использований в 21 файле

---

### Backend

#### ✅ Что уже готово:

1. **CORS настройки:**
   ```python
   CORS_ALLOW_CREDENTIALS = True  # ✅ Уже включено!
   CORS_ALLOW_ORIGINS = [
       'http://localhost:3000',
       'http://127.0.0.1:3000',
       # ... и production домены
   ]
   ```

2. **CSRF настройки:**
   ```python
   CSRF_COOKIE_SECURE = True  # ✅ Для production
   CSRF_TRUSTED_ORIGINS = [...]  # ✅ Настроено
   ```

3. **Session middleware:**
   ```python
   'django.contrib.sessions.middleware.SessionMiddleware',  # ✅ Есть
   'django.middleware.csrf.CsrfViewMiddleware',  # ✅ Есть
   ```

4. **JWT настройки:**
   ```python
   SIMPLE_JWT = {
       'ACCESS_TOKEN_LIFETIME': timedelta(minutes=300),
       'REFRESH_TOKEN_LIFETIME': timedelta(days=3),
       # ...
   }
   ```

#### ❌ Что нужно добавить:

1. **Custom middleware для чтения JWT из cookies**
   - Текущий `CustomJWTAuthentication` читает только из заголовка `Authorization`
   - Нужно добавить fallback на cookies

2. **Обновить login view**
   - Текущий endpoint возвращает токены в JSON
   - Нужно также устанавливать их в cookies

3. **Обновить Google auth view**
   - То же самое - устанавливать cookies

4. **Настроить cookie параметры для localhost:**
   ```python
   # Для разработки (localhost)
   SESSION_COOKIE_SECURE = False  # Изменить для localhost
   CSRF_COOKIE_SECURE = False     # Изменить для localhost
   SESSION_COOKIE_SAMESITE = 'Lax'
   CSRF_COOKIE_SAMESITE = 'Lax'
   ```

---

## 🎯 План миграции

### Этап 1: Frontend базовые утилиты

1. **Создать `cookieUtils.ts`**
   - Функции для работы с cookies
   - SSR совместимость
   - TypeScript типизация

2. **Обновить `tokenUtils.ts`**
   - Заменить все `localStorage` на cookies
   - Сохранить обратную совместимость
   - Добавить функции:
     - `getCookieToken()` - читать из cookies
     - `setCookieToken()` - писать в cookies
     - `clearCookieTokens()` - очистка

3. **Обновить `useAuthToken.ts`**
   - Читать токен из cookies вместо localStorage

### Этап 2: Frontend аутентификация

4. **Обновить `LoginForm.tsx`**
   - После успешного входа устанавливать cookies
   - Очищать при ошибке

5. **Обновить `GoogleLoginButton.tsx`**
   - Устанавливать cookies после Google OAuth

6. **Обновить `firebase.ts`**
   - Читать токен из cookies для FCM регистрации

### Этап 3: Frontend компоненты

7. **Обновить все формы** (DisputeComplaint, EditComplaintForm, PropertyForm, SubmitComplaint)
   - Заменить `localStorage.getItem('access_token')` на `getCookieToken()`

8. **Обновить Profile компоненты**
   - Profile.tsx, VerifyIdentityForm.tsx, PublicUserProfile.tsx
   - Использовать cookies для аутентификации

9. **Обновить остальные компоненты**
   - SearchPage, AportSection, RentalRequestsTable
   - PasswordChangeFlow, ChangePassword
   - RentalCatalog

10. **Обновить `useLocalStorage` хук**
    - Создать `useCookieStorage` или универсальный хук
    - Сохранить API совместимость

11. **Обновить `api/complaints.ts`**
    - Использовать tokenUtils вместо прямого localStorage

### Этап 4: Backend изменения

12. **Создать `CookieJWTMiddleware`**
    ```python
    # backend/rentapp/middleware/cookie_jwt.py
    class CookieJWTMiddleware:
        def process_request(self, request):
            # Читать JWT из cookies если нет в заголовке
            # Устанавливать заголовок Authorization
    ```

13. **Обновить `login_view`**
    ```python
    # backend/rentapp/views/auth.py
    def login_view(request):
        # ... существующий код ...
        response = Response({...})
        
        # Устанавливаем cookies
        response.set_cookie(
            key='access_token',
            value=access_token,
            httponly=True,
            secure=settings.DEBUG == False,
            samesite='Lax',
            max_age=300*60  # 5 часов
        )
        response.set_cookie(
            key='refresh_token',
            value=str(refresh),
            httponly=True,
            secure=settings.DEBUG == False,
            samesite='Lax',
            max_age=3*24*60*60  # 3 дня
        )
        
        return response
    ```

14. **Обновить `GoogleAuthView`**
    - Аналогично login_view устанавливать cookies

15. **Настроить settings для localhost**
    ```python
    # backend/myproject/settings.py
    
    # Для разработки
    if DEBUG:
        SESSION_COOKIE_SECURE = False
        CSRF_COOKIE_SECURE = False
        SESSION_COOKIE_SAMESITE = 'Lax'
        CSRF_COOKIE_SAMESITE = 'Lax'
    ```

### Этап 5: Тестирование

16. **Локальное тестирование**
    - Вход в систему
    - Обновление страницы
    - Проверка DevTools
    - API запросы
    - Выход из системы

---

## ⚠️ Важные моменты

### 🔴 Критические изменения

1. **HttpOnly cookies**
   - Если установим `httponly=True`, JavaScript **НЕ СМОЖЕТ** читать токены
   - Это **хорошо** для безопасности
   - Но нужно будет:
     - Backend читает из cookies
     - Backend добавляет в заголовок Authorization
     - Frontend **не нужно** читать токен напрямую

2. **Размер cookies**
   - Лимит: ~4KB на cookie
   - JWT токены: ~200-500 bytes каждый ✅
   - Profile данные: могут быть большими ⚠️
   - **Решение:** Хранить только токены в cookies, profile в localStorage или на сервере

3. **CORS и SameSite**
   - Для localhost: `SameSite=Lax` (работает)
   - Для production: `SameSite=Strict` или `None` с HTTPS
   - Нужно правильно настроить CORS_ALLOW_CREDENTIALS

### 🟡 Средние проблемы

4. **SSR (Server-Side Rendering)**
   - Next.js может рендерить на сервере
   - Cookies доступны на сервере через request headers
   - localStorage НЕ доступен на сервере
   - Cookies - **лучше** для SSR

5. **CSRF защита**
   - Django уже включен CSRF middleware
   - Нужно будет отправлять CSRF token с запросами
   - Axios может делать это автоматически

6. **Обратная совместимость**
   - Старые токены в localStorage
   - Нужна миграция при первом входе
   - Функция: `migrateFromLocalStorageToCookies()`

---

## 🚀 Преимущества перехода на Cookies

### ✅ Безопасность

1. **HttpOnly cookies**
   - Защита от XSS атак
   - JavaScript не может читать токены
   - Даже если хакер внедрит скрипт - не получит токены

2. **Secure flag**
   - Только HTTPS в production
   - Защита от MITM атак

3. **SameSite**
   - Защита от CSRF атак
   - Браузер не отправит cookie на чужой домен

### ✅ Функциональность

4. **SSR поддержка**
   - Cookies доступны на сервере
   - Можно рендерить защищенные страницы на сервере

5. **Автоматическая отправка**
   - Браузер автоматически отправляет cookies
   - Не нужно вручную добавлять в заголовки

6. **Контроль срока жизни**
   - Backend контролирует expires
   - Автоматическое удаление просроченных

---

## 📋 Чеклист изменений

### Frontend (21 файл)

- [ ] **1. Создать cookieUtils.ts**
  - [ ] setCookie()
  - [ ] getCookie()
  - [ ] deleteCookie()
  - [ ] SSR поддержка

- [ ] **2. Обновить tokenUtils.ts**
  - [ ] getValidAccessToken() - читать из cookies
  - [ ] getValidRefreshToken() - читать из cookies
  - [ ] saveTokens() - писать в cookies
  - [ ] clearAllTokens() - очистка cookies

- [ ] **3. Обновить hooks**
  - [ ] useAuthToken.ts
  - [ ] useLocalStorage.ts → useCookieStorage.ts

- [ ] **4. Обновить аутентификацию**
  - [ ] LoginForm.tsx
  - [ ] GoogleLoginButton.tsx
  - [ ] firebase.ts (5 мест)

- [ ] **5. Обновить формы (4 файла)**
  - [ ] DisputeComplaint.tsx
  - [ ] EditComplaintForm.tsx
  - [ ] PropertyForm.tsx
  - [ ] SubmitComplaint.tsx

- [ ] **6. Обновить Profile (5 файлов)**
  - [ ] Profile.tsx
  - [ ] VerifyIdentityForm.tsx
  - [ ] PublicUserProfile.tsx
  - [ ] RentalRequestsTable.tsx
  - [ ] AportSection.tsx

- [ ] **7. Обновить остальное (6 файлов)**
  - [ ] PasswordChangeFlow.tsx
  - [ ] ChangePassword.tsx
  - [ ] SearchPage.tsx
  - [ ] RentalCatalog.tsx
  - [ ] api/complaints.ts
  - [ ] admin/pdf-check/index.tsx

### Backend (3 файла)

- [ ] **8. Создать middleware**
  - [ ] backend/rentapp/middleware/cookie_jwt.py
  - [ ] Добавить в settings.MIDDLEWARE

- [ ] **9. Обновить views**
  - [ ] login_view - установка cookies
  - [ ] GoogleAuthView - установка cookies
  - [ ] Добавить logout view - очистка cookies

- [ ] **10. Обновить settings.py**
  - [ ] Настройки cookies для localhost
  - [ ] SESSION_COOKIE_SECURE = False (для DEBUG)
  - [ ] CSRF_COOKIE_SECURE = False (для DEBUG)

---

## 🧪 Тестирование

### Что тестировать:

1. **Вход в систему**
   - [ ] Cookies устанавливаются
   - [ ] Токены валидные
   - [ ] Перенаправление работает

2. **API запросы**
   - [ ] Токены отправляются в заголовках
   - [ ] 401 обрабатывается корректно
   - [ ] Refresh работает

3. **Обновление страницы**
   - [ ] Авторизация сохраняется
   - [ ] Cookies читаются корректно

4. **Выход из системы**
   - [ ] Cookies удаляются
   - [ ] Перенаправление на login

5. **Google OAuth**
   - [ ] Cookies устанавливаются
   - [ ] Профиль загружается

### DevTools проверка:

```
1. F12 → Application
2. Storage → Cookies → http://localhost:3000
3. Должны увидеть:
   - access_token (HttpOnly, Secure=false, SameSite=Lax)
   - refresh_token (HttpOnly, Secure=false, SameSite=Lax)
```

---

## 💡 Рекомендации

### Для localhost разработки:

```python
# backend/myproject/settings.py
if DEBUG:
    # Разрешаем cookies без HTTPS для localhost
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False
    SESSION_COOKIE_SAMESITE = 'Lax'
    CSRF_COOKIE_SAMESITE = 'Lax'
```

### Для production:

```python
# backend/myproject/settings.py
if not DEBUG:
    # Требуем HTTPS для production
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_SAMESITE = 'Strict'
    CSRF_COOKIE_SAMESITE = 'Strict'
    SECURE_SSL_REDIRECT = True
```

---

## ⏱️ Оценка времени

| Этап | Задача | Время |
|------|--------|-------|
| 1 | Создать cookieUtils.ts | 20 мин |
| 2 | Обновить tokenUtils.ts | 30 мин |
| 3 | Обновить hooks (2 файла) | 15 мин |
| 4 | Обновить аутентификацию (3 файла) | 30 мин |
| 5 | Обновить формы (4 файла) | 30 мин |
| 6 | Обновить Profile (5 файлов) | 40 мин |
| 7 | Обновить остальное (6 файлов) | 40 мин |
| 8 | Backend middleware | 30 мин |
| 9 | Backend views | 30 мин |
| 10 | Backend settings | 10 мин |
| 11 | Тестирование | 40 мин |

**Итого: ~4-5 часов**

---

## 🎯 Следующие шаги

Готов начать реализацию? Вот порядок действий:

1. ✅ **Создать cookieUtils.ts** - базовые функции
2. ✅ **Обновить tokenUtils.ts** - переключить на cookies
3. ✅ **Тест login** - проверить что работает
4. ✅ **Backend middleware** - чтение из cookies
5. ✅ **Backend login view** - установка cookies
6. ✅ **Полное тестирование** - все компоненты
7. ✅ **Обновить остальные файлы** - batch update

**Начинаем?** 🚀

