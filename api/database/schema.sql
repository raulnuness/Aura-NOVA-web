-- Aura NØVA — Schema da Base de Dados
-- MySQL 5.7+ / MariaDB 10.3+

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    old_price DECIMAL(10,2) DEFAULT NULL,
    description TEXT,
    features JSON DEFAULT NULL,
    image VARCHAR(500) DEFAULT NULL,
    badge VARCHAR(50) DEFAULT NULL,
    rating DECIMAL(2,1) DEFAULT 0.0,
    reviews_count INT DEFAULT 0,
    is_new BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    stripe_session_id VARCHAR(255) DEFAULT NULL,
    status ENUM('pending','paid','shipped','delivered','cancelled','refunded') DEFAULT 'pending',
    customer_name VARCHAR(255) NOT NULL,
    customer_surname VARCHAR(255) DEFAULT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(30) DEFAULT NULL,
    address TEXT NOT NULL,
    postal_code VARCHAR(20) DEFAULT NULL,
    city VARCHAR(100) DEFAULT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0.00,
    shipping DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    coupon_code VARCHAR(50) DEFAULT NULL,
    payment_method VARCHAR(50) DEFAULT 'stripe',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_email (customer_email),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    source ENUM('popup','newsletter','checkout') DEFAULT 'newsletter',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_source (source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    type ENUM('percent','fixed','shipping') NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    min_order DECIMAL(10,2) DEFAULT 0.00,
    max_uses INT DEFAULT NULL,
    used_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    token_hash VARCHAR(64) DEFAULT NULL,
    token_expires TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) DEFAULT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- SEED: Produtos iniciais
-- ============================================

