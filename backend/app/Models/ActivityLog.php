<?php
// =============================================================
//  ActivityLog Model
//  - Immutable audit trail — write-once, never updated/deleted
//  - old_values / new_values stored as JSONB
//  - model_type + model_id = polymorphic reference to changed record
//  - No updated_at column (logs never change)
// =============================================================

namespace App\Models; //Database models for Activity log

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ActivityLog extends Model
{
    public $incrementing = false;
    protected $keyType   = 'string';

    // Disable updated_at — logs are write-once
    const UPDATED_AT = null;

    protected $fillable = [
        'id', 'user_id', 'action', 'model_type', 'model_id',
        'old_values', 'new_values', 'ip_address',
    ];

    protected $casts = [
        'old_values' => 'array', // JSONB → PHP array automatically
        'new_values' => 'array',
    ];

    protected static function boot(): void // Laravel lifecycle hook
    {
        parent::boot();
        static::creating(fn($m) => $m->id ??= (string) Str::uuid());
    }

    // ── Relationships ──────────────────────────────────────────

    // Who performed this action
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
