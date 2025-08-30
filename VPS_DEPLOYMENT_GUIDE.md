# 🚀 Руководство по деплою JMSAD на VPS хостинг ps.kz

## 📋 Обзор

Это руководство поможет вам развернуть проект JMSAD на VPS хостинге ps.kz с Ubuntu 24.04 для тестирования и пошагового добавления новых функций.

## 🎯 Что мы получим

- ✅ Django backend на порту 8000
- ✅ Next.js frontend на порту 3000
- ✅ PostgreSQL база данных
- ✅ Nginx для проксирования (порт 80)
- ✅ Автоматическое управление через Docker
- ✅ Готовые скрипты для деплоя и управления

## 📁 Структура файлов для деплоя

```
JMSAD/
├── backend/                 # Django приложение
├── front/                   # Next.js приложение
├── docker-compose.vps.yml   # Docker конфигурация для VPS
├── env.vps                  # Переменные окружения для VPS
├── nginx.conf               # Nginx конфигурация
├── deploy-to-vps.sh         # Скрипт деплоя
├── setup-vps.sh             # Скрипт настройки VPS
└── vps-management.sh        # Скрипт управления на VPS
```

## 🚀 Пошаговый план деплоя

### Шаг 1: Подготовка VPS

1. **Подключитесь к VPS по SSH:**
   ```bash
   ssh username@your-vps-ip
   ```

2. **Загрузите и выполните скрипт настройки:**
   ```bash
   wget https://raw.githubusercontent.com/your-repo/JMSAD/main/setup-vps.sh
   chmod +x setup-vps.sh
   ./setup-vps.sh
   ```

3. **Перезагрузите сервер или перелогиньтесь:**
   ```bash
   sudo reboot
   # или
   newgrp docker
   ```

### Шаг 2: Подготовка локального проекта

1. **Обновите переменные окружения:**
   - Откройте файл `env.vps`
   - Замените `YOUR_VPS_IP` на реальный IP адрес вашего VPS

2. **Проверьте конфигурацию:**
   ```bash
   # Сборка для проверки
   docker-compose -f docker-compose.vps.yml build
   ```

### Шаг 3: Деплой на VPS

1. **Выполните деплой:**
   ```bash
   ./deploy-to-vps.sh test YOUR_VPS_IP YOUR_USERNAME
   ```

2. **Проверьте статус:**
   ```bash
   ssh username@your-vps-ip 'cd ~/jmsad && ./vps-management.sh status'
   ```

## 🌐 Доступ к приложению

После успешного деплоя:

- **Frontend:** http://YOUR_VPS_IP
- **Backend API:** http://YOUR_VPS_IP:8000
- **Django Admin:** http://YOUR_VPS_IP/admin/
- **База данных:** localhost:5432

## 🛠️ Управление приложением на VPS

### Основные команды

```bash
# Подключение к VPS
ssh username@your-vps-ip

# Переход в директорию проекта
cd ~/jmsad

# Управление приложением
./vps-management.sh start      # Запуск
./vps-management.sh stop       # Остановка
./vps-management.sh restart    # Перезапуск
./vps-management.sh status     # Статус
./vps-management.sh logs       # Логи
./vps-management.sh backup     # Backup БД
```

### Мониторинг

```bash
# Статус контейнеров
docker ps

# Использование ресурсов
docker stats

# Логи в реальном времени
docker-compose -f docker-compose.vps.yml logs -f
```

## 🔄 Пошаговое добавление функций

### 1. Разработка локально
```bash
# Запуск в режиме разработки
docker-compose -f docker-compose.dev.yml up
```

### 2. Тестирование на VPS
```bash
# Деплой тестовой версии
./deploy-to-vps.sh test YOUR_VPS_IP YOUR_USERNAME
```

### 3. Обновление на VPS
```bash
# Обновление приложения
ssh username@your-vps-ip 'cd ~/jmsad && ./vps-management.sh update'
```

## 📊 Мониторинг и логи

### Логи приложений
```bash
# Backend логи
docker logs jmsad_backend_vps

# Frontend логи
docker logs jmsad_frontend_vps

# Nginx логи
docker logs jmsad_nginx_vps
```

### Системные ресурсы
```bash
# Мониторинг в реальном времени
./vps-management.sh monitor

# Проверка дискового пространства
df -h

# Проверка памяти
free -h
```

## 🔒 Безопасность

### Firewall
```bash
# Проверка статуса
sudo ufw status

# Открытие портов
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
```

### SSL сертификаты (для продакшена)
```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d yourdomain.com
```

## 🚨 Устранение неполадок

### Проблемы с Docker
```bash
# Перезапуск Docker
sudo systemctl restart docker

# Очистка ресурсов
./vps-management.sh cleanup
```

### Проблемы с базой данных
```bash
# Проверка подключения
docker exec -it jmsad_postgres_vps psql -U jmsad_user -d jmsad_db

# Восстановление из backup
./vps-management.sh restore backup_file.sql
```

### Проблемы с сетью
```bash
# Проверка портов
sudo netstat -tlnp

# Проверка firewall
sudo ufw status
```

## 📈 Масштабирование

### Увеличение ресурсов
```bash
# Обновление Docker Compose
docker-compose -f docker-compose.vps.yml up -d --scale backend=2

# Мониторинг нагрузки
docker stats
```

### Backup стратегия
```bash
# Автоматический backup (добавить в crontab)
0 2 * * * cd /home/username/jmsad && ./vps-management.sh backup
```

## 🔄 Обновления

### Обновление приложения
```bash
# Локально
git pull origin main
docker-compose -f docker-compose.vps.yml build

# На VPS
./deploy-to-vps.sh test YOUR_VPS_IP YOUR_USERNAME
```

### Обновление системы
```bash
# На VPS
sudo apt update && sudo apt upgrade -y
sudo systemctl restart docker
```

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи: `./vps-management.sh logs`
2. Проверьте статус: `./vps-management.sh status`
3. Проверьте ресурсы: `./vps-management.sh monitor`
4. Создайте backup: `./vps-management.sh backup`

## 🎉 Заключение

Теперь у вас есть полностью настроенное окружение для тестирования и разработки на VPS. Вы можете:

- ✅ Тестировать новые функции
- ✅ Проверять производительность
- ✅ Отрабатывать деплой процессы
- ✅ Постепенно добавлять новые возможности

Удачи в разработке! 🚀
