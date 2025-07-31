#!/bin/bash

echo "Запуск фронтенда в Docker..."

# Останавливаем существующие контейнеры
docker-compose down

# Удаляем старые образы фронтенда
docker rmi jmsad_frontend 2>/dev/null || true

# Собираем и запускаем
docker-compose up --build frontend 