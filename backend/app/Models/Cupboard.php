<?php
// =============================================================
//  Cupboard Model
//  - Top-level physical storage unit
//  - Has many Places (sub-locations)
//  - SoftDeletes: safe deletion (cannot delete if has places)
// =============================================================

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Cupboard extends Model
{
    use SoftDeletes;

    public $incrementing = false;
    protected $keyType   = 'string';

    protected $fillable = ['id', 'name', 'description', 'created_by'];

    // ── Auto UUID on create ────────────────────────────────────
    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->id ??= (string) Str::uuid());
    }

    // ── Relationships ──────────────────────────────────────────

    // One cupboard has many places
    public function places()
    {
        return $this->hasMany(Place::class);
    }

    // Who created this cupboard
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Helpers ────────────────────────────────────────────────

    // Count items inside this cupboard (through its places)
    public function itemsCount(): int
    {
        return $this->places()->withCount('items')->get()->sum('items_count');
    }
}
