# 🌐 Деплой на VPS хостинг ps.kz

## 📋 Подготовка VPS (Ubuntu 24.04 LTS)

### 1. Подключение к VPS
```bash
ssh root@your-vps-ip
```

### 2. Обновление системы
```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Установка необходимых пакетов
```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установка Docker Compose
sudo apt install docker-compose-plugin -y

# Установка дополнительных утилит
sudo apt install curl wget git htop nginx certbot python3-certbot-nginx -y
```

### 4. Создание пользователя для проекта
```bash
# Создание пользователя
sudo useradd -m -s /bin/bash jmsad
sudo usermod -aG docker jmsad

# Переключение на пользователя
sudo su - jmsad
```

## 🚀 Деплой проекта

### 1. Клонирование проекта
```bash
cd /home/jmsad
git clone https://github.com/your-username/jmsad.git
cd jmsad
```

### 2. Настройка переменных окружения
```bash
# Создание .env файла
cat > .env << EOF
SECRET_KEY=your-very-secure-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DB_NAME=jmsad_db
DB_USER=jmsad_user
DB_PASSWORD=your-secure-db-password
DB_HOST=postgres
DB_PORT=5432
NEXT_PUBLIC_API_URL=http://your-domain.com:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
EOF
```

### 3. Первый запуск (тестирование)
```bash
# Сборка и запуск
docker-compose -f docker-compose.dev.yml up -d --build

# Проверка статуса
docker-compose -f docker-compose.dev.yml ps

# Просмотр логов
docker-compose -f docker-compose.dev.yml logs -f
```

### 4. Проверка работы
```bash
# Проверка фронтенда
curl http://localhost:3000

# Проверка бэкенда
curl http://localhost:8000

# Проверка базы данных
docker exec jmsad_postgres_dev psql -U jmsad_user -d jmsad_db -c "SELECT version();"
```

## 🔒 Настройка безопасности

### 1. Настройка firewall
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 8000/tcp  # Backend
sudo ufw enable
```

### 2. Настройка Nginx (опционально)
```bash
# Создание конфига для фронтенда
sudo tee /etc/nginx/sites-available/jmsad-frontend << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Создание конфига для бэкенда
sudo tee /etc/nginx/sites-available/jmsad-backend << EOF
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

# Активация сайтов
sudo ln -s /etc/nginx/sites-available/jmsad-frontend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/jmsad-backend /etc/nginx/sites-enabled/

# Проверка конфига
sudo nginx -t

# Перезапуск Nginx
sudo systemctl restart nginx
```

### 3. SSL сертификаты (Let's Encrypt)
```bash
# Для фронтенда
sudo certbot --nginx -d your-domain.com

# Для API
sudo certbot --nginx -d api.your-domain.com
```

## 📊 Мониторинг и логирование

### 1. Создание скрипта мониторинга
```bash
cat > /home/jmsad/monitor.sh << 'EOF'
#!/bin/bash

echo "=== JMSAD Status Report ==="
echo "Date: $(date)"
echo ""

# Docker статус
echo "Docker Services:"
docker-compose -f /home/jmsad/jmsad/docker-compose.dev.yml ps
echo ""

# Использование ресурсов
echo "Resource Usage:"
docker stats --no-stream
echo ""

# Логи последних ошибок
echo "Recent Errors:"
docker-compose -f /home/jmsad/jmsad/docker-compose.dev.yml logs --tail=20 | grep -i error
echo ""

# Проверка доступности
echo "Service Health:"
curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:3000 || echo "Frontend: DOWN"
curl -s -o /dev/null -w "Backend: %{http_code}\n" http://localhost:8000 || echo "Backend: DOWN"
EOF

chmod +x /home/jmsad/monitor.sh
```

### 2. Настройка cron для автоматического мониторинга
```bash
# Добавление в crontab
(crontab -l 2>/dev/null; echo "*/15 * * * * /home/jmsad/monitor.sh >> /home/jmsad/monitor.log 2>&1") | crontab -
```

## 🔄 Автоматический деплой

### 1. Создание скрипта обновления
```bash
cat > /home/jmsad/update.sh << 'EOF'
#!/bin/bash

cd /home/jmsad/jmsad

echo "Updating JMSAD project..."
git pull origin main

echo "Rebuilding containers..."
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d --build

echo "Update completed!"
EOF

chmod +x /home/jmsad/update.sh
```

### 2. Настройка webhook для автоматического обновления
```bash
# Установка webhook
sudo apt install webhook -y

# Создание конфига webhook
sudo tee /etc/webhook.conf << EOF
{
  "hooks": [
    {
      "id": "jmsad-update",
      "execute-command": "/home/jmsad/update.sh",
      "command-working-directory": "/home/jmsad/jmsad"
    }
  ]
}
EOF

# Запуск webhook
sudo systemctl enable webhook
sudo systemctl start webhook
```

## 🚨 Устранение неполадок

### 1. Проблемы с Docker
```bash
# Очистка Docker
docker system prune -a
docker volume prune

# Перезапуск Docker
sudo systemctl restart docker
```

### 2. Проблемы с базой данных
```bash
# Проверка подключения
docker exec jmsad_postgres_dev psql -U jmsad_user -d jmsad_db -c "SELECT 1;"

# Сброс базы данных (осторожно!)
docker-compose -f docker-compose.dev.yml down
docker volume rm jmsad_postgres_data
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Проблемы с фронтендом
```bash
# Пересборка фронтенда
docker-compose -f docker-compose.dev.yml restart frontend

# Проверка логов
docker-compose -f docker-compose.dev.yml logs frontend
```

## 📈 Переход в продакшен

### 1. Подготовка продакшен окружения
```bash
# Остановка dev окружения
docker-compose -f docker-compose.dev.yml down

# Запуск production окружения
docker-compose -f docker-compose.prod.yml up -d --build
```

### 2. Настройка домена
```bash
# Обновление DNS записей на ps.kz
# A запись: your-domain.com -> your-vps-ip
# A запись: api.your-domain.com -> your-vps-ip
```

### 3. Финальная проверка
```bash
# Проверка всех сервисов
docker-compose -f docker-compose.prod.yml ps

# Проверка доступности
curl -I https://your-domain.com
curl -I https://api.your-domain.com
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `docker-compose logs [service]`
2. Проверьте статус: `docker-compose ps`
3. Запустите мониторинг: `./monitor.sh`
4. Обратитесь в поддержку ps.kz

## 🎯 Результат

После выполнения всех шагов у вас будет:
- ✅ Работающий JMSAD на VPS
- ✅ Автоматические обновления
- ✅ SSL сертификаты
- ✅ Мониторинг и логирование
- ✅ Готовность к продакшену
