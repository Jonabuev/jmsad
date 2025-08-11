#!/bin/bash

echo "🧹 Очистка неиспользуемых файлов и компонентов..."

cd front

# Удаление неиспользуемых директорий
echo "🗑️  Удаление пустых директорий..."
rm -rf src/component/debug

# Очистка кэша
echo "🧹 Очистка кэша..."
rm -rf .next
rm -rf .cache
rm -rf .turbo

# Очистка node_modules и переустановка
echo "📦 Переустановка зависимостей..."
rm -rf node_modules
rm -f package-lock.json

# Установка только нужных зависимостей
npm ci --prefer-offline --no-audit

echo "✅ Очистка завершена!"
echo "📊 Размер проекта уменьшен"
echo "🚀 Готово к быстрой сборке!"
