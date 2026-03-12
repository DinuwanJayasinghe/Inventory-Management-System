<?php
// =============================================================
//  DashboardController — Summary stats for the dashboard
//  GET /api/dashboard → returns all stats in one call
//  (avoids multiple round-trips from the frontend)
// =============================================================

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Item, Borrowing, User, ActivityLog};
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        // ── Item status counts ─────────────────────────────────
        // Single query with GROUP BY — much faster than 4 separate queries
        $statusCounts = Item::whereNull('deleted_at')
                            ->select('status', DB::raw('count(*) as count'))
                            ->groupBy('status')
                            ->pluck('count', 'status');

        // ── Borrowing counts ───────────────────────────────────
        $borrowCounts = Borrowing::select('status', DB::raw('count(*) as count'))
                                 ->groupBy('status')
                                 ->pluck('count', 'status');

        // ── Monthly borrow/return trend (last 6 months) ────────
        $sixMonthsAgo = now()->subMonths(6)->startOfMonth();

        $monthlyBorrows = Borrowing::select(
                DB::raw("TO_CHAR(borrow_date, 'Mon') as month"),
                DB::raw("TO_CHAR(borrow_date, 'YYYY-MM') as sort_key"),
                DB::raw('count(*) as borrowed'),
                DB::raw("sum(case when status = 'returned' then 1 else 0 end) as returned")
            )
            ->where('borrow_date', '>=', $sixMonthsAgo)
            ->groupBy(DB::raw("TO_CHAR(borrow_date, 'Mon')"), DB::raw("TO_CHAR(borrow_date, 'YYYY-MM')"))
            ->orderBy('sort_key')
            ->get(['month', 'borrowed', 'returned']);

        // ── Recent activity (last 10 log entries) ─────────────
        $recentLogs = ActivityLog::with('user')
                                 ->orderBy('created_at', 'desc')
                                 ->limit(10)
                                 ->get()
                                 ->map(fn($l) => [
                                     'id'     => $l->id,
                                     'user'   => $l->user?->name,
                                     'action' => $l->action,
                                     'desc'   => $this->describeLog($l),
                                     'ts'     => $l->created_at->format('d/m/Y H:i'),
                                 ]);

        return response()->json([
            'stats' => [
                'total_items'    => array_sum($statusCounts->toArray()),
                'in_store'       => $statusCounts->get('in_store', 0),
                'borrowed'       => $statusCounts->get('borrowed', 0),
                'damaged'        => $statusCounts->get('damaged', 0),
                'missing'        => $statusCounts->get('missing', 0),
                'active_borrows' => $borrowCounts->get('active', 0) + $borrowCounts->get('overdue', 0),
                'overdue'        => $borrowCounts->get('overdue', 0),
                'total_users'    => User::whereNull('deleted_at')->count(),
            ],
            'chart_data'    => $monthlyBorrows,
            'recent_logs'   => $recentLogs,
        ]);
    }

    // Build a human-readable description from a log entry
    private function describeLog($log): string
    {
        $labels = [
            'item_created'    => 'Created item',
            'item_updated'    => 'Updated item',
            'item_deleted'    => 'Deleted item',
            'quantity_changed'=> 'Quantity changed',
            'status_changed'  => 'Status changed',
            'borrowed'        => 'Item borrowed',
            'returned'        => 'Item returned',
            'user_created'    => 'User created',
        ];

        $label = $labels[$log->action] ?? ucfirst(str_replace('_', ' ', $log->action));
        $model = $log->model_type . ' #' . substr($log->model_id, 0, 8);

        return "{$label} — {$model}";
    }
}
