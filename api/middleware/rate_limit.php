<?php
// Rate limiting por IP — limitar pedidos por janela de tempo
function applyRateLimit($maxRequests = 60, $windowSeconds = 60) {
    // Usar REMOTE_ADDR diretamente — não confiar em headers do cliente
    // pois podem ser spoofados. Se atrás de um reverse proxy de confiança,
    // o proxy deve configurar REMOTE_ADDR corretamente.
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

    $key = 'rate_' . md5($ip);

    // Usar diretório persistente para rate limiting
    $dir = __DIR__ . '/../cache/rate_limit';
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }

    $file = $dir . '/' . $key;
    $now = time();

    // Limpar ficheiros antigos (probabilisticamente)
    if (mt_rand(1, 100) === 1) {
        $files = glob($dir . '/rate_*');
        foreach ($files as $f) {
            if (filemtime($f) < $now - 3600) {
                @unlink($f);
            }
        }
    }

    $data = ['count' => 0, 'start' => $now];

    if (file_exists($file)) {
        $content = @file_get_contents($file);
        if ($content) {
            $data = json_decode($content, true) ?: $data;
        }
    }

    // Reset da janela se expirou
    if (!isset($data['start']) || ($now - $data['start']) > $windowSeconds) {
        $data = ['count' => 1, 'start' => $now];
    } else {
        $data['count']++;
    }

    // Verificar limite
    if ($data['count'] > $maxRequests) {
        http_response_code(429);
        header('Retry-After: ' . ($windowSeconds - ($now - $data['start'])));
        echo json_encode(['error' => 'Muitos pedidos. Tenta novamente dentro de alguns segundos.']);
        exit;
    }

    // Guardar contador
    file_put_contents($file, json_encode($data), LOCK_EX);

    // Headers informativos
    header('X-RateLimit-Limit: ' . $maxRequests);
    header('X-RateLimit-Remaining: ' . max(0, $maxRequests - $data['count']));
}