<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;
use Throwable;

class CustomerController
{
    /**
     * GET /api/admin/customers
     *
     * Retrieves unique customers derived from orders:
     * - Normalizes customer emails (LOWER + TRIM)
     * - Pulls latest customer name and contact info for repeat emails
     * - Aggregates total order count
     * - Calculates total completed-order value per customer
     * - Strictly read-only
     */
    public function index(): void
    {
        try {
            $pdo = Database::connect();

            $search = isset($_GET['search']) ? strtolower(trim($_GET['search'])) : '';

            $sql = "
                SELECT
                    latest.customer_name,
                    latest_meta.normalized_email AS email,
                    latest.customer_contact,
                    latest.delivery_address,
                    latest.payment_method AS latest_payment_method,
                    agg.order_count,
                    agg.completed_order_value,
                    agg.completed_orders_count,
                    agg.total_spent,
                    agg.first_order_date,
                    agg.last_order_date
                FROM (
                    SELECT
                        LOWER(TRIM(customer_email)) AS normalized_email,
                        MAX(id) AS latest_order_id
                    FROM orders
                    WHERE customer_email IS NOT NULL AND TRIM(customer_email) != ''
                    GROUP BY LOWER(TRIM(customer_email))
                ) AS latest_meta
                INNER JOIN orders latest ON latest.id = latest_meta.latest_order_id
                INNER JOIN (
                    SELECT
                        LOWER(TRIM(customer_email)) AS normalized_email,
                        COUNT(*) AS order_count,
                        COALESCE(SUM(CASE WHEN status = 'Completed' THEN total ELSE 0 END), 0) AS completed_order_value,
                        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_orders_count,
                        COALESCE(SUM(CASE WHEN status != 'Cancelled' THEN total ELSE 0 END), 0) AS total_spent,
                        MIN(created_at) AS first_order_date,
                        MAX(created_at) AS last_order_date
                    FROM orders
                    WHERE customer_email IS NOT NULL AND TRIM(customer_email) != ''
                    GROUP BY LOWER(TRIM(customer_email))
                ) AS agg ON agg.normalized_email = latest_meta.normalized_email
            ";

            $params = [];
            if ($search !== '') {
                $sql .= "
                    WHERE (
                        latest_meta.normalized_email LIKE :search
                        OR LOWER(latest.customer_name) LIKE :search
                        OR latest.customer_contact LIKE :search
                    )
                ";
                $params['search'] = '%' . $search . '%';
            }

            $sql .= " ORDER BY agg.last_order_date DESC, agg.order_count DESC";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Format data with type safety and expected key aliases
            $customers = array_map(function ($row) {
                $completedValue = (float) $row['completed_order_value'];
                $orderCount = (int) $row['order_count'];
                $completedCount = (int) $row['completed_orders_count'];
                $totalSpent = (float) $row['total_spent'];

                return [
                    'customer_name' => $row['customer_name'],
                    'name' => $row['customer_name'],
                    'email' => $row['email'],
                    'customer_email' => $row['email'],
                    'customer_contact' => $row['customer_contact'],
                    'contact_number' => $row['customer_contact'],
                    'delivery_address' => $row['delivery_address'],
                    'order_count' => $orderCount,
                    'orders_count' => $orderCount,
                    'completed_order_value' => $completedValue,
                    'completed_sales' => $completedValue,
                    'total_completed_order_value' => $completedValue,
                    'completed_orders_count' => $completedCount,
                    'total_spent' => $totalSpent,
                    'first_order_date' => $row['first_order_date'],
                    'last_order_date' => $row['last_order_date'],
                    'latest_payment_method' => $row['latest_payment_method'],
                ];
            }, $rows);

            echo json_encode([
                'success' => true,
                'data' => $customers,
                'meta' => [
                    'total_customers' => count($customers),
                ]
            ]);

        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to load customers: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * GET /api/admin/customers/{email}/orders
     * Read-only view of a customer's individual order history.
     */
    public function customerOrders(string $email): void
    {
        try {
            $pdo = Database::connect();
            $normalizedEmail = strtolower(trim(urldecode($email)));

            $stmt = $pdo->prepare("
                SELECT
                    o.id,
                    o.order_number,
                    o.customer_name,
                    o.customer_email,
                    o.customer_contact,
                    o.delivery_address,
                    o.payment_method,
                    o.total,
                    o.status,
                    o.created_at,
                    COUNT(oi.id) AS total_items
                FROM orders o
                LEFT JOIN order_items oi ON oi.order_id = o.id
                WHERE LOWER(TRIM(o.customer_email)) = :email
                GROUP BY o.id
                ORDER BY o.created_at DESC, o.id DESC
            ");

            $stmt->execute(['email' => $normalizedEmail]);
            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'data' => $orders
            ]);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to retrieve customer orders: ' . $e->getMessage()
            ]);
        }
    }
}

