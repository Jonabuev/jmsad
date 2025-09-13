# Настройка Firebase Cloud Messaging для Push Уведомлений

## 1. Создание проекта Firebase

1. Перейдите на [Firebase Console](https://console.firebase.google.com/)
2. Нажмите "Создать проект"
3. Введите название проекта (например, "arno-notifications")
4. Включите Google Analytics (опционально)
5. Создайте проект

## 2. Настройка веб-приложения

1. В Firebase Console выберите "Веб" (</>) иконку
2. Зарегистрируйте приложение с именем "ARNO Web"
3. Скопируйте конфигурацию Firebase

## 3. Настройка Cloud Messaging

1. В Firebase Console перейдите в "Cloud Messaging"
2. Нажмите "Создать первую кампанию" или "Настроить"
3. Скопируйте Server Key (Legacy)

## 4. Настройка переменных окружения

### Backend (.env)
```env
FCM_SERVER_KEY=your_fcm_server_key_here
FCM_PROJECT_ID=your_fcm_project_id_here
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
```

## 5. Получение VAPID ключа

1. В Firebase Console перейдите в "Project Settings" > "Cloud Messaging"
2. В разделе "Web configuration" найдите "Web Push certificates"
3. Нажмите "Generate key pair" если ключа нет
4. Скопируйте VAPID ключ

## 6. Настройка доменов

1. В Firebase Console перейдите в "Project Settings" > "General"
2. В разделе "Your apps" найдите ваше веб-приложение
3. Добавьте домены в "Authorized domains":
   - localhost (для разработки)
   - ваш-production-домен.com

## 7. Тестирование

1. Запустите backend и frontend
2. Войдите в систему
3. Откройте консоль браузера
4. Проверьте, что Service Worker зарегистрирован
5. Запросите разрешение на уведомления
6. Отправьте тестовое уведомление

## 8. Проверка работы

### В браузере:
1. Откройте DevTools > Application > Service Workers
2. Убедитесь, что `firebase-messaging-sw.js` зарегистрирован
3. Перейдите в Console и выполните:
   ```javascript
   navigator.serviceWorker.ready.then(registration => {
     console.log('SW ready:', registration);
   });
   ```

### В API:
1. POST `/api/fcm/register/` - регистрация токена
2. GET `/api/fcm/stats/` - статистика токенов
3. POST `/api/fcm/test/` - тестовое уведомление

## 9. Troubleshooting

### Проблема: "Service Worker не зарегистрирован"
**Решение:**
- Проверьте, что файл `firebase-messaging-sw.js` находится в `/public/`
- Убедитесь, что домен добавлен в Authorized domains

### Проблема: "Permission denied"
**Решение:**
- Проверьте, что сайт работает по HTTPS (или localhost)
- Убедитесь, что пользователь предоставил разрешение

### Проблема: "FCM токен не получен"
**Решение:**
- Проверьте правильность VAPID ключа
- Убедитесь, что Firebase конфигурация корректна

## 10. Производственная настройка

1. Замените все тестовые ключи на production
2. Настройте HTTPS для домена
3. Обновите Authorized domains
4. Протестируйте на реальных устройствах

## 11. Мониторинг

- Firebase Console > Cloud Messaging > Reports
- Backend логи: `/var/log/django/fcm.log`
- Frontend логи: Browser Console
