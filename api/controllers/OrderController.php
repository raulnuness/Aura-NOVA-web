<?php
class OrderController {
    private $db;

    public function __construct() {
        $this->db = getDB();
    }

    // Criar encomenda
    public function create() {
        $data = json_decode(file_get_contents('php://input'), true);

        // Iniciar transação para garantir atomicidade
        $this->db->beginTransaction();

        // Validação dos campos obrigatórios
        $required = ['customer_name', 'customer_email', 'address', 'items'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Campo obrigatório: $field"]);
                return;
            }
        }

        if (!filter_var($data['customer_email'], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Email inválido']);
            return;
        }

        // Gerar número de encomenda
        $orderNumber = 'AN-' . date('Ymd') . '-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 5));

        // Calcular totais
        $subtotal = 0;
        $items = [];

        foreach ($data['items'] as $item) {
            // Buscar preço real do produto na BD (prevenir manipulação de preços)
            $stmt = $this->db->prepare('SELECT id, name, price FROM products WHERE id = ? AND is_active = TRUE');
            $stmt->execute([$item['id']]);
            $product = $stmt->fetch();

            if (!$product) {
                http_response_code(400);
                echo json_encode(['error' => "Produto não encontrado: {$item['id']}"]);
                return;
            }

            $qty = max(1, intval($item['qty'] ?? 1));
            $items[] = [
                'product_id' => $product['id'],
                'product_name' => $product['name'],
                'unit_price' => $product['price'],
                'quantity' => $qty
            ];
            $subtotal += $product['price'] * $qty;
        }

        // Validar cupão
        $discount = 0;
        $couponCode = $data['coupon_code'] ?? null;
        if ($couponCode) {
            $coupon = $this->validateCouponInternal($couponCode, $subtotal);
            if ($coupon['valid']) {
                $discount = $coupon['discount'];
            }
        }

        // Envio
        $shipping = $subtotal >= 35 ? 0 : 3.99;

        // Desconto de envio grátis
        if ($couponCode) {
            $couponData = $this->getCouponData($couponCode);
            if ($couponData && $couponData['type'] === 'shipping') {
                $shipping = 0;
                $discount = $shipping; // desconto igual ao valor do envio
            }
        }

        $total = $subtotal - $discount + $shipping;
        if ($total < 0) $total = 0;

        try {
            $stmt = $this->db->prepare('INSERT INTO orders (order_number, customer_name, customer_surname, customer_email, customer_phone, address, postal_code, city, subtotal, discount, shipping, total, coupon_code, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $orderNumber,
                $data['customer_name'],
                $data['customer_surname'] ?? null,
                $data['customer_email'],
                $data['customer_phone'] ?? null,
                $data['address'],
                $data['postal_code'] ?? null,
                $data['city'] ?? null,
                $subtotal,
                $discount,
                $shipping,
                $total,
                $couponCode,
                $data['payment_method'] ?? 'stripe'
            ]);

            $orderId = $this->db->lastInsertId();

            // Inserir itens
            $stmt = $this->db->prepare('INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity) VALUES (?, ?, ?, ?, ?)');
            foreach ($items as $item) {
                $stmt->execute([$orderId, $item['product_id'], $item['product_name'], $item['unit_price'], $item['quantity']]);
            }

        // Incrementar uso do cupão (atómico — verificar limite ao incrementar)
        if ($couponCode) {
            $stmt = $this->db->prepare('UPDATE coupons SET used_count = used_count + 1 WHERE code = ? AND (max_uses IS NULL OR used_count < max_uses)');
            $stmt->execute([$couponCode]);
            if ($stmt->rowCount() === 0) {
                // Cupão atingiu o limite entre a validação e a criação — reverter
                $this->db->rollBack();
                http_response_code(400);
                echo json_encode(['error' => 'Cupão esgotado']);
                return;
            }
        }

        $this->db->commit();

        echo json_encode([
            'order_id' => $orderId,
            'order_number' => $orderNumber,
            'subtotal' => round($subtotal, 2),
            'discount' => round($discount, 2),
            'shipping' => round($shipping, 2),
            'total' => round($total, 2)
        ]);
    }

    // Validar cupão (endpoint público)
    public function validateCoupon() {
        $data = json_decode(file_get_contents('php://input'), true);
        $code = strtoupper(trim($data['code'] ?? ''));
        $subtotal = floatval($data['subtotal'] ?? 0);

        $result = $this->validateCouponInternal($code, $subtotal);
        echo json_encode($result);
    }

