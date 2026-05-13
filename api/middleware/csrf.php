<?php
// Middleware CSRF — protege contra Cross-Site Request Forgery
// Tokens CSRF são gerados por sessão e validados em pedidos que alteram estado

function csrfInit() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start([
            'cookie_httponly' => true,
            'cookie_secure' => isset($_SERVER['HTTPS']),
            'cookie_samesite' => 'Strict',
            'name' => 'auranova_session'
        ]);
    }
}

function csrfGetToken() {
    csrfInit();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrfValidate() {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($method, ['POST', 'PUT', 'DELETE'])) {
        return true;
    }

    // Webhooks do Stripe são validados por assinatura, não por CSRF
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (strpos($uri, 'stripe/webhook') !== false) {
        return true;
    }

    // Login admin não precisa de CSRF (é o ponto de entrada)
    if (strpos($uri, 'admin/login') !== false) {
        return true;
    }

    csrfInit();

    // Verificar token no header X-CSRF-Token ou no body _csrf
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (empty($token)) {
        $data = json_decode(file_get_contents('php://input'), true);
        $token = $data['_csrf'] ?? '';
    }

    if (empty($token) || empty($_SESSION['csrf_token'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Token CSRF em falta']);
        exit;
    }

    if (!hash_equals($_SESSION['csrf_token'], $token)) {
        http_response_code(403);
        echo json_encode(['error' => 'Token CSRF inválido']);
        exit;
    }

    return true;
}