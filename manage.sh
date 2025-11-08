#!/bin/bash

# Главный скрипт управления JMSAD
# Управляет всеми компонентами: prod, test, nginx

set -e

# === ПУТИ К ДИРЕКТОРИЯМ ===
# Можно переопределить при запуске: PROD_DIR=... TEST_DIR=... NGINX_DIR=... ./jmsad.sh
PROD_DIR="${PROD_DIR:-~/t_Jmsad}"
TEST_DIR="${TEST_DIR:-~/test}"
NGINX_DIR="${NGINX_DIR:-~/test}"  # nginx тоже в test

# Расширяем ~ до полного пути
PROD_DIR="$(realpath -m "$PROD_DIR")"
TEST_DIR="$(realpath -m "$TEST_DIR")"
NGINX_DIR="$(realpath -m "$NGINX_DIR")"

# Проверка существования директорий
check_dir() {
    if [ ! -d "$1" ]; then
        echo -e "${RED}Ошибка: директория не существует: $1${NC}" >&2
        exit 1
    fi
}

check_dir "$PROD_DIR"
check_dir "$TEST_DIR"
check_dir "$NGINX_DIR"

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Функция выполнения команды в нужной директории
run_in_dir() {
    local dir="$1"
    shift
    (cd "$dir" && "$@")
}

echo -e "${MAGENTA}"
echo "╔════════════════════════════════════════╗"
echo "║     JMSAD Management System v1.1       ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# --- Проверка всей системы ---
check_all() {
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${YELLOW}СИСТЕМНЫЙ СТАТУС${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    
    echo ""
    echo -e "${BLUE}ПРОДАКШН: $PROD_DIR${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "jmsad_(backend_prod|frontend_prod|postgres_prod|redis)" || echo "  Контейнеры продакшена не запущены"
    
    echo ""
    echo -e "${BLUE}ТЕСТ: $TEST_DIR${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "jmsad_(backend_test|frontend_test|postgres_test)" || echo "  Контейнеры теста не запущены"
    
    echo ""
    echo -e "${BLUE}NGINX: $NGINX_DIR${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "jmsad_nginx|jmsad_certbot" || echo "  Nginx не запущен"
    
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
}

# --- Запуск всей системы ---
start_all() {
    echo -e "${GREEN}Запуск JMSAD Full Stack...${NC}"
    echo ""
    
    echo -e "${BLUE}Шаг 1/3: Запуск продакшена...${NC}"
    run_in_dir "$PROD_DIR" ./manage_prod.sh start
    echo ""
    
    echo -e "${BLUE}Шаг 2/3: Запуск теста...${NC}"
    run_in_dir "$TEST_DIR" ./manage_test.sh start
    echo ""
    
    echo -e "${BLUE}Шаг 3/3: Запуск Nginx...${NC}"
    run_in_dir "$NGINX_DIR" ./manage_nginx.sh start
    echo ""
    
    echo -e "${GREEN}Вся система запущена!${NC}"
    check_all
}

# --- Остановка всей системы ---
stop_all() {
    echo -e "${YELLOW}Остановка JMSAD Full Stack...${NC}"
    echo ""
    
    echo -e "${BLUE}Шаг 1/3: Остановка Nginx...${NC}"
    run_in_dir "$NGINX_DIR" ./manage_nginx.sh stop
    echo ""
    
    echo -e "${BLUE}Шаг 2/3: Остановка теста...${NC}"
    run_in_dir "$TEST_DIR" ./manage_test.sh stop
    echo ""
    
    echo -e "${BLUE}Шаг 3/3: Остановка продакшена...${NC}"
    run_in_dir "$PROD_DIR" ./manage_prod.sh stop
    echo ""
    
    echo -e "${GREEN}Вся система остановлена!${NC}"
}

# --- Перезапуск ---
restart_all() {
    echo -e "${YELLOW}Перезапуск JMSAD Full Stack...${NC}"
    stop_all
    sleep 5
    start_all
}

# --- Логи ---
logs_menu() {
    echo -e "${YELLOW}Выберите логи для просмотра:${NC}"
    echo ""
    echo "  1) Продакшн: Backend"
    echo "  2) Продакшн: Frontend"
    echo "  3) Тест: Backend"
    echo "  4) Тест: Frontend"
    echo "  5) Nginx: Access"
    echo "  6) Nginx: Error"
    echo "  7) Все продакшн"
    echo "  8) Все тестовые"
    echo "  9) Выход"
    echo ""
    read -p "Выбор (1-9): " choice
    
    case $choice in
        1) docker logs -f jmsad_backend_prod ;;
        2) docker logs -f jmsad_frontend_prod ;;
        3) docker logs -f jmsad_backend_test ;;
        4) docker logs -f jmsad_frontend_test ;;
        5) run_in_dir "$NGINX_DIR" ./manage_nginx.sh logs access ;;
        6) run_in_dir "$NGINX_DIR" ./manage_nginx.sh logs error ;;
        7) run_in_dir "$PROD_DIR" docker compose -f dc.prod.yml logs -f ;;
        8) run_in_dir "$TEST_DIR" docker compose -f dc.test.yml logs -f ;;
        9) exit 0 ;;
        *) echo "Неверный выбор" ;;
    esac
}

