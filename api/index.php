<?php
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/middleware/cors.php';
require_once __DIR__ . '/middleware/csrf.php';
require_once __DIR__ . '/middleware/auth.php';
require_once __DIR__ . '/middleware/rate_limit.php';

// Controllers
require_once __DIR__ . '/controllers/ProductController.php';
require_once __DIR__ . '/controllers/OrderController.php';
require_once __DIR__ . '/controllers/SubscriberController.php';
require_once __DIR__ . '/controllers/CouponController.php';
require_once __DIR__ . '/controllers/ContactController.php';
require_once __DIR__ . '/controllers/StripeController.php';
require_once __DIR__ . '/controllers/AuthController.php';

// CORS
handleCors();

// Rate limiting: 60 pedidos por minuto por IP
applyRateLimit(60, 60);

// CSRF validation para pedidos que alteram estado
csrfValidate();

// Content-Type JSON por defeito
header('Content-Type: application/json; charset=utf-8');

// Roteamento
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$basePath = dirname($_SERVER['SCRIPT_NAME']);
$uri = substr($uri, strlen($basePath));
$uri = '/' . trim($uri, '/');

// Remover prefixo /api se existir
$uri = preg_replace('#^/api#', '', $uri);
$uri = '/' . trim($uri, '/');
if ($uri === '/') $uri = '';

// Dividir URI em segmentos
$segments = array_filter(explode('/', $uri));
$segments = array_values($segments);

try {
    route($method, $segments);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno do servidor']);
}

