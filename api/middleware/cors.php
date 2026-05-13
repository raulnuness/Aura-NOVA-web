<?php
// Middleware CORS + CSRF — permite pedidos do frontend e protege contra CSRF
function handleCors() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    // Origens de desenvolvimento só são permitidas em ambiente de desenvolvimento
    $devOrigins = (defined('APP_ENV') && APP_ENV === 'development') ? ['http://localhost:8000', 'http://localhost:3000'] : [];
    $allowed = array_merge([CORS_ORIGIN], $devOrigins);

    // Verificar Origin para CSRF — rejeitar pedidos sem Origin de fontes não permitidas
    $requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    // Para pedidos que alteram estado (POST, PUT, DELETE), verificar Origin/Referer
    if (in_array($requestMethod, ['POST', 'PUT', 'DELETE'])) {
        $requestOrigin = $origin ?: ($_SERVER['HTTP_REFERER'] ?? '');

        // Ignorar verificação em webhooks (Stripe envia sem Origin)
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        if (strpos($uri, 'stripe/webhook') !== false) {
            // Webhooks do Stripe são validados por assinatura — saltar verificação
        } elseif (!empty($requestOrigin)) {
            $originHost = parse_url($requestOrigin, PHP_URL_HOST);
            $allowedHosts = array_map(function($url) {
                return parse_url($url, PHP_URL_HOST);
            }, $allowed);

            if (!in_array($originHost, $allowedHosts)) {
                http_response_code(403);
                echo json_encode(['error' => 'Origem não permitida']);
                exit;
            }
        } else {
            // Pedidos sem Origin/Referer em métodos de escrita são suspeitos — bloquear
            http_response_code(403);
            echo json_encode(['error' => 'Origem não permitida']);
            exit;
        }
    }

    if (in_array($origin, $allowed)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        header("Access-Control-Allow-Origin: " . CORS_ORIGIN);
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 86400');
    header('Access-Control-Allow-Credentials: true');

    // Responder a preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}