#!/bin/bash

echo "🚀 Запуск базы данных PostgreSQL..."

# Запускаем базу данных через Docker Compose
echo "📦 Запуск PostgreSQL 16.9..."
docker-compose -f docker-compose.db.yml up -d

echo "✅ База данных запущена на localhost:5432"
echo "📋 Логи контейнера: docker logs jmsad_postgres"
echo "🛑 Остановка: docker-compose -f docker-compose.db.yml down"
echo ""
echo "📊 Информация о подключении:"
echo "   База данных: jmsad_db"
echo "   Пользователь: jmsad_user"
echo "   Пароль: jmsad_password"
echo "   Порт: 5432" 