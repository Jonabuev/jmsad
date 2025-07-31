#!/bin/bash

echo "🚀 Запуск бэкенда..."

# Переходим в директорию бэкенда
cd backend

# Собираем Docker образ
echo "📦 Сборка Docker образа для бэкенда..."
docker build -t jmsad-backend .

# Запускаем контейнер
echo "▶️ Запуск контейнера бэкенда..."
docker run -d \
  --name jmsad-backend \
  -p 8000:8000 \
  -e SECRET_KEY=django-insecure-your-secret-key-here-change-in-production \
  -e DEBUG=True \
  -e DB_NAME=jmsad_db \
  -e DB_USER=jmsad_user \
  -e DB_PASSWORD=jmsad_password \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  jmsad-backend

echo "✅ Бэкенд запущен на http://localhost:8000"
echo "📋 Логи контейнера: docker logs jmsad-backend"
echo "🛑 Остановка: docker stop jmsad-backend" 