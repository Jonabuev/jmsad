# Многоэтапная сборка для оптимизации размера образа
FROM node:18-alpine AS deps

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем только файлы зависимостей для лучшего кэширования
COPY package*.json ./

# Устанавливаем зависимости с кэшированием
RUN npm ci --only=production --prefer-offline --no-audit

# Builder этап
FROM node:18-alpine AS builder

WORKDIR /app

# Копируем зависимости из deps этапа
COPY --from=deps /app/node_modules ./node_modules

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Production этап
FROM node:18-alpine AS runner

WORKDIR /app

# Создаем пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Копируем собранное приложение из builder этапа
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Меняем владельца файлов
RUN chown -R nextjs:nodejs /app

USER nextjs

# Открываем порт 3000
EXPOSE 3000

# Устанавливаем переменные окружения для Next.js
ENV PORT=3000 \
    HOSTNAME="0.0.0.0" \
    NODE_ENV=production

# Запускаем приложение
CMD ["node", "server.js"] 