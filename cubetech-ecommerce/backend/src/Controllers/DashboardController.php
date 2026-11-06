<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;

class DashboardController
{
    /**
     * GET /api/admin/dashboard
     * Aggregates key e-commerce metrics for the admin dashboard.
     */
    public function index(): void
    {
        $pdo = Database::connect();

        // 1. Overall Revenue from non-cancelled orders
        $revStmt = $pdo->query("
            SELECT COALESCE(SUM(total), 0) AS total_revenue
            FROM orders
            WHERE status != 'Cancelled'
        ");
        $totalRevenue = (float) $revStmt->fetchColumn();

        // Orders metrics
        $ordersCountStmt = $pdo->query("SELECT COUNT(*) FROM orders");
        $totalOrders = (int) $ordersCountStmt->fetchColumn();

        $pendingCountStmt = $pdo->query("SELECT COUNT(*) FROM orders WHERE status = 'Pending'");
        $pendingOrders = (int) $pendingCountStmt->fetchColumn();

        // Products metrics
        $prodStatsStmt = $pdo->query("
            SELECT
                COUNT(*) AS total_products,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_products,
                SUM(CASE WHEN is_active = 1 AND stock = 0 THEN 1 ELSE 0 END) AS out_of_stock,
                SUM(CASE WHEN is_active = 1 AND stock > 0 AND stock <= 5 THEN 1 ELSE 0 END) AS low_stock
            FROM products
        ");
        $prodStats = $prodStatsStmt->fetch(PDO::FETCH_ASSOC);

        // Categories metrics
        $catCountStmt = $pdo->query("SELECT COUNT(*) FROM categories");
        $totalCategories = (int) $catCountStmt->fetchColumn();

        // Customers count (from users table where role = 'customer')
        $userCountStmt = $pdo->query("
            SELECT COUNT(*) FROM users WHERE role = 'customer'
        ");
        $totalCustomers = (int) $userCountStmt->fetchColumn();

        // 2. Orders by status breakdown
        $statusStmt = $pdo->query("
            SELECT status, COUNT(*) AS count
            FROM orders
            GROUP BY status
        ");
        $statusRows = $statusStmt->fetchAll(PDO::FETCH_KEY_PAIR);

        $statuses = ['Pending', 'Confirmed', 'Preparing', 'Shipped', 'Completed', 'Cancelled'];
        $ordersByStatus = [];
        foreach ($statuses as $st) {
            $ordersByStatus[$st] = (int) ($statusRows[$st] ?? 0);
        }

        // 3. Recent 5 Orders
        $recentOrdersStmt = $pdo->query("
            SELECT
                id,
                order_number,
                customer_name,
                customer_email,
                total,
                status,
                payment_method,
                created_at
            FROM orders
            ORDER BY created_at DESC, id DESC
            LIMIT 5
        ");
        $recentOrders = $recentOrdersStmt->fetchAll(PDO::FETCH_ASSOC);

        // 4. Low Stock Alerts (active products with stock <= 5)
        $lowStockStmt = $pdo->query("
            SELECT
                p.id,
                p.name,
                p.price,
                p.stock,
                c.name AS category_name
            FROM products p
            INNER JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = 1
              AND p.stock <= 5
            ORDER BY p.stock ASC, p.name ASC
            LIMIT 5
        ");
        $lowStockAlerts = $lowStockStmt->fetchAll(PDO::FETCH_ASSOC);

        // 5. Top Selling Products
        $topSellingStmt = $pdo->query("
            SELECT
                oi.product_id,
                oi.product_name,
                SUM(oi.quantity) AS total_sold,
                SUM(oi.line_total) AS total_sales
            FROM order_items oi
            INNER JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'Cancelled'
            GROUP BY oi.product_id, oi.product_name
            ORDER BY total_sold DESC
            LIMIT 5
        ");
        $topSellingProducts = $topSellingStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => [
                'summary' => [
                    'total_revenue' => $totalRevenue,
                    'total_orders' => $totalOrders,
                    'pending_orders' => $pendingOrders,
                    'total_products' => (int) ($prodStats['total_products'] ?? 0),
                    'active_products' => (int) ($prodStats['active_products'] ?? 0),
                    'out_of_stock_products' => (int) ($prodStats['out_of_stock'] ?? 0),
                    'low_stock_products' => (int) ($prodStats['low_stock'] ?? 0),
                    'total_categories' => $totalCategories,
                    'total_customers' => $totalCustomers,
                ],
                'orders_by_status' => $ordersByStatus,
                'recent_orders' => $recentOrders,
                'low_stock_alerts' => $lowStockAlerts,
                'top_selling_products' => $topSellingProducts,
            ]
        ]);
    }
}

