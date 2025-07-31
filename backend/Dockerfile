# Используем Python 3.12.6
FROM python:3.12.6-slim

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    libmariadb-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY req.txt .

# Устанавливаем Python зависимости
RUN pip install --no-cache-dir -r req.txt

# Копируем исходный код
COPY . .

# Создаем директорию для статических файлов
RUN mkdir -p staticfiles

# Открываем порт 8000
EXPOSE 8000

# Создаем директорию для медиа файлов
RUN mkdir -p media

# Запускаем Django сервер
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"] 