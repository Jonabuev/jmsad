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

---

## 🌐 Настройка домена arno.kz

После успешного деплоя на VPS (api.arno.kz), следующий этап - настройка основного домена arno.kz для работы с вашим сайтом.

### Шаг 1: Настройка DNS записей

1. **Войдите в панель управления доменом arno.kz**
   - Обычно это делается через регистратора домена или DNS провайдера

2. **Настройте A-записи:**
   ```
   Тип: A
   Имя: @ (или оставить пустым)
   Значение: IP_АДРЕС_VPS (где развернут api.arno.kz)
   TTL: 3600 (или минимальное значение)
   
   Тип: A  
   Имя: www
   Значение: IP_АДРЕС_VPS
   TTL: 3600
   ```

3. **Проверьте настройки DNS:**
   ```bash
   # Проверка A-записи
   nslookup arno.kz
   nslookup www.arno.kz
   
   # Или используйте онлайн сервисы:
   # https://dnschecker.org/
   # https://whatsmydns.net/
   ```

### Шаг 2: Обновление конфигурации Nginx

1. **Подключитесь к VPS:**
   ```bash
   ssh username@api.arno.kz
   cd ~/jmsad
   ```

2. **Отредактируйте nginx.conf:**
   ```bash
   nano nginx.conf
   ```

3. **Обновите server_name в конфигурации:**
   ```nginx
   server {
       listen 80;
       server_name arno.kz www.arno.kz api.arno.kz;
       
       # Остальная конфигурация остается без изменений
       location / {
           proxy_pass http://frontend:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
       
       location /api/ {
           proxy_pass http://backend:8000/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. **Перезапустите Nginx:**
   ```bash
   ./vps-management.sh restart
   ```

### Шаг 3: Настройка SSL сертификата (HTTPS)

1. **Установите Certbot:**
   ```bash
   sudo apt update
   sudo apt install certbot python3-certbot-nginx -y
   ```

2. **Получите SSL сертификат:**
   ```bash
   sudo certbot --nginx -d arno.kz -d www.arno.kz -d api.arno.kz
   ```

3. **Проверьте автоматическое обновление:**
   ```bash
   sudo certbot renew --dry-run
   ```

### Шаг 4: Обновление переменных окружения

1. **Отредактируйте env.vps:**
   ```bash
   nano env.vps
   ```

2. **Обновите доменные настройки:**
   ```env
   # Основной домен
   DOMAIN=arno.kz
   API_DOMAIN=api.arno.kz
   
   # CORS настройки
   CORS_ALLOWED_ORIGINS=https://arno.kz,https://www.arno.kz,https://api.arno.kz
   
   # Frontend настройки
   NEXT_PUBLIC_API_URL=https://api.arno.kz/api
   NEXT_PUBLIC_DOMAIN=arno.kz
   ```

3. **Пересоберите и перезапустите приложение:**
   ```bash
   ./vps-management.sh restart
   ```

### Шаг 5: Настройка Django для продакшена

1. **Обновите settings.py в backend:**
   ```python
   # Добавьте в ALLOWED_HOSTS
   ALLOWED_HOSTS = [
       'arno.kz',
       'www.arno.kz', 
       'api.arno.kz',
       'YOUR_VPS_IP'
   ]
   
   # Настройки для HTTPS
   SECURE_SSL_REDIRECT = True
   SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
   SESSION_COOKIE_SECURE = True
   CSRF_COOKIE_SECURE = True
   ```

2. **Пересоберите backend:**
   ```bash
   docker-compose -f docker-compose.vps.yml build backend
   ./vps-management.sh restart
   ```

### Шаг 6: Проверка работы

1. **Проверьте доступность сайта:**
   ```bash
   # HTTP (должен перенаправлять на HTTPS)
   curl -I http://arno.kz
   
   # HTTPS
   curl -I https://arno.kz
   
   # API
   curl -I https://api.arno.kz/api/
   ```

2. **Проверьте в браузере:**
   - https://arno.kz - основной сайт
   - https://www.arno.kz - с www
   - https://api.arno.kz/api/ - API

### Шаг 7: Настройка мониторинга

1. **Добавьте мониторинг домена:**
   ```bash
   # Создайте скрипт проверки
   cat > ~/jmsad/check-domain.sh << 'EOF'
   #!/bin/bash
   echo "Проверка домена arno.kz..."
   curl -s -o /dev/null -w "%{http_code}" https://arno.kz
   echo ""
   echo "Проверка API..."
   curl -s -o /dev/null -w "%{http_code}" https://api.arno.kz/api/
   echo ""
   EOF
   
   chmod +x ~/jmsad/check-domain.sh
   ```

2. **Добавьте в crontab для регулярной проверки:**
   ```bash
   crontab -e
   # Добавьте строку:
   */5 * * * * /home/username/jmsad/check-domain.sh >> /home/username/jmsad/domain-check.log
   ```

### Шаг 8: Настройка резервного копирования

1. **Обновите скрипт backup для включения SSL сертификатов:**
   ```bash
   # В vps-management.sh добавьте в функцию backup:
   echo "Backing up SSL certificates..."
   sudo cp -r /etc/letsencrypt ~/jmsad/backups/ssl-$(date +%Y%m%d_%H%M%S)
   ```

### Шаг 9: Финальная проверка

1. **Полная проверка всех компонентов:**
   ```bash
   ./vps-management.sh status
   ./check-domain.sh
   
   # Проверка SSL
   openssl s_client -connect arno.kz:443 -servername arno.kz
   ```

2. **Проверьте производительность:**
   ```bash
   # Нагрузочное тестирование
   ab -n 100 -c 10 https://arno.kz/
   ```

## 🎯 Результат

После выполнения всех этапов у вас будет:

- ✅ Домен arno.kz работает с HTTPS
- ✅ Автоматическое перенаправление с HTTP на HTTPS  
- ✅ Поддержка www и без www версий
- ✅ API доступно по api.arno.kz
- ✅ SSL сертификат с автообновлением
- ✅ Мониторинг доступности
- ✅ Резервное копирование включая SSL

## 🚨 Возможные проблемы и решения

### DNS не обновился
```bash
# Очистите DNS кэш
sudo systemctl flush-dns
# Или подождите до 24 часов для полного обновления
```

### SSL сертификат не получен
```bash
# Проверьте, что домен доступен по HTTP
curl http://arno.kz
# Убедитесь, что порт 80 открыт
sudo ufw allow 80/tcp
```

### CORS ошибки
```bash
# Проверьте настройки CORS в Django
# Убедитесь, что все домены добавлены в CORS_ALLOWED_ORIGINS
```

Теперь ваш сайт полностью готов к работе на домене arno.kz! 🎉