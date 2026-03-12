<?php
// =============================================================
//  InventoryService
//  Core business logic for quantity management and borrow/return.
//
//  WHY A SERVICE CLASS?
//  Controllers should be thin — only handle HTTP input/output.
//  All business logic lives here so it's testable, reusable,
//  and keeps the codebase clean.
//
//  CONCURRENCY SAFETY:
//  All quantity changes use DB::transaction() + lockForUpdate()
//  to prevent race conditions when multiple users modify
//  the same item simultaneously.
// =============================================================

namespace App\Services;

use App\Models\Item;
use App\Models\Borrowing;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    public function __construct(private AuditService $audit) {}

    // ── Increment Quantity ─────────────────────────────────────
    public function increment(Item $item, int $amount, User $actor): Item
    {
        return DB::transaction(function () use ($item, $amount, $actor) {

            // lockForUpdate() → SELECT FOR UPDATE in PostgreSQL
            // Blocks other transactions from reading this row until we commit.
            // This prevents two simultaneous increments from both reading
            // the same original quantity and both adding to it independently.
            $item = Item::lockForUpdate()->findOrFail($item->id);

            $oldQty = $item->quantity;
            $item->quantity += $amount;
            $item->recalculateStatus();
            $item->save();

            // Write audit log inside same transaction
            $this->audit->log(
                $actor, 'quantity_changed', $item,
                ['quantity' => $oldQty],
                ['quantity' => $item->quantity]
            );

            return $item;
        });
    }

    // ── Decrement Quantity ─────────────────────────────────────
    public function decrement(Item $item, int $amount, User $actor): Item
    {
        return DB::transaction(function () use ($item, $amount, $actor) {

            // Lock row first, THEN check quantity
            // Without locking: two users both read qty=2, both decrement by 2,
            // both pass the check, and qty becomes -2. Bug!
            // With locking: second transaction waits until first commits,
            // then reads updated qty=0 and fails the check correctly.
            $item = Item::lockForUpdate()->findOrFail($item->id);

            if ($item->quantity < $amount) {
                throw ValidationException::withMessages([
                    'quantity' => ["Insufficient stock. Available: {$item->quantity}, Requested: {$amount}"]
                ]);
            }

            $oldQty = $item->quantity;
            $item->quantity -= $amount;
            $item->recalculateStatus();
            $item->save();

            $this->audit->log(
                $actor, 'quantity_changed', $item,
                ['quantity' => $oldQty],
                ['quantity' => $item->quantity]
            );

            return $item;
        });
    }

    // ── Borrow Flow ────────────────────────────────────────────
    // Steps:
    //   1. Lock item row and validate stock
    //   2. Create borrowing record
    //   3. Decrement quantity
    //   4. Update item status if qty hits 0
    //   5. Log the action
    // All inside ONE transaction — either all succeed or all roll back.
    public function borrow(Item $item, array $data, User $actor): Borrowing
    {
        return DB::transaction(function () use ($item, $data, $actor) {

            $item = Item::lockForUpdate()->findOrFail($item->id);

            if ($item->quantity < $data['quantity_borrowed']) {
                throw ValidationException::withMessages([
                    'quantity_borrowed' => [
                        "Only {$item->quantity} unit(s) available."
                    ]
                ]);
            }

            if (!in_array($item->status, ['in_store'])) {
                throw ValidationException::withMessages([
                    'item_id' => ['This item is not available for borrowing.']
                ]);
            }

            // 1. Create borrowing record
            $borrowing = Borrowing::create([
                'item_id'              => $item->id,
                'borrower_name'        => $data['borrower_name'],
                'borrower_contact'     => $data['borrower_contact'],
                'borrow_date'          => $data['borrow_date'],
                'expected_return_date' => $data['expected_return_date'],
                'quantity_borrowed'    => $data['quantity_borrowed'],
                'status'               => 'active',
                'processed_by'         => $actor->id,
            ]);

            // 2. Reduce stock
            $oldQty = $item->quantity;
            $item->quantity -= $data['quantity_borrowed'];
            $item->recalculateStatus();
            $item->save();

            // 3. Audit log
            $this->audit->log(
                $actor, 'borrowed', $item,
                ['quantity' => $oldQty, 'status' => 'in_store'],
                ['quantity' => $item->quantity, 'status' => $item->status,
                 'borrower' => $data['borrower_name']]
            );

            return $borrowing->load('item', 'processedBy');
        });
    }

    // ── Return Flow ────────────────────────────────────────────
    // Steps:
    //   1. Validate borrowing is still active
    //   2. Mark borrowing as returned
    //   3. Restore quantity to item
    //   4. Recalculate item status
    //   5. Log the return
    public function returnItem(Borrowing $borrowing, User $actor): Borrowing
    {
        return DB::transaction(function () use ($borrowing, $actor) {

            if (!$borrowing->isActive()) {
                throw ValidationException::withMessages([
                    'borrowing' => ['This item has already been returned.']
                ]);
            }

            $item = Item::lockForUpdate()->findOrFail($borrowing->item_id);

            // 1. Update borrowing record
            $borrowing->update([
                'status'             => 'returned',
                'actual_return_date' => now()->toDateString(),
                'returned_by'        => $actor->id,
            ]);

            // 2. Restore quantity
            $oldQty = $item->quantity;
            $item->quantity += $borrowing->quantity_borrowed;
            $item->recalculateStatus();
            $item->save();

            // 3. Audit log
            $this->audit->log(
                $actor, 'returned', $item,
                ['quantity' => $oldQty, 'status' => $item->getOriginal('status')],
                ['quantity' => $item->quantity, 'status' => $item->status,
                 'borrower' => $borrowing->borrower_name]
            );

            return $borrowing->load('item', 'returnedBy');
        });
    }

    // ── Update Item Status Manually ────────────────────────────
    // For marking items as damaged or missing
    public function updateStatus(Item $item, string $newStatus, User $actor): Item
    {
        $oldStatus = $item->status;
        $item->status = $newStatus;
        $item->save();

        $this->audit->log(
            $actor, 'status_changed', $item,
            ['status' => $oldStatus],
            ['status' => $newStatus]
        );

        return $item;
    }
}
