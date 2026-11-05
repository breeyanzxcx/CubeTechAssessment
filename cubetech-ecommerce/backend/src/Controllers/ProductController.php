<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;

class ProductController
{
    public function index(): void
    {
        $pdo = Database::connect();

        $sql = "
            SELECT
                p.id,
                p.name,
                p.description,
                p.price,
                p.stock,
                p.image_url,
                p.is_active,
                p.category_id,
                c.name AS category_name
            FROM products p
            INNER JOIN categories c
                ON p.category_id = c.id
            WHERE p.is_active = 1
            ORDER BY p.created_at DESC
        ";

        $stmt = $pdo->query($sql);
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);

        echo json_encode([
            'success' => true,
            'data' => $products
        ]);
    }
}