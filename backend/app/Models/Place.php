<?php
// =============================================================
//  Place Model
//  - Sub-location inside a Cupboard (shelf, drawer, etc.)
//  - Each Item references a Place (not a Cupboard directly)
//  - Reason: Cupboard can have multiple distinct sub-locations
// =============================================================

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Place extends Model
{
    use SoftDeletes;

    public $incrementing = false;
    protected $keyType   = 'string';

    protected $fillable = ['id', 'cupboard_id', 'name', 'description', 'created_by'];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->id ??= (string) Str::uuid());
    }

    // ── Relationships ──────────────────────────────────────────

    // This place belongs to a cupboard
    public function cupboard()
    {
        return $this->belongsTo(Cupboard::class);
    }

    // This place stores many items
    public function items()
    {
        return $this->hasMany(Item::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
