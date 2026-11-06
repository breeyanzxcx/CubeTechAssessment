<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;
use Throwable;
use Exception;

class OrderController
{
    /**
     * Allowed status transitions to prevent invalid or backward state changes.
     * Only 'Pending' and 'Confirmed' orders can be transitioned to 'Cancelled'.
     */
    private const VALID_TRANSITIONS = [
        'Pending'   => ['Confirmed', 'Cancelled'],
        'Confirmed' => ['Preparing', 'Cancelled'],
        'Preparing' => ['Shipped'],
        'Shipped'   => ['Completed'],
        'Completed' => [],
        'Cancelled' => [],
    ];

    /**
     * Retrieve all orders, newest first.
     * Supports optional status filtering via ?status=Pending
     */
    public function index(): void
    {
        $pdo = Database::connect();

        $statusFilter = isset($_GET['status']) ? trim($_GET['status']) : '';
        $params = [];
        $whereSql = '';

        if (!empty($statusFilter) && strcasecmp($statusFilter, 'all') !== 0) {
            $whereSql = 'WHERE o.status = :status';
            $params['status'] = ucfirst(strtolower($statusFilter));
        }

        $sql = "
            SELECT
                o.id,
                o.order_number,
                o.customer_name,
                o.customer_email,
                o.customer_contact,
                o.delivery_address,
                o.payment_method,
                o.notes,
                o.subtotal,
                o.total,
                o.status,
                o.created_at,
                o.updated_at,
                COUNT(oi.id) AS total_items,
                COALESCE(SUM(oi.quantity), 0) AS total_quantity
            FROM orders o
            LEFT JOIN order_items oi ON oi.order_id = o.id
            {$whereSql}
            GROUP BY o.id
            ORDER BY o.created_at DESC, o.id DESC
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $orders
        ]);
    }

    /**
     * Place a new order (customer checkout).
     */
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
        $email = strtolower(trim($data['email'] ?? ($data['customer_email'] ?? '')));
        $customerName = trim($data['customer_name'] ?? '');
        $contactNumber = trim($data['contact_number'] ?? ($data['customer_contact'] ?? ''));
        $deliveryAddress = trim($data['delivery_address'] ?? '');
        $paymentMethodRaw = $data['payment_method'] ?? 'COD';
        $notes = !empty($data['notes']) ? trim($data['notes']) : null;
        $rawItems = $data['items'] ?? [];

        // Validate items and merge duplicates
        $mergedItems = [];
        foreach ($rawItems as $item) {
            $productId = (int) ($item['product_id'] ?? $item['id'] ?? 0);
            $quantity = filter_var($item['quantity'] ?? null, FILTER_VALIDATE_INT);

            if ($productId <= 0 || $quantity === false || $quantity <= 0) {
                http_response_code(422);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid product or quantity in order items.'
                ]);
                return;
            }

            if (!isset($mergedItems[$productId])) {
                $mergedItems[$productId] = 0;
            }
            $mergedItems[$productId] += $quantity;
        }

        $items = [];
        foreach ($mergedItems as $productId => $quantity) {
            $items[] = [
                'product_id' => $productId,
                'quantity' => $quantity,
            ];
        }

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

        if (empty($items)) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => 'Your cart is empty.'
            ]);
            return;
        }

        // Map payment method to DB ENUM: 'COD', 'E-Wallet', 'Bank Transfer'
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
        $userId = (int) $_SESSION['user']['id'];
        
        try {
            $pdo->beginTransaction();
            
            $subtotal = 0;
            $orderItemsToInsert = [];

            // Verify availability and stock for each item
            foreach ($items as $item) {
                $productId = $item['product_id'];
                $quantity = $item['quantity'];

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

            // Generate unique human-readable order number
            $orderNumber = 'ORD-' . date('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));

            // Insert into orders table
            $orderStmt = $pdo->prepare("
                INSERT INTO orders (
                    order_number,
                    user_id,
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
                    :user_id,
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
                'user_id' => $userId,
                'customer_name' => $customerName,
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
                AND stock >= :min_stock
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
                    'min_stock' => $orderItem['quantity'],
                ]);

                if ($deductStmt->rowCount() !== 1) {
                    throw new Exception("Unable to deduct stock for \"{$orderItem['product_name']}\". Please try again.");
                }
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

        } catch (Throwable $e) {
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

    /**
     * View individual order details with items.
     */
    public function show(int $id): void
    {
        $pdo = Database::connect();

        $user = $_SESSION['user'] ?? null;
        $isCustomer = ($user['role'] ?? null) === 'customer';

        $sql = "
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
                created_at,
                updated_at
            FROM orders
            WHERE id = :id
        ";

        $params = ['id' => $id];

        if ($isCustomer) {
            $sql .= " AND user_id = :user_id";
            $params['user_id'] = (int) $user['id'];
        }

        $sql .= " LIMIT 1";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
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

    /**
     * Update order status with strict state validation.
     * Handles: Pending -> Confirmed -> Preparing -> Shipped -> Completed, or Cancelled.
     */
    public function updateStatus(int $id): void
    {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if (!$data || empty($data['status'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Status field is required.'
            ]);
            return;
        }

        $this->processStatusChange($id, trim($data['status']));
    }

    /**
     * Dedicated action to cancel an order.
     * Allowed only for 'Pending' or 'Confirmed' orders.
     */
    public function cancel(int $id): void
    {
        $this->processStatusChange($id, 'Cancelled');
    }

    /**
     * Core status transition logic:
     * - Validates state transition graph
     * - Prevents invalid or backward transitions
     * - Restores stock exactly once on cancellation
     */
    private function processStatusChange(int $id, string $requestedStatus): void
    {
        $validStatuses = ['Pending', 'Confirmed', 'Preparing', 'Shipped', 'Completed', 'Cancelled'];

        // Normalize casing
        $targetStatus = null;
        foreach ($validStatuses as $valid) {
            if (strcasecmp($requestedStatus, $valid) === 0) {
                $targetStatus = $valid;
                break;
            }
        }

        if (!$targetStatus) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid status. Allowed values: ' . implode(', ', $validStatuses) . '.'
            ]);
            return;
        }

        $pdo = Database::connect();

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare("
                SELECT id, order_number, status
                FROM orders
                WHERE id = :id
                FOR UPDATE
            ");
            $stmt->execute(['id' => $id]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$order) {
                $pdo->rollBack();
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Order not found.'
                ]);
                return;
            }

            $currentStatus = $order['status'];

            // Prevent redundant same-status updates
            if ($currentStatus === $targetStatus) {
                $pdo->rollBack();
                http_response_code(422);
                echo json_encode([
                    'success' => false,
                    'message' => "Order #{$order['order_number']} is already in '{$currentStatus}' status."
                ]);
                return;
            }

            // Check valid forward transitions
            $allowedNext = self::VALID_TRANSITIONS[$currentStatus] ?? [];

            if (!in_array($targetStatus, $allowedNext, true)) {
                $pdo->rollBack();
                http_response_code(422);

                if ($targetStatus === 'Cancelled') {
                    $message = "Cannot cancel Order #{$order['order_number']}. Cancellation is only allowed when status is 'Pending' or 'Confirmed' (current status: '{$currentStatus}').";
                } elseif (in_array($currentStatus, ['Completed', 'Cancelled'], true)) {
                    $message = "Cannot update Order #{$order['order_number']}. '{$currentStatus}' is a terminal status and cannot be changed.";
                } else {
                    $message = "Invalid status transition from '{$currentStatus}' to '{$targetStatus}'. Backward, skipping, or unsupported transitions are not allowed.";
                }

                echo json_encode([
                    'success' => false,
                    'message' => $message
                ]);
                return;
            }

            // Update order status
            $updateStmt = $pdo->prepare("
                UPDATE orders
                SET status = :status
                WHERE id = :id
            ");
            $updateStmt->execute([
                'status' => $targetStatus,
                'id' => $id,
            ]);

            // Restore product stock exactly once when transitioning to Cancelled
            $stockRestored = false;
            if ($targetStatus === 'Cancelled') {
                $itemsStmt = $pdo->prepare("
                    SELECT product_id, quantity
                    FROM order_items
                    WHERE order_id = :order_id
                ");
                $itemsStmt->execute(['order_id' => $id]);
                $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

                $restoreStmt = $pdo->prepare("
                    UPDATE products
                    SET stock = stock + :quantity
                    WHERE id = :product_id
                ");

                foreach ($items as $item) {
                    $restoreStmt->execute([
                        'quantity' => (int) $item['quantity'],
                        'product_id' => (int) $item['product_id'],
                    ]);
                }
                $stockRestored = true;
            }

            $pdo->commit();

            echo json_encode([
                'success' => true,
                'message' => "Order #{$order['order_number']} status changed from '{$currentStatus}' to '{$targetStatus}'." . ($stockRestored ? ' Product stock has been restored.' : ''),
                'data' => [
                    'id' => (int) $id,
                    'order_number' => $order['order_number'],
                    'previous_status' => $currentStatus,
                    'status' => $targetStatus,
                    'stock_restored' => $stockRestored,
                ]
            ]);

        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update order status: ' . $e->getMessage()
            ]);
        }
    }
}
