# 🔧 Исправление CORS ошибки для медиа файлов (PDF)

## Проблема

При попытке загрузить PDF документы с `api.dev.arno.kz/media/...` на фронтенде `dev.arno.kz` возникала CORS ошибка:

```
Access to fetch at 'https://api.dev.arno.kz/media/email_documents/...' 
from origin 'https://dev.arno.kz' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Причина

В конфигурации Nginx для `api.dev.arno.kz`:
- ✅ CORS заголовки были настроены для `/` location (API запросы через Django)
- ❌ CORS заголовки **НЕ были настроены** для `/media/` location (статические файлы)

Когда PDF.js пытается загрузить PDF файл напрямую с `api.dev.arno.kz/media/...`, Nginx отдает файл напрямую без CORS заголовков, поэтому браузер блокирует запрос.

## Решение

Добавлены CORS заголовки для всех `/media/` location блоков в Nginx конфигурациях:

### Измененные файлы:

1. ✅ `fin_nginx.conf` - добавлены CORS заголовки для `/media/` в обоих server блоках (dev.arno.kz и api.dev.arno.kz)
2. ✅ `nginx_full.conf` - добавлены CORS заголовки для production `/media/` location
3. ✅ `nginx_full_test.conf` - добавлены CORS заголовки для test `/media/` location

### Добавленные заголовки:

```nginx
location /media/ {
    alias /app/media_test/;
    
    # ✅ CORS заголовки для медиа файлов (PDF, изображения и т.д.)
    add_header Access-Control-Allow-Origin "https://dev.arno.kz" always;
    add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
    add_header Access-Control-Allow-Credentials "true" always;
    add_header Access-Control-Expose-Headers "Content-Length, Content-Type" always;
    
    # Обработка preflight запросов
    if ($request_method = OPTIONS) {
        add_header Access-Control-Allow-Origin "https://dev.arno.kz" always;
        add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Content-Length 0;
        add_header Content-Type text/plain;
        return 204;
    }
}
```

## Применение исправления

1. **Перезагрузите Nginx** на сервере:
   ```bash
   docker-compose -f docker-compose.production.yml exec nginx_prod nginx -s reload
   # или для тестового окружения
   docker-compose -f docker-compose.vps.yml exec nginx_test nginx -s reload
   ```

2. **Проверьте конфигурацию** перед перезагрузкой:
   ```bash
   docker-compose -f docker-compose.production.yml exec nginx_prod nginx -t
   ```

3. **Проверьте работу**: Откройте `https://dev.arno.kz/admin/pdf-check` и убедитесь, что PDF файлы загружаются без CORS ошибок

## Важные замечания

1. **`always` флаг**: Используется `always` для всех заголовков, чтобы они добавлялись даже при ошибках (404, 500 и т.д.)

2. **Preflight запросы**: Добавлена обработка OPTIONS запросов для preflight проверок CORS

3. **Credentials**: `Access-Control-Allow-Credentials: true` необходим, так как PDF.js может отправлять Authorization заголовки

4. **Production**: Для production окружения (`arno.kz`) используются соответствующие домены в `Access-Control-Allow-Origin`

## Почему в локальной разработке работало?

В локальной разработке (`localhost:3000` → `localhost:8000`) нет CORS проблем, так как:
- Оба домена на одном origin (localhost)
- Или браузер может быть более снисходительным к localhost

В production с разными доменами (`dev.arno.kz` → `api.dev.arno.kz`) браузер строго проверяет CORS политику.

---

**Дата исправления**: 2025-01-27
