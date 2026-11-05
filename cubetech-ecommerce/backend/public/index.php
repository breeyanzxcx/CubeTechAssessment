<?php

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Controllers\ProductController;
use App\Controllers\CategoryController;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

try {
    // GET /api/products
    if ($method === 'GET' && $path === '/api/products') {
        (new ProductController())->index();
        exit;
    }

    // GET /api/products/{id}
    if (
        $method === 'GET' &&
        preg_match('#^/api/products/(\d+)$#', $path, $matches)
    ) {
        (new ProductController())->show((int) $matches[1]);
        exit;
    }

    // GET /api/categories
    if ($method === 'GET' && $path === '/api/categories') {
        (new CategoryController())->index();
        exit;
    }

    http_response_code(404);

    echo json_encode([
        'success' => false,
        'message' => 'API endpoint not found.'
    ]);

} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Internal server error.'
    ]);

    error_log($e->getMessage());
}