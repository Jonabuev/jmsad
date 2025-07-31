# JMSAD Docker Setup

Этот проект содержит Docker конфигурацию для запуска фронтенда, бэкенда и базы данных.

## 🚀 Быстрый запуск всех сервисов

```bash
docker-compose up -d
```

## 📋 Пошаговый запуск (рекомендуется для отладки)

### 1. Запуск базы данных
```bash
chmod +x start-database.sh
./start-database.sh
```

### 2. Запуск бэкенда
```bash
chmod +x start-backend.sh
./start-backend.sh
```

### 3. Запуск фронтенда
```bash
chmod +x start-frontend.sh
./start-frontend.sh
```

## 🔧 Конфигурация

### База данных (PostgreSQL 16.9)
- **Порт**: 5432
- **База данных**: jmsad_db
- **Пользователь**: jmsad_user
- **Пароль**: jmsad_password

### Бэкенд (Django + Python 3.12.6)
- **Порт**: 8000
- **URL**: http://localhost:8000

### Фронтенд (Next.js 15.2.3 + React 19.0.0)
- **Порт**: 3000
- **URL**: http://localhost:3000

## 🛠️ Управление контейнерами

### Просмотр логов
```bash
# Все сервисы
docker-compose logs

# Конкретный сервис
docker logs jmsad_frontend
docker logs jmsad_backend
docker logs jmsad_postgres
```

### Остановка сервисов
```bash
# Остановить все
docker-compose down

# Остановить конкретный сервис
docker stop jmsad_frontend
docker stop jmsad_backend
docker stop jmsad_postgres
```

### Перезапуск сервисов
```bash
# Перезапустить все
docker-compose restart

# Перезапустить конкретный сервис
docker restart jmsad_frontend
```

## 🔍 Отладка

### Проверка статуса контейнеров
```bash
docker ps
```

### Вход в контейнер
```bash
# Фронтенд
docker exec -it jmsad_frontend sh

# Бэкенд
docker exec -it jmsad_backend bash

# База данных
docker exec -it jmsad_postgres psql -U jmsad_user -d jmsad_db
```

### Очистка
```bash
# Удалить все контейнеры и образы
docker-compose down --volumes --rmi all

# Удалить конкретный контейнер
docker rm -f jmsad_frontend
```

## 📝 Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=postgresql://jmsad_user:jmsad_password@postgres:5432/jmsad_db

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🚨 Устранение неполадок

### Проблемы с портами
Если порты заняты, измените их в `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Фронтенд на порту 3001
  - "8001:8000"  # Бэкенд на порту 8001
  - "5433:5432"  # БД на порту 5433
```

### Проблемы с правами доступа
```bash
# Для Linux/Mac
sudo chmod +x *.sh
```

### Проблемы с памятью
Увеличьте лимиты Docker в настройках Docker Desktop.

## 📚 Полезные команды

```bash
# Просмотр использования ресурсов
docker stats

# Очистка неиспользуемых ресурсов
docker system prune -a

# Просмотр информации о сети
docker network ls
docker network inspect jmsad_jmsad-network
``` 