#!/bin/bash

# Скрипт для деплоя в продакшен среду
set -e

echo "🚀 Деплой в продакшен среду JMSAD..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    error "Docker не установлен. Пожалуйста, установите Docker."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose не установлен. Пожалуйста, установите Docker Compose."
    exit 1
fi

# Проверка наличия переменных окружения
if [ ! -f ".env.production" ]; then
    error "Файл .env.production не найден. Создайте файл с переменными окружения для продакшена."
    exit 1
fi

# Подтверждение деплоя
echo ""
warning "⚠️  ВНИМАНИЕ: Вы собираетесь деплоить в ПРОДАКШЕН среду!"
echo "Это действие может повлиять на работу живого сайта."
echo ""
read -p "Вы уверены, что хотите продолжить? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    log "Деплой отменен пользователем."
    exit 0
fi

# Загрузка переменных окружения
export $(cat .env.production | grep -v '^#' | xargs)

# Создание бэкапа базы данных
log "Создание бэкапа базы данных..."
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

if docker-compose -f docker-compose.prod.yml exec -T postgres_prod pg_dump -U jmsad_user -d jmsad_db > "$BACKUP_DIR/database_backup.sql"; then
    success "Бэкап базы данных создан: $BACKUP_DIR/database_backup.sql"
else
    error "Не удалось создать бэкап базы данных!"
    exit 1
fi

# Остановка существующих контейнеров
log "Остановка существующих продакшен контейнеров..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# Сборка продакшен образов
log "Сборка продакшен образов..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Запуск продакшен среды
log "Запуск продакшен среды..."
docker-compose -f docker-compose.prod.yml up -d

# Ожидание готовности сервисов
log "Ожидание готовности сервисов..."
sleep 60

# Проверка статуса контейнеров
log "Проверка статуса контейнеров..."
docker-compose -f docker-compose.prod.yml ps

# Проверка здоровья сервисов
log "Проверка здоровья сервисов..."

# Проверка бэкенда
if curl -f https://api.arno.kz/health/ > /dev/null 2>&1; then
    success "Бэкенд продакшен работает!"
else
    error "Бэкенд продакшен недоступен!"
    docker-compose -f docker-compose.prod.yml logs backend_prod
    exit 1
fi

# Проверка фронтенда
if curl -f https://arno.kz/ > /dev/null 2>&1; then
    success "Фронтенд продакшен работает!"
else
    error "Фронтенд продакшен недоступен!"
    docker-compose -f docker-compose.prod.yml logs frontend_prod
    exit 1
fi

# Проверка базы данных
log "Проверка подключения к базе данных..."
if docker-compose -f docker-compose.prod.yml exec -T postgres_prod pg_isready -U jmsad_user -d jmsad_db; then
    success "База данных продакшен работает!"
else
    error "База данных продакшен недоступна!"
    exit 1
fi

# Запуск миграций
log "Запуск миграций базы данных..."
docker-compose -f docker-compose.prod.yml exec -T backend_prod python manage.py migrate

# Сбор статических файлов
log "Сбор статических файлов..."
docker-compose -f docker-compose.prod.yml exec -T backend_prod python manage.py collectstatic --noinput

# Проверка API endpoints
log "Проверка API endpoints..."
API_ENDPOINTS=(
    "https://api.arno.kz/api/auth/login/"
    "https://api.arno.kz/api/houses/"
    "https://api.arno.kz/api/complaints/"
)

for endpoint in "${API_ENDPOINTS[@]}"; do
    if curl -f "$endpoint" > /dev/null 2>&1; then
        success "API endpoint $endpoint доступен!"
    else
        warning "API endpoint $endpoint недоступен (это может быть нормально для защищенных endpoints)"
    fi
done

# Проверка SSL сертификатов
log "Проверка SSL сертификатов..."
if openssl s_client -connect arno.kz:443 -servername arno.kz < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
    success "SSL сертификат валиден!"
else
    warning "Проблемы с SSL сертификатом!"
fi

# Мониторинг производительности
log "Проверка производительности..."
if curl -w "@curl-format.txt" -o /dev/null -s https://arno.kz/ > performance.log 2>&1; then
    success "Проверка производительности завершена!"
    echo "Результаты сохранены в performance.log"
else
    warning "Не удалось проверить производительность!"
fi

success "Продакшен среда развернута успешно!"
echo ""
echo "🌐 Production URLs:"
echo "   - Frontend: https://arno.kz"
echo "   - Backend API: https://api.arno.kz"
echo "   - Admin Panel: https://api.arno.kz/admin/"
echo ""
echo "📊 Мониторинг:"
echo "   - Логи: docker-compose -f docker-compose.prod.yml logs -f"
echo "   - Статус: docker-compose -f docker-compose.prod.yml ps"
echo "   - Производительность: cat performance.log"
echo ""
echo "💾 Бэкапы:"
echo "   - База данных: $BACKUP_DIR/database_backup.sql"
echo ""
echo "✅ Продакшен среда обновлена успешно!"
echo "🎉 Сайт готов к работе!"

# Отправка уведомления (опционально)
if command -v curl &> /dev/null && [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    log "Отправка уведомления о деплое..."
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚀 JMSAD успешно развернут в продакшен! https://arno.kz\"}" \
        "$SLACK_WEBHOOK_URL" || warning "Не удалось отправить уведомление"
fi