function route($method, $segments) {
    $count = count($segments);

    // GET /csrf-token — endpoint para o frontend obter token CSRF
    if ($segments[0] === 'csrf-token' && $method === 'GET') {
        echo json_encode(['csrf_token' => csrfGetToken()]);
        return;
    }

    // GET /products
    if ($segments[0] === 'products' && $method === 'GET' && $count === 1) {
        (new ProductController())->list();
        return;
    }

    // GET /products/{slug}
    if ($segments[0] === 'products' && $method === 'GET' && $count === 2) {
        (new ProductController())->getBySlug($segments[1]);
        return;
    }

    // POST /orders
    if ($segments[0] === 'orders' && $method === 'POST' && $count === 1) {
        (new OrderController())->create();
        return;
    }

    // POST /orders/validate
    if ($segments[0] === 'orders' && $segments[1] === 'validate' && $method === 'POST') {
        (new OrderController())->validateCoupon();
        return;
    }

    // POST /subscribers
    if ($segments[0] === 'subscribers' && $method === 'POST' && $count === 1) {
        (new SubscriberController())->create();
        return;
    }

    // POST /contact
    if ($segments[0] === 'contact' && $method === 'POST' && $count === 1) {
        (new ContactController())->create();
        return;
    }

    // POST /stripe/checkout
    if ($segments[0] === 'stripe' && $segments[1] === 'checkout' && $method === 'POST') {
        (new StripeController())->createSession();
        return;
    }

    // POST /stripe/webhook
    if ($segments[0] === 'stripe' && $segments[1] === 'webhook' && $method === 'POST') {
        (new StripeController())->handleWebhook();
        return;
    }

    // GET /orders/track/{order_number}
    if ($segments[0] === 'orders' && $segments[1] === 'track' && $method === 'GET' && $count === 3) {
        (new OrderController())->track($segments[2]);
        return;
    }

    // === ADMIN ROUTES ===

    // POST /admin/login
    if ($segments[0] === 'admin' && $segments[1] === 'login' && $method === 'POST') {
        (new AuthController())->login();
        return;
    }

    // POST /admin/logout
    if ($segments[0] === 'admin' && $segments[1] === 'logout' && $method === 'POST') {
        (new AuthController())->logout();
        return;
    }

    // GET /admin/verify
    if ($segments[0] === 'admin' && $segments[1] === 'verify' && $method === 'GET') {
        (new AuthController())->verify();
        return;
    }

    // Todas as rotas admin abaixo requerem autenticação
    if (str_starts_with(implode('/', $segments), 'admin')) {
        requireAuth();
    }

    // GET /admin/orders
    if ($segments[0] === 'admin' && $segments[1] === 'orders' && $method === 'GET' && $count === 2) {
        (new OrderController())->adminList();
        return;
    }

    // GET /admin/orders/{id}
    if ($segments[0] === 'admin' && $segments[1] === 'orders' && $method === 'GET' && $count === 3) {
        (new OrderController())->adminGet($segments[2]);
        return;
    }

    // PUT /admin/orders/{id}
    if ($segments[0] === 'admin' && $segments[1] === 'orders' && $method === 'PUT' && $count === 3) {
        (new OrderController())->adminUpdate($segments[2]);
        return;
    }

    // GET /admin/stats
    if ($segments[0] === 'admin' && $segments[1] === 'stats' && $method === 'GET') {
        (new OrderController())->adminStats();
        return;
    }

    // GET /admin/products
    if ($segments[0] === 'admin' && $segments[1] === 'products' && $method === 'GET' && $count === 2) {
        (new ProductController())->adminList();
        return;
    }

    // POST /admin/products
    if ($segments[0] === 'admin' && $segments[1] === 'products' && $method === 'POST' && $count === 2) {
        (new ProductController())->adminCreate();
        return;
    }

    // PUT /admin/products/{id}
    if ($segments[0] === 'admin' && $segments[1] === 'products' && $method === 'PUT' && $count === 3) {
        (new ProductController())->adminUpdate($segments[2]);
        return;
    }

    // DELETE /admin/products/{id}
    if ($segments[0] === 'admin' && $segments[1] === 'products' && $method === 'DELETE' && $count === 3) {
        (new ProductController())->adminDelete($segments[2]);
        return;
    }

    // GET /admin/subscribers
    if ($segments[0] === 'admin' && $segments[1] === 'subscribers' && $method === 'GET' && $count === 2) {
        (new SubscriberController())->adminList();
        return;
    }

    // GET /admin/subscribers/export
    if ($segments[0] === 'admin' && $segments[1] === 'subscribers' && $segments[2] === 'export' && $method === 'GET') {
        (new SubscriberController())->adminExport();
        return;
    }

    // DELETE /admin/subscribers/{id}
    if ($segments[0] === 'admin' && $segments[1] === 'subscribers' && $method === 'DELETE' && $count === 3) {
        (new SubscriberController())->adminDelete($segments[2]);
        return;
    }

    // GET /admin/coupons
    if ($segments[0] === 'admin' && $segments[1] === 'coupons' && $method === 'GET' && $count === 2) {
        (new CouponController())->adminList();
        return;
    }

    // POST /admin/coupons
    if ($segments[0] === 'admin' && $segments[1] === 'coupons' && $method === 'POST' && $count === 2) {
        (new CouponController())->adminCreate();
        return;
    }

    // PUT /admin/coupons/{id}
    if ($segments[0] === 'admin' && $segments[1] === 'coupons' && $method === 'PUT' && $count === 3) {
        (new CouponController())->adminUpdate($segments[2]);
        return;
    }

    // DELETE /admin/coupons/{id}
    if ($segments[0] === 'admin' && $segments[1] === 'coupons' && $method === 'DELETE' && $count === 3) {
        (new CouponController())->adminDelete($segments[2]);
        return;
    }

    // GET /admin/contact
    if ($segments[0] === 'admin' && $segments[1] === 'contact' && $method === 'GET') {
        (new ContactController())->adminList();
        return;
    }

    // PUT /admin/contact/{id}/read
    if ($segments[0] === 'admin' && $segments[1] === 'contact' && $method === 'PUT' && $count === 4 && $segments[3] === 'read') {
        (new ContactController())->adminMarkRead($segments[2]);
        return;
    }

    // Rota não encontrada
    http_response_code(404);
    echo json_encode(['error' => 'Rota não encontrada']);
}