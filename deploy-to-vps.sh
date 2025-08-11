#!/bin/bash

# Скрипт для деплоя на VPS хостинг ps.kz
# Использование: ./deploy-to-vps.sh [test|prod]

ENVIRONMENT=${1:-test}
VPS_HOST="your-vps-ip-or-domain"
VPS_USER="your-username"
PROJECT_DIR="/home/$VPS_USER/jmsad"

echo "🚀 Деплой на VPS хостинг ps.kz..."
echo "📍 Окружение: $ENVIRONMENT"
echo "🖥️  Хост: $VPS_HOST"

# Сборка проекта
echo "🔨 Сборка проекта..."
if [ "$ENVIRONMENT" = "prod" ]; then
    docker-compose -f docker-compose.prod.yml build
else
    docker-compose -f docker-compose.dev.yml build
fi

# Создание архива
echo "📦 Создание архива..."
tar -czf jmsad-$ENVIRONMENT.tar.gz \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.cache' \
    --exclude='.turbo' \
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
        docker-compose -f docker-compose.dev.yml down
    fi
    
    # Распаковка архива
    tar -xzf jmsad-$ENVIRONMENT.tar.gz
    
    # Запуск новых контейнеров
    if [ "$ENVIRONMENT" = "prod" ]; then
        docker-compose -f docker-compose.prod.yml up -d
    else
        docker-compose -f docker-compose.dev.yml up -d
    fi
    
    # Очистка
    rm jmsad-$ENVIRONMENT.tar.gz
    
    echo "✅ Деплой завершен!"
EOF

# Очистка локального архива
rm jmsad-$ENVIRONMENT.tar.gz

echo "🎉 Деплой успешно завершен!"
