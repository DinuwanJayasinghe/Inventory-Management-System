<?php
// =============================================================
//  AuthController
//  Handles authentication using Laravel Sanctum.
//
//  POST /api/login  → validate credentials → return token
//  POST /api/logout → revoke current token
//  GET  /api/me     → return authenticated user info
//
//  NO self-registration endpoint — admin creates users only.
// =============================================================

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\User;

class AuthController extends Controller
{
    public function __construct(private AuditService $audit) {}

    // ── POST /api/login ────────────────────────────────────────
    public function login(Request $request)
    {
        // Validate input fields
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        // Find user by email
        $user = User::where('email', $request->email)
                    ->whereNull('deleted_at') // don't let deleted users log in
                    ->first();

        // Verify password using bcrypt comparison
        // Hash::check() prevents timing attacks by using constant-time comparison
        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password.'],
            ]);
        }

        // Revoke all previous tokens (single session enforcement)
        $user->tokens()->delete();

        // Create a new Sanctum API token
        // The token is returned ONCE — we never store the plain-text version
        $token = $user->createToken('ims-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token'   => $token,
            'user'    => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
        ]);
    }

    // ── POST /api/logout ───────────────────────────────────────
    public function logout(Request $request)
    {
        // Delete ONLY the current token (not all tokens)
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    // ── GET /api/me ────────────────────────────────────────────
    // Returns the currently authenticated user's details.
    // Frontend calls this on app load to restore session.
    public function me(Request $request)
    {
        return response()->json([
            'user' => [
                'id'    => $request->user()->id,
                'name'  => $request->user()->name,
                'email' => $request->user()->email,
                'role'  => $request->user()->role,
            ]
        ]);
    }
}
