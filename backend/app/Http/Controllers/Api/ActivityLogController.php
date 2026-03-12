<?php
// =============================================================
//  ActivityLogController — Audit log viewer (admin only)
//  GET /api/logs → paginated audit log with filters
// =============================================================

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    // ── GET /api/logs ──────────────────────────────────────────
    public function index(Request $request)
    {
        $query = ActivityLog::with('user')   // eager load who performed the action
                            ->orderBy('created_at', 'desc');

        // Filter by action type
        if ($action = $request->query('action')) {
            $query->where('action', $action);
        }

        // Filter by model type (e.g. only Item events)
        if ($model = $request->query('model')) {
            $query->where('model_type', $model);
        }

        // Text search across model_id or user name
        if ($search = $request->query('search')) {
            $query->whereHas('user', fn($q) => $q->where('name', 'ilike', "%{$search}%"));
        }

        // Paginate — 50 records per page
        $logs = $query->paginate(50);

        // Shape response with user info flattened
        $data = $logs->through(fn($log) => [
            'id'         => $log->id,
            'user'       => $log->user?->name ?? 'System',
            'action'     => $log->action,
            'model_type' => $log->model_type,
            'model_id'   => $log->model_id,
            'old_values' => $log->old_values,
            'new_values' => $log->new_values,
            'ip_address' => $log->ip_address,
            'ts'         => $log->created_at->format('Y-m-d H:i:s'),
        ]);

        return response()->json($data);
    }
}
