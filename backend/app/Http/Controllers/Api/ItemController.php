<?php
// =============================================================
//  ItemController — Inventory Item CRUD
//  GET    /api/items              → list with filters (search, status)
//  POST   /api/items              → create item (with optional image)
//  GET    /api/items/{id}         → single item detail
//  PUT    /api/items/{id}         → update item
//  DELETE /api/items/{id}         → soft delete
//  POST   /api/items/{id}/status  → update status (damaged/missing)
// =============================================================

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Services\InventoryService;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ItemController extends Controller
{
    public function __construct(
        private InventoryService $inventory,
        private AuditService     $audit
    ) {}

    // ── GET /api/items ─────────────────────────────────────────
    public function index(Request $request)
    {
        $query = Item::with(['place.cupboard'])   // eager-load place + cupboard
                     ->whereNull('deleted_at');

        // Search by name or code
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")   // ilike = case-insensitive in PostgreSQL
                  ->orWhere('code', 'ilike', "%{$search}%");
            });
        }

        // Filter by status
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $items = $query->orderBy('created_at', 'desc')->get();

        // Shape response — flatten place/cupboard info
        $data = $items->map(fn($item) => $this->formatItem($item));

        return response()->json(['data' => $data]);
    }

    // ── POST /api/items ────────────────────────────────────────
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'code'          => 'required|string|max:100|unique:items,code',
            'quantity'      => 'required|integer|min:0',
            'serial_number' => 'nullable|string|max:255',
            'description'   => 'nullable|string',
            'place_id'      => 'required|exists:places,id',
            'status'        => 'required|in:in_store,borrowed,damaged,missing',
            'image'         => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        // Handle image upload to storage/app/public/items/
        if ($request->hasFile('image')) {
            // store() generates a unique filename automatically
            $validated['image_path'] = $request->file('image')->store('items', 'public');
        }

        $validated['created_by'] = $request->user()->id;
        $item = Item::create($validated);
        $item->load('place.cupboard');

        $this->audit->created($request->user(), $item, [
            'name' => $item->name, 'code' => $item->code, 'quantity' => $item->quantity
        ]);

        return response()->json([
            'message' => 'Item created',
            'data'    => $this->formatItem($item),
        ], 201);
    }

    // ── GET /api/items/{id} ────────────────────────────────────
    public function show(string $id)
    {
        $item = Item::with(['place.cupboard', 'borrowings' => function ($q) {
            $q->orderBy('created_at', 'desc')->limit(10);
        }])->findOrFail($id);

        return response()->json(['data' => $this->formatItem($item, true)]);
    }

    // ── PUT /api/items/{id} ────────────────────────────────────
    public function update(Request $request, string $id)
    {
        $item = Item::findOrFail($id);
        $old  = $item->only(['name', 'code', 'quantity', 'description', 'place_id', 'status']);

        $validated = $request->validate([
            'name'          => 'sometimes|string|max:255',
            'code'          => "sometimes|string|max:100|unique:items,code,{$id}",
            'quantity'      => 'sometimes|integer|min:0',
            'serial_number' => 'nullable|string|max:255',
            'description'   => 'nullable|string',
            'place_id'      => 'sometimes|exists:places,id',
            'image'         => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($item->image_path) Storage::disk('public')->delete($item->image_path);
            $validated['image_path'] = $request->file('image')->store('items', 'public');
        }

        $item->update($validated);
        $item->load('place.cupboard');

        $this->audit->updated($request->user(), $item, $old, $item->only(array_keys($old)));

        return response()->json(['message' => 'Item updated', 'data' => $this->formatItem($item)]);
    }

    // ── DELETE /api/items/{id} ─────────────────────────────────
    public function destroy(Request $request, string $id)
    {
        $item = Item::findOrFail($id);

        // Cannot delete item with active borrowings
        if ($item->activeBorrowings()->exists()) {
            return response()->json([
                'message' => 'Cannot delete — item has active borrowings. Process returns first.'
            ], 422);
        }

        $this->audit->deleted($request->user(), $item);
        $item->delete();

        return response()->json(['message' => 'Item deleted']);
    }

    // ── POST /api/items/{id}/status ────────────────────────────
    // Manually mark item as damaged or missing
    public function updateStatus(Request $request, string $id)
    {
        $request->validate([
            'status' => 'required|in:in_store,borrowed,damaged,missing',
        ]);

        $item = Item::findOrFail($id);
        $updated = $this->inventory->updateStatus($item, $request->status, $request->user());

        return response()->json(['message' => 'Status updated', 'data' => $this->formatItem($updated->load('place.cupboard'))]);
    }

    // ── Helper: shape item response ────────────────────────────
    // Flattens the nested place/cupboard relations into a flat structure
    // that matches what the React frontend expects.
    private function formatItem(Item $item, bool $withBorrowings = false): array
    {
        $data = [
            'id'            => $item->id,
            'name'          => $item->name,
            'code'          => $item->code,
            'quantity'      => $item->quantity,
            'serial_number' => $item->serial_number,
            'description'   => $item->description,
            'status'        => $item->status,
            'place_id'      => $item->place_id,
            'place_name'    => $item->place?->name,
            'cupboard_name' => $item->place?->cupboard?->name,
            'image_url'     => $item->image_path
                                ? asset('storage/' . $item->image_path)
                                : null,
            'created_at'    => $item->created_at,
        ];

        if ($withBorrowings) {
            $data['borrowings'] = $item->borrowings ?? [];
        }

        return $data;
    }
}