# --- Бэкапы ---
backup_all() {
    echo -e "${YELLOW}Создание резервных копий баз...${NC}"
    echo ""
    
    echo "Продакшн..."
    run_in_dir "$PROD_DIR" ./manage_prod.sh backup
    echo ""
    
    echo "Тест..."
    run_in_dir "$TEST_DIR" ./manage_test.sh backup
    echo ""
    
    echo -e "${GREEN}Все бэкапы созданы!${NC}"
}

# --- Обновление ---
update_all() {
    echo -e "${YELLOW}Обновление JMSAD Full Stack...${NC}"
    echo ""
    
    echo "Создание резервных копий..."
    backup_all
    echo ""
    
    echo -e "${BLUE}Обновление продакшена...${NC}"
    run_in_dir "$PROD_DIR" ./manage_prod.sh update
    echo ""
    
    echo -e "${BLUE}Обновление теста...${NC}"
    run_in_dir "$TEST_DIR" ./manage_test.sh update
    echo ""
    
    echo -e "${BLUE}Перезагрузка Nginx...${NC}"
    run_in_dir "$NGINX_DIR" ./manage_nginx.sh reload
    echo ""
    
    echo -e "${GREEN}Система обновлена!${NC}"
    check_all
}

# --- Health check ---
health_all() {
    echo -e "${YELLOW}Проверка состояния системы...${NC}"
    echo ""
    
    echo -e "${BLUE}Продакшн:${NC}"
    run_in_dir "$PROD_DIR" ./manage_prod.sh health
    echo ""
    
    echo -e "${BLUE}Тест:${NC}"
    run_in_dir "$TEST_DIR" ./manage_test.sh health
    echo ""
    
    echo -e "${BLUE}Nginx:${NC}"
    run_in_dir "$NGINX_DIR" ./manage_nginx.sh status
    echo ""
    
    echo -e "${BLUE}Доступность доменов:${NC}"
    run_in_dir "$NGINX_DIR" ./manage_nginx.sh test-domains
}

# --- Мониторинг ---
monitor_all() {
    echo -e "${YELLOW}Мониторинг ресурсов${NC}"
    echo -e "${CYAN}Нажмите Ctrl+C для выхода${NC}"
    echo ""
    
    watch -n 2 'docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | grep jmsad_'
}

# --- Быстрый ребилд frontend ---
quick_frontend() {
    echo -e "${YELLOW}Быстрая перезагрузка Frontend${NC}"
    echo ""
    echo "1) Продакшн"
    echo "2) Тест"
    echo "3) Оба"
    echo ""
    read -p "Выбор (1-3): " choice
    
    case $choice in
        1) run_in_dir "$PROD_DIR" ./manage_prod.sh rebuild-frontend ;;
        2) run_in_dir "$TEST_DIR" ./manage_test.sh rebuild-frontend ;;
        3)
            run_in_dir "$PROD_DIR" ./manage_prod.sh rebuild-frontend
            run_in_dir "$TEST_DIR" ./manage_test.sh rebuild-frontend
            ;;
        *) echo "Неверный выбор" ;;
    esac
}

# --- Быстрый ребилд backend ---
quick_backend() {
    echo -e "${YELLOW}Быстрая перезагрузка Backend${NC}"
    echo ""
    echo "1) Продакшн"
    echo "2) Тест"
    echo "3) Оба"
    echo ""
    read -p "Выбор (1-3): " choice
    
    case $choice in
        1) run_in_dir "$PROD_DIR" ./manage_prod.sh rebuild-backend ;;
        2) run_in_dir "$TEST_DIR" ./manage_test.sh rebuild-backend ;;
        3)
            run_in_dir "$PROD_DIR" ./manage_prod.sh rebuild-backend
            run_in_dir "$TEST_DIR" ./manage_test.sh rebuild-backend
            ;;
        *) echo "Неверный выбор" ;;
    esac
}

