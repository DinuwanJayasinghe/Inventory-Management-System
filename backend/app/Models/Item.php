<?php
// =============================================================
//  Item Model
//  - Core inventory entity
//  - quantity: controlled via InventoryService (never set directly)
//  - status: enum — in_store | borrowed | damaged | missing
//  - SoftDeletes: history preserved even after "deletion"
// =============================================================

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Item extends Model
{
    use SoftDeletes;

    public $incrementing = false;
    protected $keyType   = 'string';

    protected $fillable = [
        'id', 'name', 'code', 'quantity', 'serial_number',
        'image_path', 'description', 'place_id', 'status', 'created_by',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->id ??= (string) Str::uuid());
    }

    // ── Relationships ──────────────────────────────────────────

    // Where this item is stored
    public function place()
    {
        return $this->belongsTo(Place::class)->with('cupboard');
    }

    // All borrow records for this item
    public function borrowings()
    {
        return $this->hasMany(Borrowing::class);
    }

    // Active (not returned) borrowings only
    public function activeBorrowings()
    {
        return $this->hasMany(Borrowing::class)->whereIn('status', ['active', 'overdue']);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Status Helpers ─────────────────────────────────────────

    public function isAvailable(): bool
    {
        return $this->status === 'in_store' && $this->quantity > 0;
    }

    // Recalculate status after qty change (called by InventoryService)
    public function recalculateStatus(): void
    {
        // Only auto-update if not manually marked damaged/missing
        if (in_array($this->status, ['damaged', 'missing'])) return;

        if ($this->quantity === 0) {
            $this->status = 'borrowed';
        } else {
            $this->status = 'in_store';
        }
    }
}
