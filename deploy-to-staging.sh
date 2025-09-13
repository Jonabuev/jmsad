#!/bin/bash

# Скрипт для деплоя в staging среду
set -e

echo "🚀 Деплой в staging среду JMSAD..."

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
if [ ! -f ".env.staging" ]; then
    error "Файл .env.staging не найден. Создайте файл с переменными окружения для staging."
    exit 1
fi

# Загрузка переменных окружения
export $(cat .env.staging | grep -v '^#' | xargs)

# Остановка существующих контейнеров
log "Остановка существующих staging контейнеров..."
docker-compose -f docker-compose.staging.yml down --remove-orphans || true

# Сборка staging образов
log "Сборка staging образов..."
docker-compose -f docker-compose.staging.yml build --no-cache

# Запуск staging среды
log "Запуск staging среды..."
docker-compose -f docker-compose.staging.yml up -d

# Ожидание готовности сервисов
log "Ожидание готовности сервисов..."
sleep 60

# Проверка статуса контейнеров
log "Проверка статуса контейнеров..."
docker-compose -f docker-compose.staging.yml ps

# Проверка здоровья сервисов
log "Проверка здоровья сервисов..."

# Проверка бэкенда
if curl -f http://localhost:8001/health/ > /dev/null 2>&1; then
    success "Бэкенд staging работает!"
else
    error "Бэкенд staging недоступен!"
    docker-compose -f docker-compose.staging.yml logs backend_staging
    exit 1
fi

# Проверка фронтенда
if curl -f http://localhost:3001/ > /dev/null 2>&1; then
    success "Фронтенд staging работает!"
else
    error "Фронтенд staging недоступен!"
    docker-compose -f docker-compose.staging.yml logs frontend_staging
    exit 1
fi

# Проверка базы данных
log "Проверка подключения к базе данных..."
if docker-compose -f docker-compose.staging.yml exec -T postgres_staging pg_isready -U jmsad_staging_user -d jmsad_staging_db; then
    success "База данных staging работает!"
else
    error "База данных staging недоступна!"
    exit 1
fi

# Запуск миграций
log "Запуск миграций базы данных..."
docker-compose -f docker-compose.staging.yml exec -T backend_staging python manage.py migrate

# Сбор статических файлов
log "Сбор статических файлов..."
docker-compose -f docker-compose.staging.yml exec -T backend_staging python manage.py collectstatic --noinput

# Создание суперпользователя (если не существует)
log "Проверка суперпользователя..."
docker-compose -f docker-compose.staging.yml exec -T backend_staging python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superuser created')
else:
    print('Superuser already exists')
"

# Запуск финальных тестов в staging
log "Запуск финальных тестов в staging..."
if docker-compose -f docker-compose.staging.yml exec -T backend_staging python manage.py test --settings=myproject.staging_settings; then
    success "Staging тесты прошли успешно!"
else
    error "Staging тесты провалились!"
    docker-compose -f docker-compose.staging.yml logs backend_staging
    exit 1
fi

# Проверка API endpoints
log "Проверка API endpoints..."
API_ENDPOINTS=(
    "http://localhost:8001/api/auth/login/"
    "http://localhost:8001/api/houses/"
    "http://localhost:8001/api/complaints/"
)

for endpoint in "${API_ENDPOINTS[@]}"; do
    if curl -f "$endpoint" > /dev/null 2>&1; then
        success "API endpoint $endpoint доступен!"
    else
        warning "API endpoint $endpoint недоступен (это может быть нормально для защищенных endpoints)"
    fi
done

success "Staging среда развернута успешно!"
echo ""
echo "🌐 Staging URLs:"
echo "   - Frontend: http://localhost:3001"
echo "   - Backend API: http://localhost:8001"
echo "   - Admin Panel: http://localhost:8001/admin/"
echo ""
echo "👤 Admin credentials:"
echo "   - Username: admin"
echo "   - Password: admin123"
echo ""
echo "📊 Мониторинг:"
echo "   - Логи: docker-compose -f docker-compose.staging.yml logs -f"
echo "   - Статус: docker-compose -f docker-compose.staging.yml ps"
echo ""
echo "✅ Staging среда готова к тестированию!"
echo "🚀 После успешного тестирования можно деплоить в продакшен!"
