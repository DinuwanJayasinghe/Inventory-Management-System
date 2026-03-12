<?php
// =============================================================
//  routes/api.php — API Route Definitions
//
//  Route groups:
//    Public     → /api/login only
//    Protected  → auth:sanctum (any logged-in user)
//    Admin-only → auth:sanctum + role:admin
//
//  All routes return JSON. No Blade views.
//  Prefix /api is set in bootstrap/app.php automatically.
// =============================================================

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\{
    AuthController,
    UserController,
    CupboardController,
    PlaceController,
    ItemController,
    BorrowingController,
    ActivityLogController,
    DashboardController,
};

// ── PUBLIC ROUTES ──────────────────────────────────────────────
// Only login is public — no self-registration endpoint exists.

Route::post('/login', [AuthController::class, 'login']);

// ── PROTECTED ROUTES (any authenticated user) ──────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // Dashboard summary (read-only, all roles)
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // ── Storage (admin only) ────────────────────────────────
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('cupboards', CupboardController::class);
        Route::apiResource('places',    PlaceController::class);
    });

    // Places read — staff can READ places (needed to assign items)
    Route::get('/places', [PlaceController::class, 'index']);

    // ── Inventory Items (all roles) ─────────────────────────
    Route::apiResource('items', ItemController::class);
    Route::post('/items/{id}/status', [ItemController::class, 'updateStatus']);

    // ── Borrowings (all roles) ──────────────────────────────
    Route::get('/borrowings/overdue',       [BorrowingController::class, 'overdue']);
    Route::apiResource('borrowings',        BorrowingController::class)->only(['index', 'store']);
    Route::post('/borrowings/{id}/return',  [BorrowingController::class, 'returnItem']);

    // ── Admin-only routes ────────────────────────────────────
    Route::middleware('role:admin')->group(function () {

        // User management — no public registration
        Route::apiResource('users', UserController::class);

        // Audit log — admin only
        Route::get('/logs', [ActivityLogController::class, 'index']);
    });
});
