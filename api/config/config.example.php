<?php
// Configuração do ambiente — copiar para config.php e preencher com os valores reais

// Base de dados (Hostinger)
define('DB_HOST', 'localhost');
define('DB_NAME', 'auranova_db');       // Nome da base de dados na Hostinger
define('DB_USER', 'auranova_user');      // Utilizador da BD na Hostinger
define('DB_PASS', '');                   // Password da BD

// Stripe (preencher com as tuas chaves reais)
define('STRIPE_SECRET_KEY', 'sk_test_...');   // sk_live_... em produção
define('STRIPE_PUBLISHABLE_KEY', 'pk_test_...'); // pk_live_... em produção
define('STRIPE_WEBHOOK_SECRET', 'whsec_...');   // Do Stripe Dashboard

// Brevo (email marketing — opcional)
define('BREVO_API_KEY', '');
define('BREVO_LIST_ID', 0);

// Admin — alterar username e password antes de lançar!
// Gerar hash: php -r "echo password_hash('a_tua_password', PASSWORD_BCRYPT);"
define('ADMIN_USERNAME', 'gerente');  // NÃO usar "admin"
define('ADMIN_PASSWORD_HASH', '');    // Colar o hash gerado acima

// URL do site (sem barra final)
define('CORS_ORIGIN', 'https://auranova.pt');

// Ambiente: 'development' ou 'production'
define('APP_ENV', 'production');

// Email para notificações (contacto)
define('ADMIN_EMAIL', 'suporte@auranova.pt');