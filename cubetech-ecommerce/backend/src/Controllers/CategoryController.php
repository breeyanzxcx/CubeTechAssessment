<?php

namespace App\Controllers;

use App\Config\Database;

class CategoryController
{
    public function index(): void
    {
        $pdo = Database::connect();

        $sql = "
            SELECT
                c.id,
                c.name,
                c.description,
                COUNT(p.id) AS product_count
            FROM categories c
            LEFT JOIN products p
                ON p.category_id = c.id
                AND p.is_active = 1
            GROUP BY c.id, c.name, c.description
            ORDER BY c.name ASC
        ";

        $categories = $pdo->query($sql)->fetchAll();

        echo json_encode([
            'success' => true,
            'data' => $categories
        ]);
    }
}