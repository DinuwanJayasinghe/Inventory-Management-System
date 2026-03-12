<?php
// =============================================================
//  User Model
//  - Uses UUID primary key (not auto-increment integer)
//  - Enum role: 'admin' | 'staff'
//  - HasApiTokens: enables Laravel Sanctum token generation
//  - SoftDeletes: deleted_at instead of permanent delete
// =============================================================

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    // ── Tell Eloquent the PK is not auto-incrementing integer ──
    public $incrementing = false;
    protected $keyType   = 'string'; // UUID stored as string

    protected $fillable = [
        'id', 'name', 'email', 'password', 'role',
    ];

    protected $hidden = [
        'password', 'remember_token', // never expose these in API responses
    ];

protected $casts = [
    'email_verified_at' => 'datetime',
    'role'              => 'string',
];

    // ── Boot: auto-generate UUID before creating ───────────────
    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    // ── Relationships ──────────────────────────────────────────
    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function borrowingsProcessed()
    {
        return $this->hasMany(Borrowing::class, 'processed_by');
    }

    // ── Helpers ────────────────────────────────────────────────
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}
