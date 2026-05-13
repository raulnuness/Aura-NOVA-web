<?php
class CouponController {
    private $db;

    public function __construct() {
        $this->db = getDB();
    }

    // Admin: listar cupões
    public function adminList() {
        $stmt = $this->db->query('SELECT * FROM coupons ORDER BY id ASC');
        echo json_encode(['coupons' => $stmt->fetchAll()]);
    }

    // Admin: criar cupão
    public function adminCreate() {
        $data = json_decode(file_get_contents('php://input'), true);

        $required = ['code', 'type', 'value'];
        foreach ($required as $field) {
            if (!isset($data[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Campo obrigatório: $field"]);
                return;
            }
        }

        if (!in_array($data['type'], ['percent', 'fixed', 'shipping'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Tipo inválido']);
            return;
        }

        $stmt = $this->db->prepare('INSERT INTO coupons (code, type, value, min_order, max_uses, is_active, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            strtoupper($data['code']),
            $data['type'],
            $data['value'],
            $data['min_order'] ?? 0,
            $data['max_uses'] ?? null,
            $data['is_active'] ?? true,
            $data['expires_at'] ?? null
        ]);

        echo json_encode(['id' => $this->db->lastInsertId(), 'message' => 'Cupão criado']);
    }

    // Admin: atualizar cupão
    public function adminUpdate($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        $fields = [];
        $values = [];

        foreach (['code', 'type', 'value', 'min_order', 'max_uses', 'is_active', 'expires_at'] as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = ?";
                $values[] = $data[$field];
            }
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'Nenhum campo para atualizar']);
            return;
        }

        $values[] = $id;
        $sql = 'UPDATE coupons SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $this->db->prepare($sql)->execute($values);

        echo json_encode(['message' => 'Cupão atualizado']);
    }

    // Admin: eliminar cupão
    public function adminDelete($id) {
        $this->db->prepare('DELETE FROM coupons WHERE id = ?')->execute([$id]);
        echo json_encode(['message' => 'Cupão eliminado']);
    }
}