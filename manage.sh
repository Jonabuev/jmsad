#!/bin/bash

# Главный скрипт управления JMSAD
# Управляет всеми компонентами: prod, test, nginx

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${MAGENTA}"
echo "╔════════════════════════════════════════╗"
echo "║     JMSAD Management System v1.0       ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# --- Проверка всей системы ---
check_all() {
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${YELLOW}📊 SYSTEM STATUS${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    
    echo ""
    echo -e "${BLUE}🚀 PRODUCTION:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "jmsad_(backend_prod|frontend_prod|postgres_prod|redis)" || echo "  No production containers running"
    
    echo ""
    echo -e "${BLUE}🧪 TEST:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "jmsad_(backend_test|frontend_test|postgres_test)" || echo "  No test containers running"
    
    echo ""
    echo -e "${BLUE}🌐 NGINX:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "jmsad_nginx|jmsad_certbot" || echo "  Nginx not running"
    
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
}

# --- Запуск всей системы ---
start_all() {
    echo -e "${GREEN}🚀 Starting JMSAD Full Stack...${NC}"
    echo ""
    
    echo -e "${BLUE}Step 1/3: Starting Production...${NC}"
    ./manage_prod.sh start
    echo ""
    
    echo -e "${BLUE}Step 2/3: Starting Test...${NC}"
    ./manage_test.sh start
    echo ""
    
    echo -e "${BLUE}Step 3/3: Starting Nginx...${NC}"
    ./manage_nginx.sh start
    echo ""
    
    echo -e "${GREEN}✅ Full stack started!${NC}"
    check_all
}

# --- Остановка всей системы ---
stop_all() {
    echo -e "${YELLOW}🛑 Stopping JMSAD Full Stack...${NC}"
    echo ""
    
    echo -e "${BLUE}Step 1/3: Stopping Nginx...${NC}"
    ./manage_nginx.sh stop
    echo ""
    
    echo -e "${BLUE}Step 2/3: Stopping Test...${NC}"
    ./manage_test.sh stop
    echo ""
    
    echo -e "${BLUE}Step 3/3: Stopping Production...${NC}"
    ./manage_prod.sh stop
    echo ""
    
    echo -e "${GREEN}✅ Full stack stopped!${NC}"
}

# --- Перезапуск всей системы ---
restart_all() {
    echo -e "${YELLOW}🔄 Restarting JMSAD Full Stack...${NC}"
    stop_all
    sleep 5
    start_all
}

# --- Быстрый доступ к логам ---
logs_menu() {
    echo -e "${YELLOW}📋 Select logs to view:${NC}"
    echo ""
    echo "  1) Production Backend"
    echo "  2) Production Frontend"
    echo "  3) Test Backend"
    echo "  4) Test Frontend"
    echo "  5) Nginx Access Logs"
    echo "  6) Nginx Error Logs"
    echo "  7) All Production"
    echo "  8) All Test"
    echo "  9) Exit"
    echo ""
    read -p "Choose (1-9): " choice
    
    case $choice in
        1) docker logs -f jmsad_backend_prod ;;
        2) docker logs -f jmsad_frontend_prod ;;
        3) docker logs -f jmsad_backend_test ;;
        4) docker logs -f jmsad_frontend_test ;;
        5) ./manage_nginx.sh logs access ;;
        6) ./manage_nginx.sh logs error ;;
        7) docker compose -f dc.prod.yml logs -f ;;
        8) docker compose -f dc.test.yml logs -f ;;
        9) exit 0 ;;
        *) echo "Invalid choice" ;;
    esac
}

# --- Backup всех баз ---
backup_all() {
    echo -e "${YELLOW}💾 Creating backups for all databases...${NC}"
    echo ""
    
    echo "📦 Production backup..."
    ./manage_prod.sh backup
    echo ""
    
    echo "📦 Test backup..."
    ./manage_test.sh backup
    echo ""
    
    echo -e "${GREEN}✅ All backups created!${NC}"
}

