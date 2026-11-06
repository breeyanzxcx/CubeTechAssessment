<?php

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Controllers\ProductController;
use App\Controllers\CategoryController;
use App\Controllers\OrderController;
use App\Controllers\AuthController;
use App\Middleware\AuthMiddleware;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

try {
    // Protected Admin Test Route
    if ($method === 'GET' && $path === '/api/admin/protected') {
        if (!AuthMiddleware::handle('admin')) {
            exit;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Admin access granted.'
    ]);
        exit;
    }

        // Customer Registration
    if ($method === 'POST' && $path === '/api/auth/register') {
        (new AuthController())->register();
        exit;
    }

        // Admin Authentication
    if ($method === 'POST' && $path === '/api/auth/login') {
    (new AuthController())->login();
    exit;
    }

    if ($method === 'POST' && $path === '/api/auth/logout') {
        (new AuthController())->logout();
        exit;
    }

    if ($method === 'GET' && $path === '/api/auth/me') {
        (new AuthController())->me();
        exit;
    }

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

        // Customer Checkout
    if ($method === 'POST' && $path === '/api/orders') {
        if (!AuthMiddleware::handle('customer')) {
            exit;
        }

        (new OrderController())->store();
        exit;
    }

    // Admin: Retrieve all orders
    if ($method === 'GET' && $path === '/api/admin/orders') {
        if (!AuthMiddleware::handle('admin')) {
            exit;
        }

        (new OrderController())->index();
        exit;
    }

    // Admin: Cancel order
    if (
        ($method === 'POST' || $method === 'PUT') &&
        preg_match('#^/api/admin/orders/(\d+)/cancel$#', $path, $matches)
    ) {
        if (!AuthMiddleware::handle('admin')) {
            exit;
        }

        (new OrderController())->cancel((int) $matches[1]);
        exit;
    }

    // Admin: Update order status
    if (
        ($method === 'PUT' || $method === 'PATCH') &&
        preg_match('#^/api/admin/orders/(\d+)/status$#', $path, $matches)
    ) {
        if (!AuthMiddleware::handle('admin')) {
            exit;
        }

        (new OrderController())->updateStatus((int) $matches[1]);
        exit;
    }

    // Admin: View individual order
    if (
        $method === 'GET' &&
        preg_match('#^/api/admin/orders/(\d+)$#', $path, $matches)
    ) {
        if (!AuthMiddleware::handle('admin')) {
            exit;
        }

        (new OrderController())->show((int) $matches[1]);
        exit;
    }

    // Customer: View individual order
    if (
        $method === 'GET' &&
        preg_match('#^/api/orders/(\d+)$#', $path, $matches)
    ) {
        if (!AuthMiddleware::handle('customer')) {
            exit;
        }

        (new OrderController())->show((int) $matches[1]);
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
