<?php

namespace App\Middleware;

use App\Utils\Session;

class AuthMiddleware
{
    public static function handle(): bool
    {
        Session::start();

        if (!isset($_SESSION['admin'])) {
            http_response_code(401);

            echo json_encode([
                'success' => false,
                'message' => 'Unauthorized. Please log in.'
            ]);

            return false;
        }

        return true;
    }
}