# --- Обновление всей системы ---
update_all() {
    echo -e "${YELLOW}📦 Updating JMSAD Full Stack...${NC}"
    echo ""
    
    # Backup перед обновлением
    echo "💾 Creating safety backups..."
    backup_all
    echo ""
    
    echo -e "${BLUE}Updating Production...${NC}"
    ./manage_prod.sh update
    echo ""
    
    echo -e "${BLUE}Updating Test...${NC}"
    ./manage_test.sh update
    echo ""
    
    echo -e "${BLUE}Reloading Nginx...${NC}"
    ./manage_nginx.sh reload
    echo ""
    
    echo -e "${GREEN}✅ Full stack updated!${NC}"
    check_all
}

# --- Health check всей системы ---
health_all() {
    echo -e "${YELLOW}🏥 Running full system health check...${NC}"
    echo ""
    
    echo -e "${BLUE}🚀 Production Health:${NC}"
    ./manage_prod.sh health
    echo ""
    
    echo -e "${BLUE}🧪 Test Health:${NC}"
    ./manage_test.sh health
    echo ""
    
    echo -e "${BLUE}🌐 Nginx Status:${NC}"
    ./manage_nginx.sh status
    echo ""
    
    echo -e "${BLUE}🌐 Domain Accessibility:${NC}"
    ./manage_nginx.sh test-domains
}

# --- Мониторинг ресурсов ---
monitor_all() {
    echo -e "${YELLOW}📊 System Resource Monitor${NC}"
    echo -e "${CYAN}Press Ctrl+C to exit${NC}"
    echo ""
    
    watch -n 2 'docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | grep jmsad_'
}

# --- Быстрая перезагрузка frontend (для разработки) ---
quick_frontend() {
    echo -e "${YELLOW}🔄 Quick Frontend Reload${NC}"
    echo ""
    echo "1) Production Frontend"
    echo "2) Test Frontend"
    echo "3) Both"
    echo ""
    read -p "Choose (1-3): " choice
    
    case $choice in
        1)
            ./manage_prod.sh rebuild-frontend
            ;;
        2)
            ./manage_test.sh rebuild-frontend
            ;;
        3)
            ./manage_prod.sh rebuild-frontend
            ./manage_test.sh rebuild-frontend
            ;;
        *)
            echo "Invalid choice"
            ;;
    esac
}

# --- Быстрая перезагрузка backend ---
quick_backend() {
    echo -e "${YELLOW}🔄 Quick Backend Reload${NC}"
    echo ""
    echo "1) Production Backend"
    echo "2) Test Backend"
    echo "3) Both"
    echo ""
    read -p "Choose (1-3): " choice
    
    case $choice in
        1)
            ./manage_prod.sh rebuild-backend
            ;;
        2)
            ./manage_test.sh rebuild-backend
            ;;
        3)
            ./manage_prod.sh rebuild-backend
            ./manage_test.sh rebuild-backend
            ;;
        *)
            echo "Invalid choice"
            ;;
    esac
}

# --- Информация о системе ---
show_info() {
    echo -e "${CYAN}════════════════════════════════════════${NC}"
    echo -e "${MAGENTA}📋 JMSAD System Information${NC}"
    echo -e "${CYAN}════════════════════════════════════════${NC}"
    echo ""
    
    echo -e "${YELLOW}🌐 Production URLs:${NC}"
    echo "  Frontend:  https://arno.kz"
    echo "  Backend:   https://api.arno.kz"
    echo ""
    
    echo -e "${YELLOW}🧪 Test URLs:${NC}"
    echo "  Frontend:  https://dev.arno.kz"
    echo "  Backend:   https://api.dev.arno.kz"
    echo "  ${RED}(Basic Auth required)${NC}"
    echo ""
    
    echo -e "${YELLOW}📦 Docker Networks:${NC}"
    docker network ls | grep jmsad
    echo ""
    
    echo -e "${YELLOW}💾 Docker Volumes:${NC}"
    docker volume ls | grep -E "postgres_data|redis_data|backend_static|backend_media"
    echo ""
    
    echo -e "${YELLOW}🔐 SSL Certificates:${NC}"
    sudo certbot certificates 2>/dev/null | grep -E "Certificate Name|Domains|Expiry" || echo "  Run: sudo certbot certificates"
    echo ""
    
    echo -e "${CYAN}════════════════════════════════════════${NC}"
}