    private function validateCouponInternal($code, $subtotal) {
        $stmt = $this->db->prepare('SELECT * FROM coupons WHERE code = ? AND is_active = TRUE');
        $stmt->execute([$code]);
        $coupon = $stmt->fetch();

        if (!$coupon) {
            return ['valid' => false, 'message' => 'Código inválido'];
        }

        if ($coupon['expires_at'] && strtotime($coupon['expires_at']) < time()) {
            return ['valid' => false, 'message' => 'Código expirado'];
        }

        if ($coupon['max_uses'] !== null && $coupon['used_count'] >= $coupon['max_uses']) {
            return ['valid' => false, 'message' => 'Código esgotado'];
        }

        if ($subtotal < $coupon['min_order']) {
            return ['valid' => false, 'message' => 'Pedido mínimo de ' . number_format($coupon['min_order'], 2, ',', '') . '€'];
        }

        $discount = 0;
        if ($coupon['type'] === 'percent') {
            $discount = $subtotal * ($coupon['value'] / 100);
        } elseif ($coupon['type'] === 'shipping') {
            $discount = $subtotal >= 35 ? 0 : 3.99; // valor do envio
        } elseif ($coupon['type'] === 'fixed') {
            $discount = $coupon['value'];
        }

        return [
            'valid' => true,
            'code' => $code,
            'type' => $coupon['type'],
            'value' => floatval($coupon['value']),
            'discount' => round($discount, 2),
            'message' => "Código $code aplicado!"
        ];
    }

    private function getCouponData($code) {
        $stmt = $this->db->prepare('SELECT * FROM coupons WHERE code = ? AND is_active = TRUE');
        $stmt->execute([strtoupper($code)]);
        return $stmt->fetch();
    }

    // Admin: listar encomendas
    public function adminList() {
        $status = $_GET['status'] ?? null;
        $search = $_GET['search'] ?? null;

        $sql = 'SELECT o.*, COUNT(oi.id) as item_count FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id';
        $params = [];
        $where = [];

        if ($status) {
            $where[] = 'o.status = ?';
            $params[] = $status;
        }
        if ($search) {
            $where[] = '(o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ?)';
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' GROUP BY o.id ORDER BY o.created_at DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $orders = $stmt->fetchAll();

        echo json_encode(['orders' => $orders]);
    }

    // Admin: obter detalhe da encomenda
    public function adminGet($id) {
        $stmt = $this->db->prepare('SELECT * FROM orders WHERE id = ?');
        $stmt->execute([$id]);
        $order = $stmt->fetch();

        if (!$order) {
            http_response_code(404);
            echo json_encode(['error' => 'Encomenda não encontrada']);
            return;
        }

        $stmt = $this->db->prepare('SELECT * FROM order_items WHERE order_id = ?');
        $stmt->execute([$id]);
        $order['items'] = $stmt->fetchAll();

        echo json_encode(['order' => $order]);
    }

    // Admin: atualizar estado da encomenda
    public function adminUpdate($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        $allowed = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];

        if (!isset($data['status']) || !in_array($data['status'], $allowed)) {
            http_response_code(400);
            echo json_encode(['error' => 'Estado inválido']);
            return;
        }

        $this->db->prepare('UPDATE orders SET status = ? WHERE id = ?')->execute([$data['status'], $id]);
        echo json_encode(['message' => 'Estado atualizado']);
    }

    // Tracking público — cliente consulta estado da encomenda
    public function track($orderNumber) {
        // Rate limiting: 10 pedidos por minuto por IP
        applyRateLimit(10, 60);

        $stmt = $this->db->prepare('SELECT order_number, status, created_at, updated_at FROM orders WHERE order_number = ?');
        $stmt->execute([$orderNumber]);
        $order = $stmt->fetch();

        if (!$order) {
            http_response_code(404);
            echo json_encode(['error' => 'Encomenda não encontrada']);
            return;
        }

        $statusLabels = [
            'pending' => 'Pagamento pendente',
            'paid' => 'Pagamento confirmado',
            'shipped' => 'Enviado',
            'delivered' => 'Entregue',
            'cancelled' => 'Cancelado',
            'refunded' => 'Reembolsado'
        ];

        echo json_encode([
            'order_number' => $order['order_number'],
            'status' => $order['status'],
            'status_label' => $statusLabels[$order['status']] ?? $order['status'],
            'created_at' => $order['created_at'],
            'updated_at' => $order['updated_at']
        ]);
    }

    // Admin: estatísticas
    public function adminStats() {
        $stats = [];

        $stats['total_revenue'] = $this->db->query("SELECT COALESCE(SUM(total), 0) FROM orders WHERE status IN ('paid','shipped','delivered')")->fetchColumn();
        $stats['orders_total'] = $this->db->query("SELECT COUNT(*) FROM orders")->fetchColumn();
        $stats['orders_today'] = $this->db->query("SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()")->fetchColumn();
        $stats['orders_pending'] = $this->db->query("SELECT COUNT(*) FROM orders WHERE status = 'pending'")->fetchColumn();
        $stats['subscribers'] = $this->db->query("SELECT COUNT(*) FROM subscribers WHERE is_active = TRUE")->fetchColumn();
        $stats['avg_order_value'] = $this->db->query("SELECT COALESCE(AVG(total), 0) FROM orders WHERE status IN ('paid','shipped','delivered')")->fetchColumn();

        echo json_encode(['stats' => $stats]);
    }
}