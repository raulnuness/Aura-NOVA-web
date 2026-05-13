<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Stripe\Stripe;
use Stripe\Checkout\Session;

class StripeController {
    // Criar sessão de checkout Stripe
    public function createSession() {
        $data = json_decode(file_get_contents('php://input'), true);
        $orderId = intval($data['order_id'] ?? 0);

        if (!$orderId) {
            http_response_code(400);
            echo json_encode(['error' => 'ID da encomenda obrigatório']);
            return;
        }

        // Buscar encomenda
        $db = getDB();
        $stmt = $db->prepare('SELECT * FROM orders WHERE id = ?');
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();

        if (!$order) {
            http_response_code(404);
            echo json_encode(['error' => 'Encomenda não encontrada']);
            return;
        }

        if ($order['status'] !== 'pending') {
            http_response_code(400);
            echo json_encode(['error' => 'Encomenda já processada']);
            return;
        }

        // Buscar itens
        $stmt = $db->prepare('SELECT * FROM order_items WHERE order_id = ?');
        $stmt->execute([$orderId]);
        $items = $stmt->fetchAll();

        // Configurar Stripe
        Stripe::setApiKey(STRIPE_SECRET_KEY);

        // Criar line items
        $lineItems = [];
        foreach ($items as $item) {
            $lineItems[] = [
                'price_data' => [
                    'currency' => 'eur',
                    'unit_amount' => intval(round($item['unit_price'] * 100)), // centavos
                    'product_data' => [
                        'name' => $item['product_name'],
                    ],
                ],
                'quantity' => $item['quantity'],
            ];
        }

        // Adicionar envio como line item se não for grátis
        if ($order['shipping'] > 0) {
            $lineItems[] = [
                'price_data' => [
                    'currency' => 'eur',
                    'unit_amount' => intval(round($order['shipping'] * 100)),
                    'product_data' => [
                        'name' => 'Envio',
                    ],
                ],
                'quantity' => 1,
            ];
        }

        // Se há desconto, criar cupão Stripe
        $couponId = null;
        if ($order['discount'] > 0) {
            // Determinar percentagem de desconto
            $discountPercent = round(($order['discount'] / ($order['subtotal'] + $order['shipping'])) * 100);

            try {
                $coupon = \Stripe\Coupon::create([
                    'percent_off' => $discountPercent,
                    'duration' => 'once',
                ]);
                $couponId = $coupon->id;
            } catch (\Exception $e) {
                // Se falhar, continuar sem cupão Stripe
                $couponId = null;
            }
        }

        // URLs de redirecionamento
        $baseUrl = CORS_ORIGIN;
        $successUrl = $baseUrl . '/pages/obrigado.html?order=' . $order['order_number'];
        $cancelUrl = $baseUrl . '/?cancel=1';

        try {
            $sessionData = [
                'mode' => 'payment',
                'line_items' => $lineItems,
                'success_url' => $successUrl,
                'cancel_url' => $cancelUrl,
                'customer_email' => $order['customer_email'],
                'metadata' => [
                    'order_id' => $orderId,
                    'order_number' => $order['order_number']
                ],
                'shipping_address_collection' => [
                    'allowed_countries' => ['PT']
                ],
                'billing_address_collection' => 'auto',
                'locale' => 'pt',
            ];

            if ($couponId) {
                $sessionData['discounts'] = [['coupon' => $couponId]];
            }

            $session = Session::create($sessionData);

            // Guardar session ID na encomenda
            $db->prepare('UPDATE orders SET stripe_session_id = ? WHERE id = ?')->execute([$session->id, $orderId]);

            echo json_encode(['url' => $session->url]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao criar sessão de pagamento: ' . $e->getMessage()]);
        }
    }

    // Webhook do Stripe
    public function handleWebhook() {
        $payload = file_get_contents('php://input');
        $sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

        Stripe::setApiKey(STRIPE_SECRET_KEY);

        try {
            $event = \Stripe\Webhook::constructEvent(
                $payload,
                $sigHeader,
                STRIPE_WEBHOOK_SECRET
            );
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            http_response_code(400);
            echo json_encode(['error' => 'Assinatura inválida']);
            return;
        } catch (\UnexpectedValueException $e) {
            http_response_code(400);
            echo json_encode(['error' => 'Payload inválido']);
            return;
        }

        $db = getDB();

        switch ($event->type) {
            case 'checkout.session.completed':
                $session = $event->data->object;

                // Atualizar estado da encomenda para pago
                $stmt = $db->prepare('UPDATE orders SET status = ? WHERE stripe_session_id = ?');
                $stmt->execute(['paid', $session->id]);

                // Adicionar email do cliente aos subscritores se ainda não existe
                $customerEmail = $session->customer_email ?? $session->customer_details->email ?? null;
                if ($customerEmail) {
                    try {
                        $db->prepare('INSERT INTO subscribers (email, source) VALUES (?, ?)')->execute([$customerEmail, 'checkout']);
                    } catch (PDOException $e) {
                        // Ignorar se já existe
                    }
                }
                break;

            case 'checkout.session.expired':
                $session = $event->data->object;
                $db->prepare('UPDATE orders SET status = ? WHERE stripe_session_id = ?')->execute(['cancelled', $session->id]);
                break;
        }

        http_response_code(200);
        echo json_encode(['received' => true]);
    }
}