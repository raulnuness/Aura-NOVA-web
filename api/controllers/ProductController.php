<?php
class ProductController {
    private $db;

    public function __construct() {
        $this->db = getDB();
    }

    public function list() {
        $stmt = $this->db->query('SELECT * FROM products WHERE is_active = TRUE ORDER BY id ASC');
        $products = $stmt->fetchAll();

        // Converter features de JSON para array
        foreach ($products as &$p) {
            $p['features'] = json_decode($p['features'], true) ?: [];
            $p['isNew'] = (bool)$p['is_new'];
            unset($p['is_new'], $p['is_active'], $p['created_at'], $p['updated_at']);
        }

        echo json_encode(['products' => $products]);
    }

    public function getBySlug($slug) {
        $stmt = $this->db->prepare('SELECT * FROM products WHERE slug = ? AND is_active = TRUE');
        $stmt->execute([$slug]);
        $product = $stmt->fetch();

        if (!$product) {
            http_response_code(404);
            echo json_encode(['error' => 'Produto não encontrado']);
            return;
        }

        $product['features'] = json_decode($product['features'], true) ?: [];
        $product['isNew'] = (bool)$product['is_new'];
        unset($product['is_new'], $product['is_active']);

        echo json_encode(['product' => $product]);
    }

    // Admin: listar todos (incluindo inativos)
    public function adminList() {
        $stmt = $this->db->query('SELECT * FROM products ORDER BY id ASC');
        $products = $stmt->fetchAll();
        foreach ($products as &$p) {
            $p['features'] = json_decode($p['features'], true) ?: [];
            $p['isNew'] = (bool)$p['is_new'];
        }
        echo json_encode(['products' => $products]);
    }

    // Admin: criar produto
    public function adminCreate() {
        $data = json_decode(file_get_contents('php://input'), true);

        $required = ['name', 'slug', 'category', 'price', 'description'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Campo obrigatório: $field"]);
                return;
            }
        }

        $stmt = $this->db->prepare('INSERT INTO products (slug, name, category, price, old_price, description, features, image, badge, rating, reviews_count, is_new) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $data['slug'],
            $data['name'],
            $data['category'],
            $data['price'],
            $data['old_price'] ?? null,
            $data['description'],
            json_encode($data['features'] ?? []),
            $data['image'] ?? null,
            $data['badge'] ?? null,
            $data['rating'] ?? 0,
            $data['reviews_count'] ?? 0,
            $data['is_new'] ?? false
        ]);

        echo json_encode(['id' => $this->db->lastInsertId(), 'message' => 'Produto criado']);
    }

    // Admin: atualizar produto
    public function adminUpdate($id) {
        $data = json_decode(file_get_contents('php://input'), true);

        $fields = [];
        $values = [];
        foreach (['name', 'slug', 'category', 'price', 'old_price', 'description', 'features', 'image', 'badge', 'rating', 'reviews_count', 'is_new', 'is_active'] as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = ?";
                $values[] = $field === 'features' ? json_encode($data[$field]) : $data[$field];
            }
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'Nenhum campo para atualizar']);
            return;
        }

        $values[] = $id;
        $sql = 'UPDATE products SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $this->db->prepare($sql)->execute($values);

        echo json_encode(['message' => 'Produto atualizado']);
    }

    // Admin: eliminar produto (soft delete)
    public function adminDelete($id) {
        $this->db->prepare('UPDATE products SET is_active = FALSE WHERE id = ?')->execute([$id]);
        echo json_encode(['message' => 'Produto desativado']);
    }
}