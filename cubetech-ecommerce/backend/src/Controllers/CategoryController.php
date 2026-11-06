<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;
use Throwable;

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
                c.created_at,
                c.updated_at,
                COUNT(p.id) AS product_count,
                SUM(CASE WHEN p.is_active = 1 THEN 1 ELSE 0 END) AS active_product_count
            FROM categories c
            LEFT JOIN products p
                ON p.category_id = c.id
            GROUP BY c.id, c.name, c.description, c.created_at, c.updated_at
            ORDER BY c.name ASC
        ";

        $categories = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $categories
        ]);
    }

    public function show(int $id): void
    {
        $pdo = Database::connect();

        $stmt = $pdo->prepare("
            SELECT
                c.id,
                c.name,
                c.description,
                c.created_at,
                c.updated_at,
                COUNT(p.id) AS product_count
            FROM categories c
            LEFT JOIN products p ON p.category_id = c.id
            WHERE c.id = :id
            GROUP BY c.id, c.name, c.description, c.created_at, c.updated_at
            LIMIT 1
        ");
        $stmt->execute(['id' => $id]);
        $category = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$category) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Category not found.'
            ]);
            return;
        }

        echo json_encode([
            'success' => true,
            'data' => $category
        ]);
    }

    public function store(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid JSON payload.'
            ]);
            return;
        }

        $name = trim($data['name'] ?? '');
        $description = isset($data['description']) ? trim($data['description']) : null;

        if (empty($name)) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => 'Category name is required.'
            ]);
            return;
        }

        if (strlen($name) > 100) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => 'Category name cannot exceed 100 characters.'
            ]);
            return;
        }

        $pdo = Database::connect();

        // Check uniqueness of category name
        $checkStmt = $pdo->prepare("SELECT id FROM categories WHERE LOWER(name) = LOWER(:name) LIMIT 1");
        $checkStmt->execute(['name' => $name]);
        if ($checkStmt->fetch()) {
            http_response_code(409);
            echo json_encode([
                'success' => false,
                'message' => "A category with the name \"{$name}\" already exists."
            ]);
            return;
        }

        try {
            $stmt = $pdo->prepare("
                INSERT INTO categories (name, description)
                VALUES (:name, :description)
            ");
            $stmt->execute([
                'name' => $name,
                'description' => $description,
            ]);

            $id = (int) $pdo->lastInsertId();

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Category created successfully.',
                'data' => [
                    'id' => $id,
                    'name' => $name,
                    'description' => $description,
                ]
            ]);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create category: ' . $e->getMessage()
            ]);
        }
    }

    public function update(int $id): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid JSON payload.'
            ]);
            return;
        }

        $pdo = Database::connect();

        // Check category exists
        $checkStmt = $pdo->prepare("SELECT id, name, description FROM categories WHERE id = :id LIMIT 1");
        $checkStmt->execute(['id' => $id]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$existing) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Category not found.'
            ]);
            return;
        }

        $updates = [];
        $params = ['id' => $id];

        if (isset($data['name'])) {
            $name = trim($data['name']);
            if (empty($name)) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Category name cannot be empty.']);
                return;
            }

            if (strlen($name) > 100) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Category name cannot exceed 100 characters.']);
                return;
            }

            // Check uniqueness excluding current category
            $uniqueStmt = $pdo->prepare("SELECT id FROM categories WHERE LOWER(name) = LOWER(:name) AND id != :id LIMIT 1");
            $uniqueStmt->execute(['name' => $name, 'id' => $id]);
            if ($uniqueStmt->fetch()) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => "Category name \"{$name}\" is already in use."]);
                return;
            }

            $updates[] = 'name = :name';
            $params['name'] = $name;
        }

        if (array_key_exists('description', $data)) {
            $updates[] = 'description = :description';
            $params['description'] = !empty($data['description']) ? trim($data['description']) : null;
        }

        if (empty($updates)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'No fields provided to update.']);
            return;
        }

        try {
            $sql = "UPDATE categories SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            // Fetch updated record
            $fetchStmt = $pdo->prepare("SELECT id, name, description, created_at, updated_at FROM categories WHERE id = :id");
            $fetchStmt->execute(['id' => $id]);
            $updated = $fetchStmt->fetch(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'message' => 'Category updated successfully.',
                'data' => $updated
            ]);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update category: ' . $e->getMessage()
            ]);
        }
    }

    public function destroy(int $id): void
    {
        $pdo = Database::connect();

        $checkStmt = $pdo->prepare("SELECT id, name FROM categories WHERE id = :id LIMIT 1");
        $checkStmt->execute(['id' => $id]);
        $category = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$category) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Category not found.'
            ]);
            return;
        }

        // Check if products exist in category
        $prodCountStmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE category_id = :id");
        $prodCountStmt->execute(['id' => $id]);
        $productCount = (int) $prodCountStmt->fetchColumn();

        if ($productCount > 0) {
            http_response_code(409);
            echo json_encode([
                'success' => false,
                'message' => "Cannot delete category \"{$category['name']}\" because it contains {$productCount} product(s). Please delete or reassign them first."
            ]);
            return;
        }

        try {
            $deleteStmt = $pdo->prepare("DELETE FROM categories WHERE id = :id");
            $deleteStmt->execute(['id' => $id]);

            echo json_encode([
                'success' => true,
                'message' => "Category \"{$category['name']}\" deleted successfully."
            ]);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete category: ' . $e->getMessage()
            ]);
        }
    }
}
