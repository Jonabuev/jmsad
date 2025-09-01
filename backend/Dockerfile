# Используем Python 3.12.6
FROM python:3.12.6-slim

# Устанавливаем системные зависимости включая Tesseract OCR и OpenCV
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    libmariadb-dev \
    pkg-config \
    wget \
    curl \
    tesseract-ocr \
    tesseract-ocr-rus \
    tesseract-ocr-eng \
    tesseract-ocr-kaz \
    libtesseract-dev \
    poppler-utils \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем Tesseract и языковые пакеты
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-rus \
    tesseract-ocr-eng \
    tesseract-ocr-kaz \
    libtesseract-dev \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Проверяем установку Tesseract
RUN tesseract --version && \
    tesseract --list-langs && \
    echo "✅ Tesseract успешно установлен"

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY req.txt .

# Устанавливаем Python зависимости
RUN pip install --no-cache-dir -r req.txt --extra-index-url https://download.pytorch.org/whl/cpu

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