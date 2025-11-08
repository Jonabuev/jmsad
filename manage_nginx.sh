#!/bin/bash

# Скрипт для управления JMSAD Production
# Использует dc.prod.yml

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="dc.nginx.yml"
ENV_FILE=".env"

echo "🚀 JMSAD Production Management Script"
echo "📂 Project directory: $PROJECT_DIR"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# --- Проверка статуса ---
check_status() {
    echo -e "${YELLOW}📊 Checking production containers...${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "jmsad_(backend_prod|frontend_prod|postgres_prod|redis)"
    echo ""
    echo -e "${YELLOW}💾 Database status:${NC}"
    docker exec jmsad_postgres_prod pg_isready -U ${DB_USER:-jmsad_user} || echo "Database not ready"
    echo ""
    echo -e "${YELLOW}📋 Recent logs:${NC}"
    docker compose -f $COMPOSE_FILE logs --tail=10
}

# --- Запуск ---
start_app() {
    echo -e "${GREEN}🚀 Starting JMSAD Production...${NC}"
    
    # Проверка .env файла
    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${RED}❌ Error: $ENV_FILE not found!${NC}"
        exit 1
    fi
    
    # Создание сети если не существует
    docker network inspect jmsad-network >/dev/null 2>&1 || docker network create jmsad-network
    
    # Запуск контейнеров
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d
    
    echo "⏳ Waiting for database to be ready..."
    sleep 10
    
    # Миграции
    echo "⚙️ Applying Django migrations..."
    docker exec jmsad_backend_prod python manage.py migrate --noinput || echo "Migration failed"
    
    # Сбор статики
    echo "📦 Collecting static files..."
    docker exec jmsad_backend_prod python manage.py collectstatic --noinput || echo "Collectstatic failed"
    
    echo -e "${GREEN}✅ JMSAD Production started!${NC}"
    check_status
}

# --- Остановка ---
stop_app() {
    echo -e "${YELLOW}🛑 Stopping JMSAD Production...${NC}"
    docker compose -f $COMPOSE_FILE down
    echo -e "${GREEN}✅ JMSAD Production stopped!${NC}"
}

# --- Перезапуск ---
restart_app() {
    echo -e "${YELLOW}🔄 Restarting JMSAD Production...${NC}"
    stop_app
    sleep 3
    start_app
}

# --- Логи ---
show_logs() {
    SERVICE="${2:-}"
    if [ -z "$SERVICE" ]; then
        echo "📋 All production logs (Ctrl+C to exit)..."
        docker compose -f $COMPOSE_FILE logs -f
    else
        echo "📋 Logs for $SERVICE (Ctrl+C to exit)..."
        docker compose -f $COMPOSE_FILE logs -f $SERVICE
    fi
}

# --- Обновление с пересборкой ---
update_app() {
    echo -e "${YELLOW}📦 Updating JMSAD Production...${NC}"
    
    # Backup перед обновлением
    echo "💾 Creating backup before update..."
    backup_db
    
    # Pull новых образов
    docker compose -f $COMPOSE_FILE pull
    
    # Пересборка и запуск
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d --build
    
    # Миграции
    echo "⚙️ Running migrations..."
    docker exec jmsad_backend_prod python manage.py migrate --noinput
    
    # Статика
    echo "📦 Collecting static..."
    docker exec jmsad_backend_prod python manage.py collectstatic --noinput
    
    echo -e "${GREEN}✅ JMSAD Production updated!${NC}"
    check_status
}

# --- Пересборка backend ---
rebuild_backend() {
    echo -e "${YELLOW}🔨 Rebuilding production backend...${NC}"
    docker compose -f $COMPOSE_FILE stop backend
    docker compose -f $COMPOSE_FILE build --no-cache backend
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d backend
    
    echo "⚙️ Running migrations..."
    docker exec jmsad_backend_prod python manage.py migrate --noinput
    
    echo -e "${GREEN}✅ Backend rebuilt!${NC}"
    check_status
}

