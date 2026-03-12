<?php
// =============================================================
//  CheckRole Middleware
//  Enforces role-based access control at the route level.
//
//  Usage in routes/api.php:
//    Route::middleware(['auth:sanctum', 'role:admin'])->group(...)
//
//  HOW IT WORKS:
//  After Sanctum verifies the token (auth:sanctum), this middleware
//  checks if the authenticated user's role matches the required role.
//  If not, it returns 403 Forbidden — the request never reaches
//  the controller.
// =============================================================

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

// Role-based access control middleware use for Check the role.

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        // auth:sanctum must run first — user must be authenticated
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Check if the authenticated user's role is in the allowed roles list
        // Example: middleware('role:admin') → $roles = ['admin']
        //          middleware('role:admin,staff') → $roles = ['admin', 'staff']
        if (!in_array($request->user()->role, $roles)) {
            return response()->json([
                'message' => 'Access denied. Insufficient permissions.',
                'required_role' => implode(' or ', $roles),
                'your_role'     => $request->user()->role,
            ], 403);
        }

        // If role is allowed, proceed to the controller

        return $next($request);
    }
}
