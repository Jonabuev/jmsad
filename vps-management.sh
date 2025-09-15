#!/bin/bash

# Скрипт для управления JMSAD приложением на VPS
# Разместить на VPS в директории ~/jmsad/

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="docker-compose.vps.yml"

echo "🚀 JMSAD VPS Management Script"
echo "📂 Директория проекта: $PROJECT_DIR"

# Функция для проверки статуса
check_status() {
    echo "📊 Проверка статуса контейнеров..."
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "📋 Проверка логов..."
    docker compose -f $COMPOSE_FILE logs --tail=10
}

# Функция для запуска
start_app() {
    echo "🚀 Запуск приложения..."
    docker compose -f $COMPOSE_FILE --env-file .env up -d
    echo "✅ Приложение запущено!"
    check_status
}

# Функция для остановки
stop_app() {
    echo "🛑 Остановка приложения..."
    docker compose -f $COMPOSE_FILE down
    echo "✅ Приложение остановлено!"
}

# Функция для перезапуска
restart_app() {
    echo "🔄 Перезапуск приложения..."
    stop_app
    sleep 2
    start_app
}

# Функция для просмотра логов
show_logs() {
    echo "📋 Логи приложения (Ctrl+C для выхода)..."
    docker compose -f $COMPOSE_FILE logs -f
}

# Функция для обновления
update_app() {
    echo "📦 Обновление приложение..."
    docker compose -f $COMPOSE_FILE pull
    docker compose -f $COMPOSE_FILE --env-file .env up -d --build
    echo "✅ Приложение обновлено!"
}

# Функция для пересборки frontend
rebuild_frontend() {
    echo "🔨 Пересборка frontend контейнера..."
    docker compose -f $COMPOSE_FILE stop frontend
    docker compose -f $COMPOSE_FILE build --no-cache frontend
    docker compose -f $COMPOSE_FILE --env-file .env up -d frontend
    echo "✅ Frontend пересобран и запущен!"
    check_status
}

# Функция для перезапуска frontend
restart_frontend() {
    echo "🔄 Перезапуск frontend контейнера..."
    docker compose -f $COMPOSE_FILE restart frontend
    echo "✅ Frontend перезапущен!"
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

# Функция для backup базы данных
backup_db() {
    echo "💾 Создание backup базы данных..."
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    docker exec jmsad_postgres_vps pg_dump -U jmsad_user jmsad_db > "$BACKUP_FILE"
    echo "✅ Backup создан: $BACKUP_FILE"
}

# Функция для восстановления базы данных
restore_db() {
    if [ -z "$1" ]; then
        echo "❌ Укажите файл для восстановления"
        echo "Использование: $0 restore_db backup_file.sql"
        exit 1
    fi
    
    echo "🔄 Восстановление базы данных из $1..."
    docker exec -i jmsad_postgres_vps psql -U jmsad_user jmsad_db < "$1"
    echo "✅ База данных восстановлена!"
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
    backup)
        backup_db
        ;;
    restore)
        restore_db "$2"
        ;;
    help|*)
        echo "📋 Доступные команды:"
        echo "  start           - Запустить приложение"
        echo "  stop            - Остановить приложение"
        echo "  restart         - Перезапустить приложение"
        echo "  status          - Показать статус"
        echo "  logs            - Показать логи"
        echo "  update          - Обновить приложение"
        echo "  rebuild-frontend - Пересобрать frontend контейнер"
        echo "  restart-frontend - Перезапустить frontend контейнер"
        echo "  cleanup         - Очистить неиспользуемые ресурсы"
        echo "  monitor         - Мониторинг ресурсов"
        echo "  backup          - Создать backup базы данных"
        echo "  restore         - Восстановить базу данных"
        echo "  help            - Показать эту справку"
        echo ""
        echo "Примеры использования:"
        echo "  $0 start"
        echo "  $0 status"
        echo "  $0 logs"
        echo "  $0 backup"
        echo "  $0 restore backup_20241201_120000.sql"
        ;;
esac
