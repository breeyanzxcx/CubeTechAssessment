<?php

namespace App\Middleware;

use App\Utils\Session;

class AuthMiddleware
{
    public static function handle(?string $requiredRole = null): bool
    {
        Session::start();

        // Check authentication
        if (!isset($_SESSION['user'])) {
            self::unauthorized('Please log in first.');
            return false;
        }

        // Check role permissions
        if (
            $requiredRole !== null &&
            $_SESSION['user']['role'] !== $requiredRole
        ) {
            http_response_code(403);

            echo json_encode([
                'success' => false,
                'message' => 'You do not have permission to access this resource.'
            ]);

            return false;
        }

        return true;
    }

    private static function unauthorized(string $message): void
    {
        http_response_code(401);

        echo json_encode([
            'success' => false,
            'message' => $message
        ]);
    }
}