#!/bin/bash

# Скрипт для управления JMSAD TEST приложением на VPS
# Разместить на VPS в директории ~/jmsad/

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="docker-compose.test.yml"
ENV_FILE="env.test"

echo "🧪 JMSAD TEST Management Script"
echo "📂 Директория проекта: $PROJECT_DIR"

# Функция для проверки статуса
check_status() {
    echo "📊 Проверка статуса контейнеров (TEST)..."
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "📋 Проверка логов (TEST)..."
    docker compose -f $COMPOSE_FILE logs --tail=10
}

# Функция для запуска
start_app() {
    echo "🚀 Запуск TEST приложения..."
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d
    echo "✅ TEST приложение запущено!"
    check_status
}

# Функция для остановки
stop_app() {
    echo "🛑 Остановка TEST приложения..."
    docker compose -f $COMPOSE_FILE down
    echo "✅ TEST приложение остановлено!"
}

# Функция для перезапуска
restart_app() {
    echo "🔄 Перезапуск TEST приложения..."
    stop_app
    sleep 2
    start_app
}

# Функция для просмотра логов
show_logs() {
    echo "📋 Логи TEST приложения (Ctrl+C для выхода)..."
    docker compose -f $COMPOSE_FILE logs -f
}

# Функция для обновления
update_app() {
    echo "📦 Обновление TEST приложения..."
    docker compose -f $COMPOSE_FILE pull
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d --build
    echo "✅ TEST приложение обновлено!"
}

# Функция для пересборки frontend
rebuild_frontend() {
    echo "🔨 Пересборка frontend контейнера (TEST)..."
    docker compose -f $COMPOSE_FILE stop frontend
    docker compose -f $COMPOSE_FILE build --no-cache frontend
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d frontend
    echo "✅ Frontend (TEST) пересобран и запущен!"
    check_status
}

# Функция для перезапуска frontend
restart_frontend() {
    echo "🔄 Перезапуск frontend контейнера (TEST)..."
    docker compose -f $COMPOSE_FILE restart frontend
    echo "✅ Frontend (TEST) перезапущен!"
    check_status
}

# Функция для очистки
cleanup() {
    echo "🧹 Очистка неиспользуемых ресурсов..."
    docker system prune -f
    docker volume prune -f
    echo "✅ Очистка завершена!"
}

# Функция для мониторинга
monitor() {
    echo "📊 Мониторинг ресурсов (Ctrl+C для выхода)..."
    watch -n 2 'docker stats --no-stream'
}

# Основное меню
case "${1:-help}" in
    start)
        start_app
        ;;
    stop)
        stop_app
        ;;
    restart)
        restart_app
        ;;
    status)
        check_status
        ;;
    logs)
        show_logs
        ;;
    update)
        update_app
        ;;
    rebuild-frontend)
        rebuild_frontend
        ;;
    restart-frontend)
        restart_frontend
        ;;
    cleanup)
        cleanup
        ;;
    monitor)
        monitor
        ;;
    help|*)
        echo "📋 Доступные команды (TEST):"
        echo "  start            - Запустить TEST приложение"
        echo "  stop             - Остановить TEST приложение"
        echo "  restart          - Перезапустить TEST приложение"
        echo "  status           - Показать статус TEST контейнеров"
        echo "  logs             - Показать логи TEST контейнеров"
        echo "  update           - Обновить TEST приложение"
        echo "  rebuild-frontend - Пересобрать frontend (TEST)"
        echo "  restart-frontend - Перезапустить frontend (TEST)"
        echo "  cleanup          - Очистить неиспользуемые ресурсы"
        echo "  monitor          - Мониторинг ресурсов"
        echo "  help             - Показать эту справку"
        echo ""
        echo "Примеры использования:"
        echo "  $0 start"
        echo "  $0 status"
        echo "  $0 logs"
        ;;
esac
