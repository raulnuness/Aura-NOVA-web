<?php
class ContactController {
    private $db;

    public function __construct() {
        $this->db = getDB();
    }

    // Sanitizar strings para headers de email (previne header injection)
    private function sanitizeHeaderString($str) {
        // Remover newlines e carriage returns para prevenir header injection
        $str = str_replace(["\r", "\n", "%0d", "%0a", "%0D", "%0A"], '', $str);
        return strip_tags($str);
    }

    // Receber mensagem de contacto
    public function create() {
        $data = json_decode(file_get_contents('php://input'), true);

        // Honeypot — se o campo website estiver preenchido, é um bot
        if (!empty($data['website'])) {
            // Silenciosamente aceitar sem inserir (engana bots)
            echo json_encode(['message' => 'Mensagem enviada com sucesso']);
            return;
        }

        $required = ['name', 'email', 'message'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Campo obrigatório: $field"]);
                return;
            }
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Email inválido']);
            return;
        }

        // Usar strip_tags para o BD (htmlspecialchars só na saída)
        $stmt = $this->db->prepare('INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)');
        $stmt->execute([
            strip_tags($data['name']),
            strip_tags($data['email']),
            strip_tags($data['subject'] ?? 'Contacto via site'),
            strip_tags($data['message'])
        ]);

        // Enviar notificação por email (usando mail() — em produção usar Brevo SMTP)
        $to = 'suporte@auranova.pt';
        $subject = 'Nova mensagem de contacto: ' . $this->sanitizeHeaderString($data['subject'] ?? 'Sem assunto');
        $body = "Nome: " . strip_tags($data['name']) . "\nEmail: " . strip_tags($data['email']) . "\n\n" . strip_tags($data['message']);
        $fromEmail = $this->sanitizeHeaderString($data['email']);
        $headers = "From: noreply@auranova.pt\r\nReply-To: {$fromEmail}";

        @mail($to, $subject, $body, $headers);

        echo json_encode(['message' => 'Mensagem enviada com sucesso']);
    }

    // Admin: listar mensagens
    public function adminList() {
        $stmt = $this->db->query('SELECT * FROM contact_messages ORDER BY created_at DESC');
        echo json_encode(['messages' => $stmt->fetchAll()]);
    }

    // Admin: marcar como lida
    public function adminMarkRead($id) {
        $this->db->prepare('UPDATE contact_messages SET is_read = TRUE WHERE id = ?')->execute([$id]);
        echo json_encode(['message' => 'Mensagem marcada como lida']);
    }
}