# --- Пересборка frontend ---
rebuild_frontend() {
    echo -e "${YELLOW}🔨 Rebuilding production frontend...${NC}"
    docker compose -f $COMPOSE_FILE stop frontend
    docker compose -f $COMPOSE_FILE build --no-cache frontend
    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d frontend
    
    echo -e "${GREEN}✅ Frontend rebuilt!${NC}"
    check_status
}

# --- Перезапуск отдельного сервиса ---
restart_service() {
    SERVICE="$2"
    if [ -z "$SERVICE" ]; then
        echo -e "${RED}❌ Please specify service: backend, frontend, postgres, redis${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}🔄 Restarting $SERVICE...${NC}"
    docker compose -f $COMPOSE_FILE restart $SERVICE
    echo -e "${GREEN}✅ $SERVICE restarted!${NC}"
}

# --- Backup базы данных ---
backup_db() {
    echo -e "${YELLOW}💾 Creating production database backup...${NC}"
    BACKUP_DIR="backups"
    BACKUP_FILE="$BACKUP_DIR/prod_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    mkdir -p $BACKUP_DIR
    
    docker exec jmsad_postgres_prod pg_dump -U ${DB_USER:-jmsad_user} ${DB_NAME:-jmsad_db} > "$BACKUP_FILE"
    
    # Сжатие
    gzip "$BACKUP_FILE"
    
    echo -e "${GREEN}✅ Backup created: ${BACKUP_FILE}.gz${NC}"
    
    # Удаление старых бэкапов (старше 30 дней)
    find $BACKUP_DIR -name "prod_backup_*.sql.gz" -mtime +30 -delete
    echo "🧹 Old backups cleaned (>30 days)"
}

# --- Восстановление базы ---
restore_db() {
    BACKUP_FILE="$2"
    
    if [ -z "$BACKUP_FILE" ]; then
        echo -e "${RED}❌ Please specify backup file${NC}"
        echo "Usage: $0 restore backups/prod_backup_YYYYMMDD_HHMMSS.sql.gz"
        exit 1
    fi
    
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}❌ Backup file not found: $BACKUP_FILE${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}⚠️  WARNING: This will overwrite production database!${NC}"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo "❌ Restore cancelled"
        exit 0
    fi
    
    echo "🔄 Restoring database from $BACKUP_FILE..."
    
    # Распаковка если .gz
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        gunzip -c "$BACKUP_FILE" | docker exec -i jmsad_postgres_prod psql -U ${DB_USER:-jmsad_user} ${DB_NAME:-jmsad_db}
    else
        docker exec -i jmsad_postgres_prod psql -U ${DB_USER:-jmsad_user} ${DB_NAME:-jmsad_db} < "$BACKUP_FILE"
    fi
    
    echo -e "${GREEN}✅ Database restored!${NC}"
}

# --- Django команды ---
django_shell() {
    echo "🐍 Opening Django shell..."
    docker exec -it jmsad_backend_prod python manage.py shell
}

django_createsuperuser() {
    echo "👤 Creating Django superuser..."
    docker exec -it jmsad_backend_prod python manage.py createsuperuser
}

django_command() {
    COMMAND="$2"
    if [ -z "$COMMAND" ]; then
        echo -e "${RED}❌ Please specify Django command${NC}"
        echo "Usage: $0 django 'command args'"
        exit 1
    fi
    
    echo "⚙️ Running: python manage.py $COMMAND"
    docker exec -it jmsad_backend_prod python manage.py $COMMAND
}

# --- Мониторинг ---
monitor() {
    echo "📊 Monitoring production resources (Ctrl+C to exit)..."
    watch -n 2 'docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | grep -E "jmsad_(backend_prod|frontend_prod|postgres_prod|redis)"'
}

