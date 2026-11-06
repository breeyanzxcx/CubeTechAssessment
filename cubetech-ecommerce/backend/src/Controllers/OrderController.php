<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;
use Exception;

class OrderController
{
    public function store(): void
    {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if (!$data) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid JSON payload.'
            ]);
            return;
        }

        // Customer details
        $customerName = trim($data['customer_name'] ?? '');
        $email = trim($data['email'] ?? ($data['customer_email'] ?? ''));
        $contactNumber = trim($data['contact_number'] ?? ($data['customer_contact'] ?? ''));
        $deliveryAddress = trim($data['delivery_address'] ?? '');
        $paymentMethodRaw = $data['payment_method'] ?? 'COD';
        $notes = !empty($data['notes']) ? trim($data['notes']) : null;
        $items = $data['items'] ?? [];

        if (empty($customerName) || empty($email) || empty($contactNumber) || empty($deliveryAddress)) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => 'All required customer information fields must be provided.'
            ]);
            return;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => 'Please provide a valid email address.'
            ]);
            return;
        }

        if (empty($items) || !is_array($items)) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => 'Your cart is empty.'
            ]);
            return;
        }

        // Map frontend payment method to MySQL ENUM('COD', 'E-Wallet', 'Bank Transfer')
        $paymentMethodMap = [
            'COD' => 'COD',
            'E_WALLET' => 'E-Wallet',
            'E-WALLET' => 'E-Wallet',
            'E-Wallet' => 'E-Wallet',
            'BANK_TRANSFER' => 'Bank Transfer',
            'BANK TRANSFER' => 'Bank Transfer',
            'Bank Transfer' => 'Bank Transfer',
        ];

        $paymentMethod = $paymentMethodMap[$paymentMethodRaw] ?? null;
        if (!$paymentMethod) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid payment method selected.'
            ]);
            return;
        }

        $pdo = Database::connect();

        try {
            $pdo->beginTransaction();

            $subtotal = 0;
            $orderItemsToInsert = [];

            // Verify availability and stock for each item
            foreach ($items as $item) {
                $productId = (int) ($item['product_id'] ?? $item['id'] ?? 0);
                $quantity = (int) ($item['quantity'] ?? 0);

                if ($productId <= 0 || $quantity <= 0) {
                    throw new Exception('Invalid product or quantity in order items.');
                }

                $stmt = $pdo->prepare("SELECT id, name, price, stock, is_active FROM products WHERE id = :id FOR UPDATE");
                $stmt->execute(['id' => $productId]);
                $product = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$product || !$product['is_active']) {
                    throw new Exception('One or more products in your cart are no longer available.');
                }

                if ((int) $product['stock'] < $quantity) {
                    throw new Exception("Insufficient stock for \"{$product['name']}\". Only {$product['stock']} available.");
                }

                $unitPrice = (float) $product['price'];
                $lineTotal = $unitPrice * $quantity;
                $subtotal += $lineTotal;

                $orderItemsToInsert[] = [
                    'product_id' => $product['id'],
                    'product_name' => $product['name'],
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'line_total' => $lineTotal,
                ];
            }

            $total = $subtotal;

            // Generate unique human-readable order number (e.g. ORD-20261106-A1B2C)
            $orderNumber = 'ORD-' . date('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));

            // Insert into orders table
            $orderStmt = $pdo->prepare("
                INSERT INTO orders (
                    order_number,
                    customer_name,
                    customer_email,
                    customer_contact,
                    delivery_address,
                    payment_method,
                    notes,
                    subtotal,
                    total,
                    status
                ) VALUES (
                    :order_number,
                    :customer_name,
                    :customer_email,
                    :customer_contact,
                    :delivery_address,
                    :payment_method,
                    :notes,
                    :subtotal,
                    :total,
                    'Pending'
                )
            ");

            $orderStmt->execute([
                'order_number' => $orderNumber,
                'customer_name' => $customerName,
                'customer_email' => $email,
                'customer_contact' => $contactNumber,
                'delivery_address' => $deliveryAddress,
                'payment_method' => $paymentMethod,
                'notes' => $notes,
                'subtotal' => $subtotal,
                'total' => $total,
            ]);

            $orderId = (int) $pdo->lastInsertId();

            // Insert order items & deduct product stock
            $itemStmt = $pdo->prepare("
                INSERT INTO order_items (
                    order_id,
                    product_id,
                    product_name,
                    quantity,
                    unit_price,
                    line_total
                ) VALUES (
                    :order_id,
                    :product_id,
                    :product_name,
                    :quantity,
                    :unit_price,
                    :line_total
                )
            ");

            $deductStmt = $pdo->prepare("
                UPDATE products
                SET stock = stock - :quantity
                WHERE id = :id
            ");

            foreach ($orderItemsToInsert as $orderItem) {
                $itemStmt->execute([
                    'order_id' => $orderId,
                    'product_id' => $orderItem['product_id'],
                    'product_name' => $orderItem['product_name'],
                    'quantity' => $orderItem['quantity'],
                    'unit_price' => $orderItem['unit_price'],
                    'line_total' => $orderItem['line_total'],
                ]);

                $deductStmt->execute([
                    'quantity' => $orderItem['quantity'],
                    'id' => $orderItem['product_id'],
                ]);
            }

            $pdo->commit();

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Order placed successfully!',
                'data' => [
                    'order_id' => $orderId,
                    'order_number' => $orderNumber,
                    'customer_name' => $customerName,
                    'total' => $total,
                ]
            ]);

        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    public function show(int $id): void
    {
        $pdo = Database::connect();

        $stmt = $pdo->prepare("
            SELECT
                id,
                order_number,
                customer_name,
                customer_email,
                customer_contact,
                delivery_address,
                payment_method,
                notes,
                subtotal,
                total,
                status,
                created_at
            FROM orders
            WHERE id = :id
            LIMIT 1
        ");
        $stmt->execute(['id' => $id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Order not found.'
            ]);
            return;
        }

        $itemsStmt = $pdo->prepare("
            SELECT
                id,
                product_id,
                product_name,
                quantity,
                unit_price,
                line_total
            FROM order_items
            WHERE order_id = :order_id
            ORDER BY id ASC
        ");
        $itemsStmt->execute(['order_id' => $id]);
        $order['items'] = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $order
        ]);
    }
}

