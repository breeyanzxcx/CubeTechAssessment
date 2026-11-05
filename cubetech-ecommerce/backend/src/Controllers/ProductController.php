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

        echo json_encode([
            'success' => true,
            'data' => $products
        ]);
    }

    public function show(int $id): void
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
                p.category_id,
                c.name AS category_name
            FROM products p
            INNER JOIN categories c
                ON p.category_id = c.id
            WHERE p.id = :id
            AND p.is_active = 1
            LIMIT 1
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute(['id' => $id]);

        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$product) {
            http_response_code(404);

            echo json_encode([
                'success' => false,
                'message' => 'Product not found.'
            ]);

            return;
        }

        $relatedStmt = $pdo->prepare("
            SELECT id, name, price, stock, image_url
            FROM products
            WHERE category_id = :category_id
            AND id != :id
            AND is_active = 1
            ORDER BY id DESC
            LIMIT 3
        ");

        $relatedStmt->execute([
            'category_id' => $product['category_id'],
            'id' => $id
        ]);

        $product['related_products'] = $relatedStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $product
        ]);
    }
}
