<?php
// =============================================================
//  BorrowingController
//  GET    /api/borrowings           → list (with filters)
//  POST   /api/borrowings           → create borrow (calls InventoryService)
//  POST   /api/borrowings/{id}/return → process return
//  GET    /api/borrowings/overdue   → overdue borrows list
// =============================================================

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Borrowing;
use App\Models\Item;
use App\Services\InventoryService;
use Illuminate\Http\Request;

class BorrowingController extends Controller
{
    public function __construct(private InventoryService $inventory) {}

    // ── GET /api/borrowings ────────────────────────────────────
    public function index(Request $request)
    {
        $query = Borrowing::with(['item', 'processedBy', 'returnedBy'])
                          ->orderBy('created_at', 'desc');

        // Filter by status
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        // Update overdue status dynamically before returning
        // In production, use a scheduled job (artisan command) for this
        $borrowings = $query->get();
        $borrowings->each(fn($b) => $b->checkOverdue());

        return response()->json(['data' => $borrowings]);
    }

    // ── POST /api/borrowings ───────────────────────────────────
    // All business logic (stock check, qty deduction, audit log)
    // is handled inside InventoryService::borrow()
    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_id'              => 'required|exists:items,id',
            'borrower_name'        => 'required|string|max:255',
            'borrower_contact'     => 'required|string|max:255',
            'borrow_date'          => 'required|date',
            'expected_return_date' => 'required|date|after_or_equal:borrow_date',
            'quantity_borrowed'    => 'required|integer|min:1',
        ]);

        $item = Item::findOrFail($validated['item_id']);

        // Delegate to service — handles stock lock, decrement, audit
        $borrowing = $this->inventory->borrow($item, $validated, $request->user());

        return response()->json([
            'message' => 'Borrow recorded successfully',
            'data'    => $borrowing,
        ], 201);
    }

    // ── POST /api/borrowings/{id}/return ───────────────────────
    public function returnItem(Request $request, string $id)
    {
        $borrowing = Borrowing::with('item')->findOrFail($id);

        // Delegate to service — handles qty restore, status update, audit
        $updated = $this->inventory->returnItem($borrowing, $request->user());

        return response()->json([
            'message' => 'Return processed successfully',
            'data'    => $updated,
        ]);
    }

    // ── GET /api/borrowings/overdue ────────────────────────────
    public function overdue()
    {
        $overdue = Borrowing::with(['item', 'processedBy'])
                            ->where('status', 'overdue')
                            ->orWhere(function ($q) {
                                // Also include active ones past their return date
                                $q->where('status', 'active')
                                  ->where('expected_return_date', '<', now()->toDateString());
                            })
                            ->orderBy('expected_return_date', 'asc')
                            ->get();

        // Mark them overdue in DB
        $overdue->each(fn($b) => $b->checkOverdue());

        return response()->json(['data' => $overdue, 'count' => $overdue->count()]);
    }
}
