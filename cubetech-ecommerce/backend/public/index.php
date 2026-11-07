<?php

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Controllers\ProductController;
use App\Controllers\CategoryController;
use App\Controllers\OrderController;
use App\Controllers\AuthController;
use App\Controllers\DashboardController;
use App\Middleware\AuthMiddleware;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
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
    if ($method === 'POST' && ($path === '/api/auth/register' || $path === '/api/register')) {
        (new AuthController())->register();
        exit;
    }

    // Authentication (supports /api/auth/login and legacy /api/admin/login)
    if ($method === 'POST' && ($path === '/api/auth/login' || $path === '/api/admin/login')) {
        (new AuthController())->login();
        exit;
    }

    if ($method === 'POST' && ($path === '/api/auth/logout' || $path === '/api/admin/logout')) {
        (new AuthController())->logout();
        exit;
    }

    if ($method === 'GET' && ($path === '/api/auth/me' || $path === '/api/admin/me')) {
        (new AuthController())->me();
        exit;
    }

    if ($method === 'GET' && ($path === '/api/admin/dashboard' || $path === '/api/dashboard')) {
        if (!AuthMiddleware::handle('admin')) {
            exit;
        }

        (new DashboardController())->index();
        exit;
    }

    if ($method === 'GET' && $path === '/api/products') {
        (new ProductController())->index();
        exit;
    }

    // Admin: retrieve all products (active & inactive)
    if ($method === 'GET' && $path === '/api/admin/products') {
        if (!AuthMiddleware::handle('admin')) {
            exit;
        }

        (new ProductController())->adminIndex();
        exit;
    }

    // Admin: create product
    if ($method === 'POST' && $path === '/api/admin/products') {
        if (!AuthMiddleware::handle('admin')) {
            exit;
        }

        (new ProductController())->store();
        exit;
    }

    // Admin: update product
    if (
        ($method === 'PUT' || $method === 'PATCH') &&
        preg_match('#^/api/admin/products/(\d+)$#', $path, $matches)
    ) {
        if (!AuthMiddleware::handle('admin')) {
            exit;
        }

        (new ProductController())->update((int) $matches[1]);
        exit;
    }

    // Admin: delete product
    if (
        $method === 'DELETE' &&
        preg_match('#^/api/admin/products/(\d+)$#', $path, $matches)
    ) {
        if (!AuthMiddleware::handle('admin')) {
            exit;
        }

        (new ProductController())->destroy((int) $matches[1]);
        exit;
    }

    // View single product (Customer or Admin)
    if (
        $method === 'GET' &&
        preg_match('#^/api/(?:admin/)?products/(\d+)$#', $path, $matches)
    ) {
        (new ProductController())->show((int) $matches[1]);
        exit;
    }

    if ($method === 'GET' && ($path === '/api/categories' || $path === '/api/admin/categories')) {
        (new CategoryController())->index();
        exit;
    }

    // Admin: create category
    if ($method === 'POST' && $path === '/api/admin/categories') {
        if (!AuthMiddleware::handle('admin')) {
            exit;
        }

        (new CategoryController())->store();
        exit;
    }

    // Admin: update category
    if (
        ($method === 'PUT' || $method === 'PATCH') &&
        preg_match('#^/api/admin/categories/(\d+)$#', $path, $matches)
    ) {
        if (!AuthMiddleware::handle('admin')) {
            exit;
        }

        (new CategoryController())->update((int) $matches[1]);
        exit;
    }

    // Admin: delete category
    if (
        $method === 'DELETE' &&
        preg_match('#^/api/admin/categories/(\d+)$#', $path, $matches)
    ) {
        if (!AuthMiddleware::handle('admin')) {
            exit;
        }

        (new CategoryController())->destroy((int) $matches[1]);
        exit;
    }

    // View single category
    if (
        $method === 'GET' &&
        preg_match('#^/api/(?:admin/)?categories/(\d+)$#', $path, $matches)
    ) {
        (new CategoryController())->show((int) $matches[1]);
        exit;
    }

    // Review / Validate cart items before checkout (Price & Availability check)
    if ($method === 'POST' && ($path === '/api/orders/review' || $path === '/api/orders/validate')) {
        (new OrderController())->review();
        exit;
    }

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
