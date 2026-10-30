<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = today();

        if (! $user->isHr()) {
            $employee = $user->employee;

            return response()->json([
                'scope' => 'self',
                'pending_requests' => $employee ? $employee->leaveRequests()->where('status', 'pending')->count() : 0,
                'leave_days_taken' => $employee
                    ? (int) $employee->leaveRequests()->where('status', 'approved')->whereYear('start_date', $today->year)->sum('days')
                    : 0,
            ]);
        }

        $onLeaveToday = LeaveRequest::where('status', 'approved')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->distinct()
            ->count('employee_id');

        return response()->json([
            'scope' => 'hr',
            'headcount' => Employee::where('status', '!=', 'terminated')->count(),
            'present_today' => Attendance::whereDate('date', $today)->whereNotNull('clock_in')->count(),
            'on_leave_today' => $onLeaveToday,
            'pending_requests' => LeaveRequest::where('status', 'pending')->count(),
            'new_hires_30d' => Employee::where('hire_date', '>=', $today->copy()->subDays(30))->count(),
            'by_department' => Department::withCount(['employees' => fn ($q) => $q->where('status', '!=', 'terminated')])
                ->orderByDesc('employees_count')
                ->get()
                ->map(fn ($d) => ['id' => $d->id, 'name' => $d->name, 'count' => $d->employees_count])
                ->values(),
            'recent_hires' => Employee::with(['department:id,name', 'position:id,title'])
                ->orderByDesc('hire_date')->limit(5)->get()
                ->each->makeHidden(Employee::SENSITIVE),
            'pending_list' => LeaveRequest::with(['employee:id,first_name,last_name', 'leaveType:id,name'])
                ->where('status', 'pending')->orderBy('start_date')->limit(5)->get(),
        ]);
    }
}
