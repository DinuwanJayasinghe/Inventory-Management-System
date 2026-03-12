<?php
// =============================================================
//  AuditService
//  Centralized service for writing audit log entries.
//
//  WHY NOT USE MODEL OBSERVERS DIRECTLY?
//  Observers fire on every save() — including internal ones.
//  This service lets us write MEANINGFUL logs with context
//  (e.g., "who borrowed what from whom") not just field diffs.
//  We use both: observers for simple field changes,
//  AuditService for complex business events.
// =============================================================

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditService
{
    // The current HTTP request (injected for IP address capture)
    public function __construct(private ?Request $request = null) {}

    // ── Write a log entry ──────────────────────────────────────
    // $actor    — User who performed the action
    // $action   — event type string (e.g. 'item_created', 'borrowed')
    // $model    — the Eloquent model that was affected
    // $oldValues — associative array of fields before change (nullable)
    // $newValues — associative array of fields after change (nullable)
    public function log(
        User   $actor,
        string $action,
        Model  $model,
        ?array $oldValues = null,
        ?array $newValues = null
    ): ActivityLog {
        return ActivityLog::create([
            'user_id'    => $actor->id,
            'action'     => $action,
            'model_type' => class_basename($model), // e.g. 'Item', 'Borrowing'
            'model_id'   => $model->getKey(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => $this->request?->ip(),
        ]);
    }

    // ── Shorthand for simple create events ────────────────────
    public function created(User $actor, Model $model, array $newValues): ActivityLog
    {
        return $this->log($actor, strtolower(class_basename($model)) . '_created', $model, null, $newValues);
    }

    // ── Shorthand for simple update events ────────────────────
    public function updated(User $actor, Model $model, array $oldValues, array $newValues): ActivityLog
    {
        return $this->log($actor, strtolower(class_basename($model)) . '_updated', $model, $oldValues, $newValues);
    }

    // ── Shorthand for delete events ────────────────────────────
    public function deleted(User $actor, Model $model): ActivityLog
    {
        return $this->log($actor, strtolower(class_basename($model)) . '_deleted', $model, $model->toArray(), null);
    }
}
