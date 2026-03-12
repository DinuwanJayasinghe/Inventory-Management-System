<?php
// =============================================================
//  CupboardController — Storage cupboard CRUD
//  GET    /api/cupboards          → list all cupboards with place counts
//  POST   /api/cupboards          → create new cupboard
//  PUT    /api/cupboards/{id}     → update name/description
//  DELETE /api/cupboards/{id}     → delete (blocked if has places)
// =============================================================

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cupboard;
use App\Services\AuditService;
use Illuminate\Http\Request;

class CupboardController extends Controller
{
    public function __construct(private AuditService $audit) {}

    // ── GET /api/cupboards ─────────────────────────────────────
    public function index()
    {
        // Eager-load places count to avoid N+1 queries
        $cupboards = Cupboard::withCount('places')
                             ->orderBy('created_at', 'asc')
                             ->get();

        return response()->json(['data' => $cupboards]);
    }

    // ── POST /api/cupboards ────────────────────────────────────
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $validated['created_by'] = $request->user()->id;

        $cupboard = Cupboard::create($validated);

        $this->audit->created($request->user(), $cupboard, ['name' => $cupboard->name]);

        return response()->json(['message' => 'Cupboard created', 'data' => $cupboard], 201);
    }

    // ── PUT /api/cupboards/{id} ────────────────────────────────
    public function update(Request $request, string $id)
    {
        $cupboard = Cupboard::findOrFail($id);
        $old = $cupboard->only(['name', 'description']);

        $validated = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
        ]);

        $cupboard->update($validated);
        $this->audit->updated($request->user(), $cupboard, $old, $cupboard->only(['name', 'description']));

        return response()->json(['message' => 'Cupboard updated', 'data' => $cupboard]);
    }

    // ── DELETE /api/cupboards/{id} ─────────────────────────────
    public function destroy(Request $request, string $id)
    {
        $cupboard = Cupboard::withCount('places')->findOrFail($id);

        // Business rule: cannot delete a cupboard that contains places
        // This protects data integrity — must remove places first
        if ($cupboard->places_count > 0) {
            return response()->json([
                'message' => "Cannot delete — this cupboard has {$cupboard->places_count} place(s). Remove all places first."
            ], 422);
        }

        $this->audit->deleted($request->user(), $cupboard);
        $cupboard->delete();

        return response()->json(['message' => 'Cupboard deleted']);
    }
}