# --- Очистка ---
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning unused Docker resources...${NC}"
    docker system prune -f
    docker volume prune -f
    echo -e "${GREEN}✅ Cleanup complete!${NC}"
}

# --- Health check ---
health_check() {
    echo -e "${YELLOW}🏥 Running health checks...${NC}"
    
    # Backend
    echo "Checking backend..."
    BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health/ 2>/dev/null || echo "000")
    if [ "$BACKEND_STATUS" == "200" ]; then
        echo -e "${GREEN}✅ Backend: OK${NC}"
    else
        echo -e "${RED}❌ Backend: FAILED (HTTP $BACKEND_STATUS)${NC}"
    fi
    
    # Frontend
    echo "Checking frontend..."
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000")
    if [ "$FRONTEND_STATUS" == "200" ]; then
        echo -e "${GREEN}✅ Frontend: OK${NC}"
    else
        echo -e "${RED}❌ Frontend: FAILED (HTTP $FRONTEND_STATUS)${NC}"
    fi
    
    # Database
    echo "Checking database..."
    if docker exec jmsad_postgres_prod pg_isready -U ${DB_USER:-jmsad_user} > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database: OK${NC}"
    else
        echo -e "${RED}❌ Database: FAILED${NC}"
    fi
    
    # Redis
    echo "Checking Redis..."
    if docker exec jmsad_redis_prod redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis: OK${NC}"
    else
        echo -e "${RED}❌ Redis: FAILED${NC}"
    fi
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
    restart-service)
        restart_service "$@"
        ;;
    status)
        check_status
        ;;
    logs)
        show_logs "$@"
        ;;
    update)
        update_app
        ;;
    rebuild-backend)
        rebuild_backend
        ;;
    rebuild-frontend)
        rebuild_frontend
        ;;
    backup)
        backup_db
        ;;
    restore)
        restore_db "$@"
        ;;
    shell)
        django_shell
        ;;
    createsuperuser)
        django_createsuperuser
        ;;
    django)
        django_command "$@"
        ;;
    monitor)
        monitor
        ;;
    health)
        health_check
        ;;
    cleanup)
        cleanup
        ;;
    help|*)
        echo "📋 JMSAD Production Management Commands:"
        echo ""
        echo "  ${GREEN}start${NC}                    - Start production environment"
        echo "  ${GREEN}stop${NC}                     - Stop all production containers"
        echo "  ${GREEN}restart${NC}                  - Restart all containers"
        echo "  ${GREEN}restart-service SERVICE${NC}  - Restart specific service (backend/frontend/postgres/redis)"
        echo "  ${GREEN}status${NC}                   - Show container status"
        echo "  ${GREEN}logs [SERVICE]${NC}           - Show logs (all or specific service)"
        echo "  ${GREEN}update${NC}                   - Pull, rebuild and restart (with backup)"
        echo "  ${GREEN}rebuild-backend${NC}          - Rebuild backend only"
        echo "  ${GREEN}rebuild-frontend${NC}         - Rebuild frontend only"
        echo "  ${GREEN}backup${NC}                   - Create database backup"
        echo "  ${GREEN}restore FILE${NC}             - Restore database from backup"
        echo "  ${GREEN}shell${NC}                    - Open Django shell"
        echo "  ${GREEN}createsuperuser${NC}          - Create Django superuser"
        echo "  ${GREEN}django 'command'${NC}         - Run Django management command"
        echo "  ${GREEN}monitor${NC}                  - Watch resource usage"
        echo "  ${GREEN}health${NC}                   - Run health checks"
        echo "  ${GREEN}cleanup${NC}                  - Clean unused Docker resources"
        echo ""
        echo "Usage examples:"
        echo "  $0 start"
        echo "  $0 logs backend"
        echo "  $0 restart-service frontend"
        echo "  $0 backup"
        echo "  $0 restore backups/prod_backup_20250108_120000.sql.gz"
        echo "  $0 django 'makemigrations'"
        ;;
esac