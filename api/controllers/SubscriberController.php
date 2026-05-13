<?php
class SubscriberController {
    private $db;

    public function __construct() {
        $this->db = getDB();
    }

    // Registar subscritor
    public function create() {
        $data = json_decode(file_get_contents('php://input'), true);
        $email = trim($data['email'] ?? '');
        $source = $data['source'] ?? 'newsletter';

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Email inválido']);
            return;
        }

        if (!in_array($source, ['popup', 'newsletter', 'checkout'])) {
            $source = 'newsletter';
        }

        // Inserir ou ignorar se já existe
        try {
            $stmt = $this->db->prepare('INSERT INTO subscribers (email, source) VALUES (?, ?)');
            $stmt->execute([$email, $source]);
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                // Email já existe — atualizar source se necessário
                $this->db->prepare('UPDATE subscribers SET source = ? WHERE email = ?')->execute([$source, $email]);
            }
        }

        // Enviar para Brevo (se configurado)
        $this->sendToBrevo($email, $source);

        echo json_encode(['message' => 'Subscrito com sucesso']);
    }

    // Enviar para API do Brevo
    private function sendToBrevo($email, $source) {
        if (empty(BREVO_API_KEY) || empty(BREVO_LIST_ID)) {
            return; // Brevo não configurado
        }

        $data = [
            'email' => $email,
            'listIds' => [intval(BREVO_LIST_ID)],
            'attributes' => ['SOURCE' => $source]
        ];

        $ch = curl_init('https://api.brevo.com/v3/contacts');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'api-key: ' . BREVO_API_KEY
            ],
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_TIMEOUT => 5
        ]);
        curl_exec($ch);
        curl_close($ch);
    }

    // Admin: listar subscritores
    public function adminList() {
        $stmt = $this->db->query('SELECT * FROM subscribers ORDER BY created_at DESC');
        $subscribers = $stmt->fetchAll();
        echo json_encode(['subscribers' => $subscribers]);
    }

    // Admin: exportar CSV
    public function adminExport() {
        $stmt = $this->db->query('SELECT email, source, created_at FROM subscribers WHERE is_active = TRUE ORDER BY created_at DESC');
        $subscribers = $stmt->fetchAll();

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=subscritores_auranova.csv');

        $output = fopen('php://output', 'w');
        fputcsv($output, ['Email', 'Fonte', 'Data']);

        foreach ($subscribers as $s) {
            fputcsv($output, [$s['email'], $s['source'], $s['created_at']]);
        }

        fclose($output);
    }

    // Admin: eliminar subscritor
    public function adminDelete($id) {
        $this->db->prepare('DELETE FROM subscribers WHERE id = ?')->execute([$id]);
        echo json_encode(['message' => 'Subscritor eliminado']);
    }
}