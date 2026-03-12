<?php
// =============================================================
//  UserController — Admin-only user management
//  GET    /api/users         → list all users
//  POST   /api/users         → create user (admin creates, no self-reg)
//  PUT    /api/users/{id}    → update user role/name
//  DELETE /api/users/{id}    → soft delete user
// =============================================================

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function __construct(private AuditService $audit) {}

    // ── GET /api/users ─────────────────────────────────────────
    public function index()
    {
        // Return all non-deleted users, newest first
        $users = User::orderBy('created_at', 'desc')
                     ->get(['id', 'name', 'email', 'role', 'created_at']);

        return response()->json(['data' => $users]);
    }

    // ── POST /api/users ────────────────────────────────────────
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role'     => 'required|in:admin,staff',
        ]);

        // Hash the password before storing
        // In Laravel 11, the 'hashed' cast also does this automatically,
        // but explicit Hash::make() is clearer and more portable.
        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);

        // Log the user creation with role info
        $this->audit->log(
            $request->user(), 'user_created', $user,
            null,
            ['name' => $user->name, 'email' => $user->email, 'role' => $user->role]
        );

        return response()->json([
            'message' => 'User created successfully',
            'data'    => $user->only(['id', 'name', 'email', 'role', 'created_at']),
        ], 201);
    }

    // ── PUT /api/users/{id} ────────────────────────────────────
    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        // Prevent admin from removing their own admin role
        if ($user->id === $request->user()->id && $request->role === 'staff') {
            return response()->json(['message' => 'You cannot demote yourself.'], 422);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'role' => 'sometimes|in:admin,staff',
            'password' => 'sometimes|string|min:6',
        ]);

        $oldValues = $user->only(['name', 'role']);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        $this->audit->updated($request->user(), $user, $oldValues, $user->only(['name', 'role']));

        return response()->json([
            'message' => 'User updated',
            'data'    => $user->only(['id', 'name', 'email', 'role']),
        ]);
    }

    // ── DELETE /api/users/{id} ─────────────────────────────────
    public function destroy(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        // Cannot delete yourself
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        $this->audit->deleted($request->user(), $user);

        // SoftDelete — sets deleted_at, data preserved
        $user->delete();

        return response()->json(['message' => 'User removed']);
    }
}
