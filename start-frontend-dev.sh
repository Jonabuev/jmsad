#!/bin/bash

echo "Запуск фронтенда в режиме разработки..."

# Останавливаем существующие контейнеры
docker-compose -f docker-compose.dev.yml down

# Удаляем старые образы фронтенда
docker rmi jmsad_frontend_dev 2>/dev/null || true

# Собираем и запускаем
docker-compose -f docker-compose.dev.yml up --build frontend 