# --- Информация ---
show_info() {
    echo -e "${CYAN}════════════════════════════════════════${NC}"
    echo -e "${MAGENTA}Информация о системе JMSAD${NC}"
    echo -e "${CYAN}════════════════════════════════════════${NC}"
    echo ""
    
    echo -e "${YELLOW}ПРОДАКШН: ${PROD_DIR}${NC}"
    echo "  Frontend:  https://arno.kz"
    echo "  Backend:   https://api.arno.kz"
    echo ""
    
    echo -e "${YELLOW}ТЕСТ: ${TEST_DIR}${NC}"
    echo "  Frontend:  https://dev.arno.kz"
    echo "  Backend:   https://api.dev.arno.kz"
    echo "  ${RED}(Требуется Basic Auth)${NC}"
    echo ""
    
    echo -e "${YELLOW}NGINX: ${NGINX_DIR}${NC}"
    echo ""
    
    echo -e "${YELLOW}Сети Docker:${NC}"
    docker network ls | grep jmsad || echo "  Нет сетей jmsad"
    echo ""
    
    echo -e "${YELLOW}Тома Docker:${NC}"
    docker volume ls | grep -E "postgres_data|redis_data|backend_static|backend_media" || echo "  Нет томов"
    echo ""
    
    echo -e "${YELLOW}SSL сертификаты:${NC}"
    sudo certbot certificates 2>/dev/null | grep -E "Certificate Name|Domains|Expiry" || echo "  Запустите: sudo certbot certificates"
    echo ""
    
    echo -e "${CYAN}════════════════════════════════════════${NC}"
}

# --- Очистка ---
cleanup_all() {
    echo -e "${YELLOW}Полная очистка системы${NC}"
    echo -e "${RED}ВНИМАНИЕ: будут удалены неиспользуемые ресурсы Docker${NC}"
    read -p "Продолжить? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo "Очистка отменена"
        return
    fi
    
    echo "Очистка системы Docker..."
    docker system prune -f
    
    echo "Очистка томов..."
    docker volume prune -f
    
    echo "Очистка образов..."
    docker image prune -f
    
    echo -e "${GREEN}Очистка завершена!${NC}"
}

# --- Интерактивное меню ---
interactive_menu() {
    while true; do
        clear
        echo -e "${MAGENTA}"
        echo "╔════════════════════════════════════════╗"
        echo "║        JMSAD Interactive Menu          ║"
        echo "╚════════════════════════════════════════╝"
        echo -e "${NC}"
        echo ""
        echo -e "${GREEN}Управление:${NC}"
        echo "  1)  Запустить всё"
        echo "  2)  Остановить всё"
        echo "  3)  Перезапустить всё"
        echo "  4)  Статус"
        echo "  5)  Проверка здоровья"
        echo ""
        echo -e "${BLUE}Разработка:${NC}"
        echo "  6)  Пересобрать Frontend"
        echo "  7)  Пересобрать Backend"
        echo "  8)  Логи"
        echo ""
        echo -e "${YELLOW}Обслуживание:${NC}"
        echo "  9)  Бэкап"
        echo "  10) Обновить всё"
        echo "  11) Мониторинг"
        echo "  12) Очистка"
        echo ""
        echo -e "${CYAN}Инфо:${NC}"
        echo "  13) Информация о системе"
        echo "  14) SSL сертификаты"
        echo ""
        echo "  0)  Выход"
        echo ""
        read -p "Выберите опцию: " choice
        
        case $choice in
            1) start_all; read -p "Нажмите Enter..." ;;
            2) stop_all; read -p "Нажмите Enter..." ;;
            3) restart_all; read -p "Нажмите Enter..." ;;
            4) check_all; read -p "Нажмите Enter..." ;;
            5) health_all; read -p "Нажмите Enter..." ;;
            6) quick_frontend; read -p "Нажмите Enter..." ;;
            7) quick_backend; read -p "Нажмите Enter..." ;;
            8) logs_menu ;;
            9) backup_all; read -p "Нажмите Enter..." ;;
            10) update_all; read -p "Нажмите Enter..." ;;
            11) monitor_all ;;
            12) cleanup_all; read -p "Нажмите Enter..." ;;
            13) show_info; read -p "Нажмите Enter..." ;;
            14) run_in_dir "$NGINX_DIR" ./manage_nginx.sh certs; read -p "Нажмите Enter..." ;;
            0) echo "До встречи!"; exit 0 ;;
            *) echo "Неверный выбор"; sleep 2 ;;
        esac
    done
}

# --- CLI аргументы ---
case "${1:-menu}" in
    start)   start_all ;;
    stop)    stop_all ;;
    restart) restart_all ;;
    status)  check_all ;;
    logs)    logs_menu ;;
    backup)  backup_all ;;
    update)  update_all ;;
    health)  health_all ;;
    monitor) monitor_all ;;
    frontend) quick_frontend ;;
    backend)  quick_backend ;;
    info)    show_info ;;
    cleanup) cleanup_all ;;
    menu|*)  interactive_menu ;;
esac