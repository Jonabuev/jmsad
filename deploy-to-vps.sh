#!/bin/bash

# Скрипт для деплоя на VPS хостинг ps.kz
# Использование: ./deploy-to-vps.sh [test|prod] [VPS_IP] [VPS_USER]

ENVIRONMENT=${1:-test}
VPS_HOST=${2:-"your-vps-ip"}
VPS_USER=${3:-"your-username"}
PROJECT_DIR="/home/$VPS_USER/jmsad"

# Проверка параметров
if [ "$VPS_HOST" = "your-vps-ip" ] || [ "$VPS_USER" = "your-username" ]; then
    echo "❌ Ошибка: Укажите IP адрес VPS и имя пользователя"
    echo "Использование: ./deploy-to-vps.sh [test|prod] [VPS_IP] [VPS_USER]"
    echo "Пример: ./deploy-to-vps.sh test 123.456.789.012 ubuntu"
    exit 1
fi

echo "🚀 Деплой на VPS хостинг ps.kz..."
echo "📍 Окружение: $ENVIRONMENT"
echo "🖥️  Хост: $VPS_HOST"
echo "👤 Пользователь: $VPS_USER"
echo "📂 Директория: $PROJECT_DIR"

# Сборка проекта
echo "🔨 Сборка проекта..."
if [ "$ENVIRONMENT" = "prod" ]; then
    docker-compose -f docker-compose.prod.yml build
else
    docker-compose -f docker-compose.vps.yml build
fi

# Создание архива
echo "📦 Создание архива..."
tar -czf jmsad-$ENVIRONMENT.tar.gz \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.cache' \
    --exclude='.turbo' \
    --exclude='venv' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.env' \
    --exclude='.env.local' \
    --exclude='db.sqlite3' \
    --exclude='logs' \
    .

# Загрузка на VPS
echo "📤 Загрузка на VPS..."
scp jmsad-$ENVIRONMENT.tar.gz $VPS_USER@$VPS_HOST:$PROJECT_DIR/

# Выполнение команд на VPS
echo "🔧 Выполнение команд на VPS..."
ssh $VPS_USER@$VPS_HOST << EOF
    cd $PROJECT_DIR
    
    # Остановка текущих контейнеров
    if [ "$ENVIRONMENT" = "prod" ]; then
        docker-compose -f docker-compose.prod.yml down
    else
        docker-compose -f docker-compose.vps.yml down
    fi
    
    # Распаковка архива
    tar -xzf jmsad-$ENVIRONMENT.tar.gz
    
    # Копирование .env файла
    if [ "$ENVIRONMENT" = "test" ]; then
        cp env.vps .env
        # Замена YOUR_VPS_IP на реальный IP
        sed -i "s/YOUR_VPS_IP/$VPS_HOST/g" .env
    fi
    
    # Создание директорий для SSL (если нужно)
    mkdir -p ssl
    
    # Запуск новых контейнеров
    if [ "$ENVIRONMENT" = "prod" ]; then
        docker-compose -f docker-compose.prod.yml up -d
    else
        docker-compose -f docker-compose.vps.yml up -d
    fi
    
    # Очистка
    rm jmsad-$ENVIRONMENT.tar.gz
    
    # Проверка статуса контейнеров
    echo "📊 Статус контейнеров:"
    docker ps
    
    echo "✅ Деплой завершен!"
EOF

# Очистка локального архива
rm jmsad-$ENVIRONMENT.tar.gz

echo "🎉 Деплой успешно завершен!"
echo "🌐 Ваше приложение доступно по адресу:"
echo "   Frontend: http://$VPS_HOST"
echo "   Backend API: http://$VPS_HOST:8000"
echo "   Django Admin: http://$VPS_HOST/admin/"
echo ""
echo "📋 Полезные команды для управления:"
echo "   Проверить статус: ssh $VPS_USER@$VPS_HOST 'cd $PROJECT_DIR && docker ps'"
echo "   Посмотреть логи: ssh $VPS_USER@$VPS_HOST 'cd $PROJECT_DIR && docker-compose -f docker-compose.vps.yml logs'"
echo "   Остановить: ssh $VPS_USER@$VPS_HOST 'cd $PROJECT_DIR && docker-compose -f docker-compose.vps.yml down'"
