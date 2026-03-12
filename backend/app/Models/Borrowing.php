<?php
// =============================================================
//  Borrowing Model
//  - Records each borrow transaction
//  - quantity_borrowed is immutable after creation
//  - status: active | returned | overdue
//  - returned_by: nullable until item is returned
// =============================================================

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Borrowing extends Model
{
    public $incrementing = false;
    protected $keyType   = 'string';

    protected $fillable = [
        'id', 'item_id', 'borrower_name', 'borrower_contact',
        'borrow_date', 'expected_return_date', 'actual_return_date',
        'quantity_borrowed', 'status', 'processed_by', 'returned_by',
    ];

    protected $casts = [
        'borrow_date'          => 'date',
        'expected_return_date' => 'date',
        'actual_return_date'   => 'date',
        'quantity_borrowed'    => 'integer',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->id ??= (string) Str::uuid());
    }

    // ── Relationships ──────────────────────────────────────────

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    // Staff member who recorded the borrow
    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    // Staff member who processed the return
    public function returnedBy()
    {
        return $this->belongsTo(User::class, 'returned_by');
    }

    // ── Status Helpers ─────────────────────────────────────────

    public function isActive(): bool
    {
        return in_array($this->status, ['active', 'overdue']);
    }

    // Check if this borrowing is now overdue
    public function checkOverdue(): void
    {
        if ($this->status === 'active' && $this->expected_return_date < now()->toDateString()) {
            $this->status = 'overdue';
            $this->save();
        }
    }
}
