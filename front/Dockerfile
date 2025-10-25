# Многоэтапная сборка для оптимизации размера образа
FROM node:20-alpine AS deps

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем только файлы зависимостей для лучшего кэширования
COPY package*.json ./

# Устанавливаем зависимости с кэшированием
# Устанавливаем зависимости с запасом по таймауту
RUN npm config set registry https://registry.npmmirror.com \
    && npm set fetch-timeout=600000 \
    && npm ci --omit=dev --no-audit



# Builder этап
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем зависимости из deps этапа
COPY --from=deps /app/node_modules ./node_modules

# Копируем исходный код
COPY . .

# Добавляем ARG для переменных окружения во время сборки
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Собираем приложение
RUN npm run build

# Production этап
FROM node:20-alpine AS runner

WORKDIR /app

# Устанавливаем curl для health check
RUN apk add --no-cache curl

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