# --- Очистка всей системы ---
cleanup_all() {
    echo -e "${YELLOW}🧹 Full System Cleanup${NC}"
    echo -e "${RED}⚠️  WARNING: This will remove unused Docker resources${NC}"
    read -p "Continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo "❌ Cleanup cancelled"
        exit 0
    fi
    
    echo "Cleaning Docker system..."
    docker system prune -f
    
    echo "Cleaning volumes..."
    docker volume prune -f
    
    echo "Cleaning images..."
    docker image prune -f
    
    echo -e "${GREEN}✅ Cleanup complete!${NC}"
}

# --- Интерактивное меню ---
interactive_menu() {
    while true; do
        clear
        echo -e "${MAGENTA}"
        echo "╔════════════════════════════════════════╗"
        echo "║     JMSAD Interactive Menu             ║"
        echo "╚════════════════════════════════════════╝"
        echo -e "${NC}"
        echo ""
        echo -e "${GREEN}System Control:${NC}"
        echo "  1)  Start All"
        echo "  2)  Stop All"
        echo "  3)  Restart All"
        echo "  4)  Status"
        echo "  5)  Health Check"
        echo ""
        echo -e "${BLUE}Development:${NC}"
        echo "  6)  Quick Frontend Reload"
        echo "  7)  Quick Backend Reload"
        echo "  8)  View Logs"
        echo ""
        echo -e "${YELLOW}Maintenance:${NC}"
        echo "  9)  Backup All"
        echo "  10) Update All"
        echo "  11) Monitor Resources"
        echo "  12) Cleanup System"
        echo ""
        echo -e "${CYAN}Information:${NC}"
        echo "  13) System Info"
        echo "  14) SSL Certificates"
        echo ""
        echo "  0)  Exit"
        echo ""
        read -p "Choose option: " choice
        
        case $choice in
            1) start_all; read -p "Press Enter to continue..." ;;
            2) stop_all; read -p "Press Enter to continue..." ;;
            3) restart_all; read -p "Press Enter to continue..." ;;
            4) check_all; read -p "Press Enter to continue..." ;;
            5) health_all; read -p "Press Enter to continue..." ;;
            6) quick_frontend; read -p "Press Enter to continue..." ;;
            7) quick_backend; read -p "Press Enter to continue..." ;;
            8) logs_menu ;;
            9) backup_all; read -p "Press Enter to continue..." ;;
            10) update_all; read -p "Press Enter to continue..." ;;
            11) monitor_all ;;
            12) cleanup_all; read -p "Press Enter to continue..." ;;
            13) show_info; read -p "Press Enter to continue..." ;;
            14) ./manage_nginx.sh certs; read -p "Press Enter to continue..." ;;
            0) echo "Goodbye!"; exit 0 ;;
            *) echo "Invalid choice"; sleep 2 ;;
        esac
    done
}

# --- Главное меню ---
case "${1:-menu}" in
    start)
        start_all
        ;;
    stop)
        stop_all
        ;;
    restart)
        restart_all
        ;;
    status)
        check_all
        ;;
    logs)
        logs_menu
        ;;
    backup)
        backup_all
        ;;
    update)
        update_all
        ;;
    health)
        health_all
        ;;
    monitor)
        monitor_all
        ;;
    frontend)
        quick_frontend
        ;;
    backend)
        quick_backend
        ;;
    info)
        show_info
        ;;
    cleanup)
        cleanup_all
        ;;
    menu|*)
        interactive_menu
        ;;
esac