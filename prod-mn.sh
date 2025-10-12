#!/bin/bash

# Скрипт для управления JMSAD Production приложением на VPS
# Разместить в корне проекта: ~/Jmsad/

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="docker-compose.production.yml"

echo "🚀 JMSAD Production Management Script"
echo "📂 Project directory: $PROJECT_DIR"

# --- Функция для проверки статуса контейнеров ---
check_status() {
    echo "📊 Checking container status..."
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "📋 Last 10 log lines..."
    docker compose -f $COMPOSE_FILE logs --tail=10
}

# --- Запуск приложения ---
start_app() {
    echo "🚀 Starting JMSAD..."
    docker compose -f $COMPOSE_FILE --env-file .env up -d
    echo "✅ JMSAD started!"
    check_status
}

# --- Остановка приложения ---
stop_app() {
    echo "🛑 Stopping JMSAD..."
    docker compose -f $COMPOSE_FILE down
    echo "✅ JMSAD stopped!"
}

# --- Перезапуск приложения ---
restart_app() {
    echo "🔄 Restarting JMSAD..."
    stop_app
    sleep 2
    start_app
}

# --- Просмотр логов ---
show_logs() {
    echo "📋 Application logs (Ctrl+C to exit)..."
    docker compose -f $COMPOSE_FILE logs -f
}

# --- Обновление приложения ---
update_app() {
    echo "📦 Updating JMSAD..."
    docker compose -f $COMPOSE_FILE pull
    docker compose -f $COMPOSE_FILE --env-file .env up -d --build
    echo "✅ JMSAD updated!"
}

# --- Пересборка frontend ---
rebuild_frontend() {
    echo "🔨 Rebuilding frontend..."
    docker compose -f $COMPOSE_FILE stop frontend
    docker compose -f $COMPOSE_FILE build --no-cache frontend
    docker compose -f $COMPOSE_FILE --env-file .env up -d frontend
    echo "✅ Frontend rebuilt!"
    check_status
}

# --- Перезапуск frontend ---
restart_frontend() {
    echo "🔄 Restarting frontend..."
    docker compose -f $COMPOSE_FILE restart frontend
    echo "✅ Frontend restarted!"
    check_status
}

# --- Очистка Docker ресурсов ---
cleanup() {
    echo "🧹 Cleaning unused Docker resources..."
    docker system prune -f
    docker volume prune -f
    echo "✅ Cleanup complete!"
}

# --- Мониторинг ресурсов ---
monitor() {
    echo "📊 Monitoring resources (Ctrl+C to exit)..."
    watch -n 2 'docker stats --no-stream'
}

# --- Backup базы данных ---
backup_db() {
    echo "💾 Creating database backup..."
    BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).sql"
    mkdir -p backups
    docker exec jmsad_postgres_prod pg_dump -U jmsad_user jmsad_db > "$BACKUP_FILE"
    echo "✅ Backup created: $BACKUP_FILE"
}

# --- Восстановление базы данных ---
restore_db() {
    if [ -z "$1" ]; then
        echo "❌ Please specify backup file"
        echo "Usage: $0 restore backup_file.sql"
        exit 1
    fi

    echo "🔄 Restoring database from $1..."
    docker exec -i jmsad_postgres_prod psql -U jmsad_user jmsad_db < "$1"
    echo "✅ Database restored!"
}

# --- Главное меню ---
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
        echo "📋 Available commands:"
        echo "  start            - Start JMSAD production"
        echo "  stop             - Stop all containers"
        echo "  restart          - Restart all containers"
        echo "  status           - Show status"
        echo "  logs             - Show logs"
        echo "  update           - Pull and rebuild images"
        echo "  rebuild-frontend - Rebuild frontend only"
        echo "  restart-frontend - Restart frontend only"
        echo "  cleanup          - Prune unused Docker data"
        echo "  monitor          - Watch resource usage"
        echo "  backup           - Create database backup"
        echo "  restore          - Restore database from file"
        echo ""
        echo "Usage examples:"
        echo "  $0 start"
        echo "  $0 logs"
        echo "  $0 backup"
        echo "  $0 restore backups/backup_20250101_120000.sql"
        ;;
esac
