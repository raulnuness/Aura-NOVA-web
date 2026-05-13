<?php
// Middleware de autenticação para endpoints admin
// Tokens são guardados como SHA-256 hash na BD
function requireAuth() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
        http_response_code(401);
        echo json_encode(['error' => 'Não autenticado']);
        exit;
    }

    $token = substr($authHeader, 7);
    $tokenHash = hash('sha256', $token);

    $db = getDB();
    $stmt = $db->prepare('SELECT id, username FROM admins WHERE token_hash = ? AND token_expires > NOW()');
    $stmt->execute([$tokenHash]);

    if (!$stmt->fetch()) {
        http_response_code(401);
        echo json_encode(['error' => 'Sessão expirada']);
        exit;
    }

    return $token;
}