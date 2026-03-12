<?php
// =============================================================
//  PlaceController — Places (sub-locations) CRUD
//  GET    /api/places             → all places (with cupboard info)
//  GET    /api/cupboards/{id}/places → places in a specific cupboard
//  POST   /api/places             → create place
//  PUT    /api/places/{id}        → update place
//  DELETE /api/places/{id}        → delete (blocked if has items)
// =============================================================

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Place;
use App\Services\AuditService;
use Illuminate\Http\Request;

class PlaceController extends Controller
{
    public function __construct(private AuditService $audit) {}

    // ── GET /api/places ────────────────────────────────────────
    public function index(Request $request)
    {
        $query = Place::with('cupboard')        // eager load cupboard name
                      ->withCount('items');     // how many items stored here

        // Optional: filter by cupboard_id query param
        if ($request->has('cupboard_id')) {
            $query->where('cupboard_id', $request->cupboard_id);
        }

        $places = $query->orderBy('created_at', 'asc')->get();

        // Shape the response to include cupboard name at top level
        $data = $places->map(fn($p) => [
            'id'            => $p->id,
            'cupboard_id'   => $p->cupboard_id,
            'cupboard_name' => $p->cupboard?->name,
            'name'          => $p->name,
            'description'   => $p->description,
            'items_count'   => $p->items_count,
            'created_at'    => $p->created_at,
        ]);

        return response()->json(['data' => $data]);
    }

    // ── POST /api/places ───────────────────────────────────────
    public function store(Request $request)
    {
        $validated = $request->validate([
            'cupboard_id' => 'required|exists:cupboards,id',
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $validated['created_by'] = $request->user()->id;

        $place = Place::create($validated);
        $place->load('cupboard');

        $this->audit->created($request->user(), $place, [
            'name' => $place->name, 'cupboard' => $place->cupboard?->name
        ]);

        return response()->json(['message' => 'Place created', 'data' => $place], 201);
    }

    // ── PUT /api/places/{id} ───────────────────────────────────
    public function update(Request $request, string $id)
    {
        $place = Place::findOrFail($id);
        $old   = $place->only(['name', 'description']);

        $validated = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
        ]);

        $place->update($validated);
        $this->audit->updated($request->user(), $place, $old, $place->only(['name', 'description']));

        return response()->json(['message' => 'Place updated', 'data' => $place->load('cupboard')]);
    }

    // ── DELETE /api/places/{id} ────────────────────────────────
    public function destroy(Request $request, string $id)
    {
        $place = Place::withCount('items')->findOrFail($id);

        // Business rule: cannot delete a place that has items stored in it
        if ($place->items_count > 0) {
            return response()->json([
                'message' => "Cannot delete — {$place->items_count} item(s) are stored here. Move or delete items first."
            ], 422);
        }

        $this->audit->deleted($request->user(), $place);
        $place->delete();

        return response()->json(['message' => 'Place deleted']);
    }
}
