-- Инициализация базы данных для JMSAD проекта
-- Создаем базу данных если она не существует
SELECT 'CREATE DATABASE jmsad_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'jmsad_db')\gexec

-- Подключаемся к созданной базе данных
\c jmsad_db;

-- Устанавливаем кодировку UTF-8
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- Создаем расширения если нужно
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Устанавливаем права доступа
GRANT ALL PRIVILEGES ON DATABASE jmsad_db TO jmsad_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO jmsad_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO jmsad_user; 