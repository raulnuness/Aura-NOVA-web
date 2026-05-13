<?php
class AuthController {
    private $db;

    public function __construct() {
        $this->db = getDB();
    }

    // Login admin
    public function login() {
        $data = json_decode(file_get_contents('php://input'), true);
        $username = trim($data['username'] ?? '');
        $password = $data['password'] ?? '';

        if (empty($username) || empty($password)) {
            http_response_code(400);
            echo json_encode(['error' => 'Username e password obrigatórios']);
            return;
        }

        $stmt = $this->db->prepare('SELECT * FROM admins WHERE username = ?');
        $stmt->execute([$username]);
        $admin = $stmt->fetch();

        if (!$admin || !password_verify($password, $admin['password_hash'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Credenciais inválidas']);
            return;
        }

        // Gerar token e guardar hash na BD
        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        $expires = date('Y-m-d H:i:s', strtotime('+7 days'));

        $this->db->prepare('UPDATE admins SET token_hash = ?, token_expires = ? WHERE id = ?')->execute([$tokenHash, $expires, $admin['id']]);

        echo json_encode([
            'token' => $token,
            'csrf_token' => csrfGetToken(),
            'username' => $admin['username'],
            'expires' => $expires
        ]);
    }

    // Logout
    public function logout() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
            $token = substr($authHeader, 7);
            $tokenHash = hash('sha256', $token);
            $this->db->prepare('UPDATE admins SET token_hash = NULL, token_expires = NULL WHERE token_hash = ?')->execute([$tokenHash]);
        }

        echo json_encode(['message' => 'Sessão terminada']);
    }

    // Verificar token
    public function verify() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            http_response_code(401);
            echo json_encode(['error' => 'Não autenticado']);
            return;
        }

        $token = substr($authHeader, 7);
        $tokenHash = hash('sha256', $token);
        $stmt = $this->db->prepare('SELECT id, username FROM admins WHERE token_hash = ? AND token_expires > NOW()');
        $stmt->execute([$tokenHash]);
        $admin = $stmt->fetch();

        if (!$admin) {
            http_response_code(401);
            echo json_encode(['error' => 'Sessão expirada']);
            return;
        }

        echo json_encode(['valid' => true, 'username' => $admin['username']]);
    }
}