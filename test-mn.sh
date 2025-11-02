#!/bin/bash

# Скрипт для управления JMSAD Test приложением
# Разместить в корне проекта: ~/Jmsad/
# Использует docker-compose.test.yml

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="docker-compose.vps.yml"
ENV_FILE=".env.test"

echo "🧪 JMSAD Test Environment Management Script"
echo "📂 Project directory: $PROJECT_DIR"

# --- Проверка статуса контейнеров ---
check_status() {
    echo "📊 Checking container status..."
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep jmsad_
    echo ""
    echo "📋 Last 10 log lines..."
    docker compose -f $COMPOSE_FILE logs --tail=10
}

# --- Запуск тестового приложения ---
start_app() {
    echo "🚀 Starting JMSAD Test Environment..."
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d

    echo "⚙️ Applying Django migrations..."
    docker exec jmsad_backend_test python manage.py migrate --noinput

    echo "✅ JMSAD Test started!"
    check_status
}


# --- Остановка ---
stop_app() {
    echo "🛑 Stopping JMSAD Test..."
    docker compose -f $COMPOSE_FILE down
    echo "✅ JMSAD Test stopped!"
}

# --- Перезапуск ---
restart_app() {
    echo "🔄 Restarting JMSAD Test..."
    stop_app
    sleep 2
    start_app
}

# --- Просмотр логов ---
show_logs() {
    echo "📋 Application logs (Ctrl+C to exit)..."
    docker compose -f $COMPOSE_FILE logs -f
}

# --- Обновление (pull + rebuild) ---
update_app() {
    echo "📦 Updating JMSAD Test..."
    docker compose -f $COMPOSE_FILE pull
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d --build
    echo "✅ JMSAD Test updated!"
}

# --- Пересборка frontend ---
rebuild_frontend() {
    echo "🔨 Rebuilding frontend (test)..."
    docker compose -f $COMPOSE_FILE stop frontend
    docker compose -f $COMPOSE_FILE build --no-cache frontend
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d frontend
    echo "✅ Frontend rebuilt!"
    check_status
}

# --- Перезапуск frontend ---
restart_frontend() {
    echo "🔄 Restarting frontend (test)..."
    docker compose -f $COMPOSE_FILE restart frontend
    echo "✅ Frontend restarted!"
    check_status
}

# --- Очистка ресурсов ---
cleanup() {
    echo "🧹 Cleaning unused Docker resources..."
    docker system prune -f
    docker volume prune -f
    echo "✅ Cleanup complete!"
}

# --- Мониторинг ресурсов ---
monitor() {
    echo "📊 Monitoring resources (Ctrl+C to exit)..."
    watch -n 2 'docker stats --no-stream | grep jmsad_'
}

# --- Backup базы данных ---
backup_db() {
    echo "💾 Creating test database backup..."
    BACKUP_FILE="backups_test/backup_$(date +%Y%m%d_%H%M%S).sql"
    mkdir -p backups_test
    docker exec jmsad_postgres_test pg_dump -U jmsad_user_test jmsad_db_test > "$BACKUP_FILE"
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
    docker exec -i jmsad_postgres_test psql -U jmsad_user_test jmsad_db_test < "$1"
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
        echo "  start            - Start JMSAD test environment"
        echo "  stop             - Stop all containers"
        echo "  restart          - Restart all containers"
        echo "  status           - Show container status"
        echo "  logs             - Show logs"
        echo "  update           - Pull and rebuild images"
        echo "  rebuild-frontend - Rebuild frontend only"
        echo "  restart-frontend - Restart frontend only"
        echo "  cleanup          - Prune unused Docker data"
        echo "  monitor          - Watch resource usage"
        echo "  backup           - Create DB backup"
        echo "  restore FILE     - Restore DB from file"
        echo ""
        echo "Usage examples:"
        echo "  $0 start"
        echo "  $0 logs"
        echo "  $0 backup"
        echo "  $0 restore backups_test/backup_20250101_120000.sql"
        ;;
esac
