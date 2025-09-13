#!/bin/bash

# Скрипт для запуска всех тестов проекта
set -e

echo "🧪 Запуск тестовой среды JMSAD..."

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

# Остановка существующих контейнеров
log "Остановка существующих контейнеров..."
docker-compose -f docker-compose.test.yml down --remove-orphans || true

# Сборка и запуск тестовой среды
log "Сборка тестовых контейнеров..."
docker-compose -f docker-compose.test.yml build

log "Запуск тестовой среды..."
docker-compose -f docker-compose.test.yml up -d

# Ожидание готовности сервисов
log "Ожидание готовности сервисов..."
sleep 30

# Проверка статуса контейнеров
log "Проверка статуса контейнеров..."
docker-compose -f docker-compose.test.yml ps

# Запуск тестов бэкенда
log "Запуск тестов бэкенда..."
if docker-compose -f docker-compose.test.yml exec -T backend_test python manage.py test --settings=myproject.test_settings; then
    success "Тесты бэкенда прошли успешно!"
else
    error "Тесты бэкенда провалились!"
    docker-compose -f docker-compose.test.yml logs backend_test
    exit 1
fi

# Запуск тестов фронтенда
log "Запуск тестов фронтенда..."
if docker-compose -f docker-compose.test.yml exec -T frontend_test npm test -- --coverage --watchAll=false; then
    success "Тесты фронтенда прошли успешно!"
else
    error "Тесты фронтенда провалились!"
    docker-compose -f docker-compose.test.yml logs frontend_test
    exit 1
fi

# Проверка покрытия кода
log "Проверка покрытия кода..."
docker-compose -f docker-compose.test.yml exec -T backend_test python manage.py test --settings=myproject.test_settings --coverage
docker-compose -f docker-compose.test.yml exec -T frontend_test npm run test:coverage

# Генерация отчетов
log "Генерация отчетов о тестах..."
mkdir -p test-reports

# Копирование отчетов из контейнеров
docker-compose -f docker-compose.test.yml exec -T backend_test python -c "
import coverage
import os
cov = coverage.Coverage()
cov.load()
cov.html_report(directory='/app/test-reports/backend-coverage')
print('Backend coverage report generated')
"

docker-compose -f docker-compose.test.yml exec -T frontend_test cp -r coverage/ /app/test-reports/frontend-coverage/ || true

# Остановка тестовой среды
log "Остановка тестовой среды..."
docker-compose -f docker-compose.test.yml down

success "Все тесты завершены! Отчеты сохранены в папке test-reports/"

# Вывод статистики
log "Статистика тестов:"
echo "📊 Отчеты о покрытии кода:"
echo "   - Бэкенд: test-reports/backend-coverage/index.html"
echo "   - Фронтенд: test-reports/frontend-coverage/index.html"
echo ""
echo "✅ Тестовая среда настроена и работает корректно!"
echo "🚀 Готово к деплою в продакшен!"
