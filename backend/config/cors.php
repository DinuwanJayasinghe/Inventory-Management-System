<?php
// =============================================================
//  config/cors.php — CORS Configuration
//
//  Allows the React frontend (http://localhost:5173) to make
//  API requests to Laravel (http://localhost:8000).
//
//  In production: change allowed_origins to your real domain.
// =============================================================

return [

    // Which routes should have CORS headers applied
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // HTTP methods allowed from the frontend
    'allowed_methods' => ['*'],

    // Allowed origins — change to your production frontend URL
    'allowed_origins' => [
        'http://localhost:5173',    // Vite dev server
        'http://127.0.0.1:5173',
        env('FRONTEND_URL', 'http://localhost:5173'),
    ],

    'allowed_origins_patterns' => [],

    // Allow all headers (Content-Type, Authorization, etc.)
    'allowed_headers' => ['*'],

    // Headers the browser is allowed to read
    'exposed_headers' => [],

    // How long the browser can cache preflight response (seconds)
    'max_age' => 0,

    // Allow cookies/credentials to be sent with requests
    // Required for Sanctum SPA authentication
    'supports_credentials' => true,
];
