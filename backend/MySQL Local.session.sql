-- Удаляем таблицы, если они уже существуют
DROP TABLE IF EXISTS project_100score.false_reports;
DROP TABLE IF EXISTS project_100score.moderation_log;
DROP TABLE IF EXISTS project_100score.reviews;
DROP TABLE IF EXISTS project_100score.tenant_reputation;
DROP TABLE IF EXISTS project_100score.complaints;
DROP TABLE IF EXISTS project_100score.occupied_properties;
DROP TABLE IF EXISTS project_100score.properties;
DROP TABLE IF EXISTS project_100score.users;

-- Создаем таблицу пользователей (физ. и юр. лица)
CREATE TABLE project_100score.users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type ENUM('individual', 'legal_entity') NOT NULL,  -- Тип субъекта (физ. или юр. лицо)
    identifier VARCHAR(12) UNIQUE NOT NULL,  -- ИИН для физ. лиц, БИН для юр. лиц
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,  -- Хранить в хешированном виде (bcrypt)
    role ENUM('landlord', 'tenant', 'admin') NOT NULL,
    documents TEXT DEFAULT NULL,  -- JSON-список документов (только для юр. лиц)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (entity_type = 'legal_entity' OR documents IS NULL)  -- Ограничение: документы только для юр. лиц
);

-- Индексы для быстрого поиска
CREATE INDEX idx_users_identifier ON project_100score.users(identifier);
CREATE INDEX idx_users_email ON project_100score.users(email);

-- Создаем таблицу недвижимости с добавлением категорий и количества комнат
CREATE TABLE project_100score.properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_identifier VARCHAR(12) NOT NULL,  -- Ссылка на ИИН или БИН владельца
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    region VARCHAR(100),
    property_type ENUM('house', 'apartment', 'room') NOT NULL,  -- Категория недвижимости (дом, квартира, комната)
    num_of_rooms INT CHECK (num_of_rooms >= 1) NOT NULL,  -- Количество комнат (1 и более)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_identifier) REFERENCES users(identifier) ON DELETE CASCADE
);

-- Индекс для быстрого поиска недвижимости
CREATE INDEX idx_properties_owner ON project_100score.properties(owner_identifier);

-- Создаем таблицу жалоб
CREATE TABLE project_100score.complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    tenant_identifier VARCHAR(12) NOT NULL,   -- ИИН арендатора
    landlord_identifier VARCHAR(12) NOT NULL, -- ИИН/БИН арендодателя
    reason ENUM('late_payment', 'property_damage', 'contract_violation', 'neighbor_complaints') NOT NULL,
    description TEXT,
    evidence TEXT,  -- JSON список ссылок на фото или документы
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_identifier) REFERENCES users(identifier) ON DELETE CASCADE,
    FOREIGN KEY (landlord_identifier) REFERENCES users(identifier) ON DELETE CASCADE
);

-- Создаем таблицу репутации арендаторов
CREATE TABLE project_100score.tenant_reputation (
    tenant_identifier VARCHAR(12) PRIMARY KEY,
    total_complaints INT DEFAULT 0,
    negative_reviews INT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 5.00,
    FOREIGN KEY (tenant_identifier) REFERENCES users(identifier) ON DELETE CASCADE
);

-- Создаем таблицу отзывов
CREATE TABLE project_100score.reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_identifier VARCHAR(12) NOT NULL,
    author_identifier VARCHAR(12) NOT NULL,
    rating TINYINT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_identifier) REFERENCES users(identifier) ON DELETE CASCADE,
    FOREIGN KEY (author_identifier) REFERENCES users(identifier) ON DELETE CASCADE
);

-- Создаем таблицу журнала модерации
CREATE TABLE project_100score.moderation_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_identifier VARCHAR(12) NOT NULL,
    action ENUM('approve_complaint', 'reject_complaint', 'delete_review', 'ban_user') NOT NULL,
    target_id INT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_identifier) REFERENCES users(identifier) ON DELETE CASCADE
);

-- Создаем таблицу ложных жалоб
CREATE TABLE project_100score.false_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    tenant_identifier VARCHAR(12) NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'resolved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_identifier) REFERENCES users(identifier) ON DELETE CASCADE
);

-- Создаем таблицу занятых недвижимостей (новая таблица)
CREATE TABLE project_100score.occupied_properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,  -- ID недвижимости
    tenant_identifier VARCHAR(12) NOT NULL,  -- Кто арендует (ИИН)
    start_date DATE NOT NULL,  -- Дата начала аренды
    end_date DATE NOT NULL,  -- Дата окончания аренды
    status ENUM('active', 'expired', 'terminated') DEFAULT 'active',  -- Статус аренды
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_identifier) REFERENCES users(identifier) ON DELETE CASCADE,
    CHECK (end_date > start_date)  -- Проверка, чтобы аренда не заканчивалась раньше, чем началась
);

-- Индекс для быстрого поиска арендованных объектов
CREATE INDEX idx_occupied_properties ON project_100score.occupied_properties(property_id, tenant_identifier);
