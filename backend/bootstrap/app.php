<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        // Web routes (blade views — not used in this API project)
        web: __DIR__.'/../routes/web.php',

        // ── API routes — THIS is what registers /api/login etc. ──
        api: __DIR__.'/../routes/api.php',

        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {

        // Apply CORS headers to every response
        $middleware->prepend(HandleCors::class);

        // Register custom role middleware
        // Usage in routes: ->middleware('role:admin')
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
