#!/bin/bash

echo "🚀 Быстрая сборка фронтенда..."

# Очистка кэша
echo "🧹 Очистка кэша..."
rm -rf front/.next
rm -rf front/.cache
rm -rf front/.turbo

# Установка зависимостей с кэшированием
echo "📦 Установка зависимостей..."
cd front
npm ci --prefer-offline --no-audit

# Сборка с оптимизацией
echo "🔨 Сборка приложения..."
npm run build

echo "✅ Сборка завершена!"
