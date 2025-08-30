#!/bin/bash

# Скрипт для первоначальной настройки VPS Ubuntu 24.04
# Выполнять на VPS сервере

echo "🚀 Настройка VPS для JMSAD проекта..."

# Обновление системы
echo "📦 Обновление системы..."
sudo apt update && sudo apt upgrade -y

# Установка необходимых пакетов
echo "🔧 Установка необходимых пакетов..."
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Установка Docker
echo "🐳 Установка Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER

# Установка Docker Compose
echo "📋 Установка Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Создание символической ссылки
sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Установка Nginx (опционально, для проксирования)
echo "🌐 Установка Nginx..."
sudo apt install -y nginx

# Настройка firewall
echo "🔥 Настройка firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8000/tcp
sudo ufw allow 3000/tcp
sudo ufw --force enable

# Создание директории проекта
echo "📁 Создание директории проекта..."
mkdir -p ~/jmsad
cd ~/jmsad

echo "✅ Настройка VPS завершена!"
echo "🔑 Перезагрузите сервер или перелогиньтесь для применения изменений группы docker"
echo "📂 Проект будет размещен в ~/jmsad"

