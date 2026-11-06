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
            SELECT id, name, email, password_hash
            FROM admins
            WHERE email = :email
            LIMIT 1
        ");

        $stmt->execute(['email' => $email]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$admin || !password_verify($password, $admin['password_hash'])) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid email or password.'
            ]);
            return;
        }

        Session::start();

        session_regenerate_id(true);

        $_SESSION['admin'] = [
            'id' => $admin['id'],
            'name' => $admin['name'],
            'email' => $admin['email'],
        ];

        echo json_encode([
            'success' => true,
            'message' => 'Login successful.',
            'data' => $_SESSION['admin']
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

        if (!isset($_SESSION['admin'])) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Unauthorized.'
            ]);
            return;
        }

        echo json_encode([
            'success' => true,
            'data' => $_SESSION['admin']
        ]);
    }
}