INSERT INTO products (slug, name, category, price, old_price, description, features, image, badge, rating, reviews_count, is_new) VALUES
('mascara-led', 'Máscara de Terapia LED', 'bem-estar', 69.90, 99.90, 'Máscara facial com 7 cores de luz LED para tratamento de pele. Estimula a produção de colagénio, reduz acne e manchas. Recarregável por USB, 3 modos de intensidade. Resultados visíveis em 2 semanas de uso regular.', '["7 cores LED", "Recarregável USB", "3 intensidades"]', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=400&fit=crop', 'Bestseller', 0.0, 0, FALSE),
('tapete-acupressao', 'Tapete de Acupressão + Almofada', 'bem-estar', 39.90, 59.90, 'Tapete com 6.210 pontos de acupressão e almofada incluída. Alivia dores nas costas, tensão muscular e stress. Perfeito para relaxar após um longo dia de trabalho. Acompanha bolsa de transporte.', '["6.210 pontos", "Almofada incluída", "Bolsa de transporte"]', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop', NULL, 0.0, 0, FALSE),
('pedras-gua-sha', 'Pedras Gua Sha Set', 'bem-estar', 19.90, 29.90, 'Conjunto de 4 pedras Gua Sha naturais (rosa quartzo, jade, ametista e obsidiana). Reduz inchaço, melhora a circulação e contorna o rosto. Inclui guia de utilização ilustrado.', '["4 pedras naturais", "Guia incluído", "Em caixa premium"]', 'https://images.unsplash.com/photo-1608248597275-a725c3c14264?w=400&h=400&fit=crop', NULL, 0.0, 0, FALSE),
('massajador-linfatico', 'Massajador Linfático Elétrico', 'bem-estar', 34.90, 49.90, 'Massajador portátil com 3 intensidades e cabeça rotativa. Drena líquidos, reduz celulite e melhora a circulação. Bateria de longa duração, ideal para usar em casa ou viagens.', '["3 intensidades", "Cabeça rotativa", "Bateria longa"]', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=400&fit=crop', 'Novo', 0.0, 0, TRUE),
('projetor-galaxy', 'Projetor Galaxy Bluetooth', 'casa', 49.90, 69.90, 'Projetor de estrelas com Bluetooth integrado e controlo por app. Cria um ambiente único em qualquer divisão. 21 modos de iluminação, temporizador e auto-desligamento.', '["Bluetooth", "21 modos", "Controlo por app"]', 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&h=400&fit=crop', 'Trend', 0.0, 0, FALSE),
('difusor-chama', 'Difusor Efeito Chama', 'casa', 44.90, 64.90, 'Difusor de aromas com efeito visual de chama realista. LED RGB com 7 cores, temporizador e auto-desligamento quando o reservatório fica vazio. Capacidade de 300ml.', '["Efeito chama realista", "7 cores LED", "300ml capacidade"]', 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=400&h=400&fit=crop', NULL, 0.0, 0, FALSE),
('lampada-sunset', 'Lâmpada Sunset RGB', 'casa', 24.90, 34.90, 'Lâmpada portátil com 16 cores e efeito pôr-do-sol. Controlo remoto incluído, USB recarregável. Cria o ambiente perfeito para relaxar, meditar ou fotografar.', '["16 cores", "Controlo remoto", "USB recarregável"]', 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400&h=400&fit=crop', NULL, 0.0, 0, FALSE),
('peluche-dinossauro', 'Peluche Dinossauro Ponderado', 'casa', 32.90, 44.90, 'Peluche ponderado de 1.5kg com textura suave e hipoalergénica. Efeito calmante, ideal para ansiedade e stress. Perfeito para crianças e adultos. Lavável na máquina.', '["1.5kg ponderado", "Hipoalergénico", "Lavável na máquina"]', 'https://images.unsplash.com/photo-1559715541-32d1a6c7b3d3?w=400&h=400&fit=crop', 'Bestseller', 0.0, 0, FALSE),
('suporte-magnetico', 'Suporte Magnético para Telemóvel', 'gadgets', 17.90, 24.90, 'Suporte magnético 360° para carro. Montagem em grelha de ar condicionado, compatível com todos os telemóveis. Fixação forte, rotação livre, design compacto.', '["360° rotação", "Montagem fácil", "Universal"]', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop', NULL, 0.0, 0, FALSE),
('sprayer-oleo', 'Sprayer de Óleo Elétrico', 'gadgets', 14.90, 22.90, 'Sprayer elétrico recarregável para óleo de cozinha. Dosagem precisa por gota, sem desperdício. Fácil de limpar e recarregar via USB. Capacidade de 250ml.', '["Dosagem precisa", "Recarregável USB", "250ml"]', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop', NULL, 0.0, 0, FALSE),
('liners-air-fryer', 'Liners Air Fryer (Pack 5)', 'gadgets', 12.90, 18.90, 'Liners de silicone reutilizáveis para air fryer. Anti-aderente, resistente ao calor até 230°C, fácil de limpar. Pack de 5 tamanhos diferentes para adaptar a qualquer modelo.', '["Pack de 5", "Até 230°C", "Reutilizáveis"]', 'https://images.unsplash.com/photo-1625944525533-473f892e1a2c?w=400&h=400&fit=crop', 'Bestseller', 0.0, 0, FALSE),
('organizador-rotativo', 'Organizador Rotativo 8 Compartimentos', 'gadgets', 27.90, 39.90, 'Tabuleiro rotativo com 8 compartimentos para snacks, especiarias ou organização de secretária. Base anti-derrapante, material BPA-free, fácil de montar.', '["8 compartimentos", "Base anti-derrapante", "BPA-free"]', 'https://images.unsplash.com/photo-1586023492125-27b2c045a684?w=400&h=400&fit=crop', NULL, 0.0, 0, TRUE);

-- ============================================
-- SEED: Cupões iniciais
-- ============================================

INSERT INTO coupons (code, type, value, min_order, is_active) VALUES
('NOVA10', 'percent', 10.00, 0.00, TRUE),
('WELCOME15', 'percent', 15.00, 30.00, TRUE),
('FRETE', 'shipping', 0.00, 0.00, TRUE);

-- ============================================
-- SEED: Admin inicial
-- ============================================
-- IMPORTANTE: Alterar a password antes de lançar!
-- Gerar novo hash com: php -r "echo password_hash('a_tua_password', PASSWORD_BCRYPT);"

INSERT INTO admins (username, password_hash) VALUES
('gerente', '$2y$12$YDFFpPGtIquZCGkTkfvc2udnw68elxuMFJ4vIYzRkhkwsECQDfvFC');