<?php
class ContactController {
    private $db;

    public function __construct() {
        $this->db = getDB();
    }

    // Receber mensagem de contacto
    public function create() {
        $data = json_decode(file_get_contents('php://input'), true);

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

        $stmt = $this->db->prepare('INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)');
        $stmt->execute([
            htmlspecialchars($data['name']),
            htmlspecialchars($data['email']),
            htmlspecialchars($data['subject'] ?? 'Contacto via site'),
            htmlspecialchars($data['message'])
        ]);

        // Enviar notificação por email (usando mail() — em produção usar Brevo SMTP)
        $to = 'suporte@auranova.pt';
        $subject = 'Nova mensagem de contacto: ' . ($data['subject'] ?? 'Sem assunto');
        $body = "Nome: {$data['name']}\nEmail: {$data['email']}\n\n{$data['message']}";
        $headers = "From: noreply@auranova.pt\r\nReply-To: {$data['email']}";

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