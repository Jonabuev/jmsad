# Система управления токенами

## Обзор

Реализована централизованная система управления JWT токенами, которая автоматически проверяет срок действия токенов и удаляет истекшие токены из localStorage.

## Основные компоненты

### 1. `utils/tokenUtils.ts`

Основная утилита для работы с токенами:

- `decodeToken(token)` - декодирует JWT токен
- `isTokenExpired(token)` - проверяет, истек ли токен
- `isTokenExpiringSoon(token, minutes)` - проверяет, истекает ли токен в ближайшие N минут
- `getValidAccessToken()` - получает валидный access token (удаляет истекший)
- `getValidRefreshToken()` - получает валидный refresh token (удаляет истекший)
- `clearAllTokens()` - очищает все токены из localStorage
- `checkAndCleanExpiredTokens()` - проверяет и очищает истекшие токены
- `saveTokens(accessToken, refreshToken?)` - сохраняет токены с проверкой валидности
- `getTokenExpiryInfo(token)` - получает информацию о времени истечения токена

### 2. `hooks/useTokenValidation.ts`

Хук для автоматической валидации токенов:

- Проверяет токены при загрузке компонента
- Устанавливает интервал для периодической проверки (каждые 5 минут)
- Автоматически перенаправляет на страницу логина при истечении токена

### 3. `hooks/useAutoRefreshToken.ts`

Хук для автоматического обновления токенов:

- Автоматически обновляет access token за 5 минут до истечения
- Проверяет токены каждую минуту
- Использует refresh token для получения нового access token

### 4. Обновленные компоненты

Все компоненты, работающие с токенами, обновлены для использования новой системы:

- `service/api.ts` - использует `getValidAccessToken()` и `getValidRefreshToken()`
- `pages/_app.tsx` - использует `useTokenValidation()` и `checkAndCleanExpiredTokens()`
- `component/screens/login/LoginForm.tsx` - использует `saveTokens()`
- `component/screens/Profile/Profile.tsx` - использует `clearAllTokens()`
- `component/hooks/complaint/useAuthProfile.ts` - использует новые утилиты
- `pages/google.tsx` - использует `saveTokens()`
- `component/form/RegistorForm.tsx` - использует `saveTokens()`
- `component/store/auth/authSlice.ts` - использует `clearAllTokens()`

## Как это работает

### Автоматическая очистка истекших токенов

1. При загрузке приложения вызывается `checkAndCleanExpiredTokens()`
2. При каждом запросе к API используется `getValidAccessToken()` вместо прямого обращения к localStorage
3. Хук `useTokenValidation()` периодически проверяет токены и перенаправляет на логин при необходимости

### Автоматическое обновление токенов

1. Хук `useAutoRefreshToken()` проверяет токены каждую минуту
2. Если access token истекает в ближайшие 5 минут, автоматически обновляет его
3. Использует refresh token для получения нового access token
4. Обновленный токен сохраняется в localStorage

### Безопасное сохранение токенов

Функция `saveTokens()` проверяет валидность токенов перед сохранением:

```typescript
saveTokens(accessToken, refreshToken);
```

### Получение валидных токенов

Вместо прямого обращения к localStorage используйте:

```typescript
const token = getValidAccessToken(); // Автоматически удаляет истекший токен
const refreshToken = getValidRefreshToken(); // Автоматически удаляет истекший токен
```

## Отладка

В режиме разработки отображается компонент `TokenInfo`, который показывает:

- Статус access и refresh токенов
- Время истечения токенов
- Оставшееся время до истечения

## Преимущества

1. **Автоматическая очистка** - истекшие токены автоматически удаляются
2. **Централизованное управление** - вся логика работы с токенами в одном месте
3. **Безопасность** - токены проверяются на валидность перед использованием
4. **Отладка** - встроенные инструменты для мониторинга токенов
5. **Простота использования** - простые функции для работы с токенами

## Использование

### Сохранение токенов после авторизации

```typescript
import { saveTokens } from '@/utils/tokenUtils';

// После успешной авторизации
saveTokens(accessToken, refreshToken);
```

### Получение валидного токена

```typescript
import { getValidAccessToken } from '@/utils/tokenUtils';

const token = getValidAccessToken();
if (token) {
  // Используем токен
} else {
  // Токен отсутствует или истек
}
```

### Очистка токенов при выходе

```typescript
import { clearAllTokens } from '@/utils/tokenUtils';

const handleLogout = () => {
  clearAllTokens();
  router.push('/login');
};
```

### Проверка токенов в компоненте

```typescript
import { useTokenValidation } from '@/component/hooks/useTokenValidation';

const MyComponent = () => {
  const { isValidToken } = useTokenValidation();
  
  if (!isValidToken) {
    return <div>Необходима авторизация</div>;
  }
  
  return <div>Авторизован</div>;
};
``` 