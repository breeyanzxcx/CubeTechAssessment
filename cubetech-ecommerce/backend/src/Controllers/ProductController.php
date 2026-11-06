<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;
use Throwable;

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

    public function adminIndex(): void
    {
        $pdo = Database::connect();

        $search = isset($_GET['search']) ? trim($_GET['search']) : '';
        $categoryId = isset($_GET['category_id']) ? (int) $_GET['category_id'] : 0;
        $isActive = isset($_GET['is_active']) ? $_GET['is_active'] : null;

        $whereConditions = [];
        $params = [];

        if ($search !== '') {
            $whereConditions[] = '(p.name LIKE :search OR p.description LIKE :search)';
            $params['search'] = '%' . $search . '%';
        }

        if ($categoryId > 0) {
            $whereConditions[] = 'p.category_id = :category_id';
            $params['category_id'] = $categoryId;
        }

        if ($isActive !== null && $isActive !== '' && $isActive !== 'all') {
            $whereConditions[] = 'p.is_active = :is_active';
            $params['is_active'] = (int) filter_var($isActive, FILTER_VALIDATE_BOOLEAN);
        }

        $whereSql = '';
        if (!empty($whereConditions)) {
            $whereSql = 'WHERE ' . implode(' AND ', $whereConditions);
        }

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
                p.created_at,
                p.updated_at,
                c.name AS category_name
            FROM products p
            INNER JOIN categories c
                ON p.category_id = c.id
            {$whereSql}
            ORDER BY p.created_at DESC, p.id DESC
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $products
        ]);
    }


    public function show(int $id): void
    {
        $pdo = Database::connect();

        $user = $_SESSION['user'] ?? null;
        $isAdmin = ($user['role'] ?? null) === 'admin';
        $activeCondition = $isAdmin ? '' : 'AND p.is_active = 1';

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
                p.created_at,
                p.updated_at,
                c.name AS category_name
            FROM products p
            INNER JOIN categories c
                ON p.category_id = c.id
            WHERE p.id = :id
            {$activeCondition}
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
        $categoryId = (int) ($data['category_id'] ?? 0);
        $price = filter_var($data['price'] ?? null, FILTER_VALIDATE_FLOAT);
        $stock = filter_var($data['stock'] ?? null, FILTER_VALIDATE_INT);
        $description = isset($data['description']) ? trim($data['description']) : null;
        $imageUrl = !empty($data['image_url']) ? trim($data['image_url']) : null;
        $isActive = isset($data['is_active']) ? (int) filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN) : 1;

        if (empty($name)) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => 'Product name is required.'
            ]);
            return;
        }

        if ($categoryId <= 0) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => 'A valid category is required.'
            ]);
            return;
        }

        if ($price === false || $price < 0) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => 'Price must be a valid non-negative number.'
            ]);
            return;
        }

        if ($stock === false || $stock < 0) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => 'Stock must be a valid non-negative integer.'
            ]);
            return;
        }

        $pdo = Database::connect();

        // Check category exists
        $catStmt = $pdo->prepare("SELECT id FROM categories WHERE id = :id LIMIT 1");
        $catStmt->execute(['id' => $categoryId]);
        if (!$catStmt->fetch()) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => 'Selected category does not exist.'
            ]);
            return;
        }

        try {
            $stmt = $pdo->prepare("
                INSERT INTO products (
                    category_id,
                    name,
                    description,
                    price,
                    stock,
                    image_url,
                    is_active
                ) VALUES (
                    :category_id,
                    :name,
                    :description,
                    :price,
                    :stock,
                    :image_url,
                    :is_active
                )
            ");

            $stmt->execute([
                'category_id' => $categoryId,
                'name' => $name,
                'description' => $description,
                'price' => $price,
                'stock' => $stock,
                'image_url' => $imageUrl,
                'is_active' => $isActive,
            ]);

            $id = (int) $pdo->lastInsertId();

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Product created successfully.',
                'data' => [
                    'id' => $id,
                    'name' => $name,
                    'category_id' => $categoryId,
                    'price' => $price,
                    'stock' => $stock,
                    'image_url' => $imageUrl,
                    'is_active' => (bool) $isActive,
                ]
            ]);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create product: ' . $e->getMessage()
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

        // Check product exists
        $checkStmt = $pdo->prepare("SELECT id, name FROM products WHERE id = :id LIMIT 1");
        $checkStmt->execute(['id' => $id]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$existing) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Product not found.'
            ]);
            return;
        }

        // Validate fields
        $updates = [];
        $params = ['id' => $id];

        if (isset($data['name'])) {
            $name = trim($data['name']);
            if (empty($name)) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Product name cannot be empty.']);
                return;
            }
            $updates[] = 'name = :name';
            $params['name'] = $name;
        }

        if (isset($data['category_id'])) {
            $catId = (int) $data['category_id'];
            $catStmt = $pdo->prepare("SELECT id FROM categories WHERE id = :id LIMIT 1");
            $catStmt->execute(['id' => $catId]);
            if (!$catStmt->fetch()) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Selected category does not exist.']);
                return;
            }
            $updates[] = 'category_id = :category_id';
            $params['category_id'] = $catId;
        }

        if (isset($data['price'])) {
            $price = filter_var($data['price'], FILTER_VALIDATE_FLOAT);
            if ($price === false || $price < 0) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Price must be a valid non-negative number.']);
                return;
            }
            $updates[] = 'price = :price';
            $params['price'] = $price;
        }

        if (isset($data['stock'])) {
            $stock = filter_var($data['stock'], FILTER_VALIDATE_INT);
            if ($stock === false || $stock < 0) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Stock must be a valid non-negative integer.']);
                return;
            }
            $updates[] = 'stock = :stock';
            $params['stock'] = $stock;
        }

        if (array_key_exists('description', $data)) {
            $updates[] = 'description = :description';
            $params['description'] = !empty($data['description']) ? trim($data['description']) : null;
        }

        if (array_key_exists('image_url', $data)) {
            $updates[] = 'image_url = :image_url';
            $params['image_url'] = !empty($data['image_url']) ? trim($data['image_url']) : null;
        }

        if (isset($data['is_active'])) {
            $updates[] = 'is_active = :is_active';
            $params['is_active'] = (int) filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN);
        }

        if (empty($updates)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'message' => 'No fields provided to update.']);
            return;
        }

        try {
            $sql = "UPDATE products SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            // Fetch updated record
            $fetchStmt = $pdo->prepare("
                SELECT p.*, c.name AS category_name
                FROM products p
                INNER JOIN categories c ON p.category_id = c.id
                WHERE p.id = :id
            ");
            $fetchStmt->execute(['id' => $id]);
            $updated = $fetchStmt->fetch(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'message' => 'Product updated successfully.',
                'data' => $updated
            ]);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update product: ' . $e->getMessage()
            ]);
        }
    }

    public function destroy(int $id): void
    {
        $pdo = Database::connect();

        $checkStmt = $pdo->prepare("SELECT id, name FROM products WHERE id = :id LIMIT 1");
        $checkStmt->execute(['id' => $id]);
        $product = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$product) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Product not found.'
            ]);
            return;
        }

        // Check if product is in order_items
        $orderItemCheck = $pdo->prepare("SELECT COUNT(*) FROM order_items WHERE product_id = :id");
        $orderItemCheck->execute(['id' => $id]);
        $orderCount = (int) $orderItemCheck->fetchColumn();

        if ($orderCount > 0) {
            http_response_code(409);
            echo json_encode([
                'success' => false,
                'message' => "Cannot delete \"{$product['name']}\" because it is referenced in {$orderCount} order item(s). Please set its status to inactive instead."
            ]);
            return;
        }

        try {
            $deleteStmt = $pdo->prepare("DELETE FROM products WHERE id = :id");
            $deleteStmt->execute(['id' => $id]);

            echo json_encode([
                'success' => true,
                'message' => "Product \"{$product['name']}\" has been deleted successfully."
            ]);
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete product: ' . $e->getMessage()
            ]);
        }
    }
}
