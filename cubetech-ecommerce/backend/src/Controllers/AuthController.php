<?php

namespace App\Controllers;

use App\Config\Database;
use App\Utils\Session;
use PDO;

class AuthController
{
    // POST /api/admin/login
    public function login(): void
{
    $data = json_decode(file_get_contents('php://input'), true);

    $email = strtolower(trim($data['email'] ?? ''));
    $password = $data['password'] ?? '';

    if (empty($email) || empty($password)) {
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'message' => 'Email and password are required.'
        ]);
        return;
    }

    $pdo = Database::connect();

    $stmt = $pdo->prepare("
        SELECT id, name, email, password_hash, role
        FROM users
        WHERE email = :email
        LIMIT 1
    ");

    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email or password.'
        ]);
        return;
    }

    Session::start();
    session_regenerate_id(true);

    $_SESSION['user'] = [
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role'],
    ];

    echo json_encode([
        'success' => true,
        'message' => 'Login successful.',
        'data' => $_SESSION['user']
    ]);
}

    // POST /api/auth/register
    public function register(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        $name = trim($data['name'] ?? '');
        $email = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';

        if (empty($name) || empty($email) || empty($password)) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => 'Name, email, and password are required.'
            ]);
            return;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid email address.'
            ]);
            return;
        }

        if (strlen($password) < 8) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => 'Password must be at least 8 characters.'
            ]);
            return;
        }

        $pdo = Database::connect();

        $stmt = $pdo->prepare("
            SELECT id FROM users WHERE email = :email LIMIT 1
        ");

        $stmt->execute(['email' => $email]);

        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode([
                'success' => false,
                'message' => 'Email address is already registered.'
            ]);
            return;
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        $stmt = $pdo->prepare("
            INSERT INTO users (name, email, password_hash, role)
            VALUES (:name, :email, :password_hash, 'customer')
        ");

        $stmt->execute([
            'name' => $name,
            'email' => $email,
            'password_hash' => $passwordHash
        ]);

        http_response_code(201);

        echo json_encode([
            'success' => true,
            'message' => 'Customer account created successfully.'
        ]);
    }

    // POST /api/admin/logout
    public function logout(): void
    {
        Session::destroy();

        echo json_encode([
            'success' => true,
            'message' => 'Logged out successfully.'
        ]);
    }

    // GET /api/admin/me
    public function me(): void
    {
        Session::start();

        if (!isset($_SESSION['user'])) {
            http_response_code(401);

            echo json_encode([
                'success' => false,
                'message' => 'Unauthorized.'
            ]);

            return;
        }

        echo json_encode([
            'success' => true,
            'data' => $_SESSION['user']
        ]);
    }
}