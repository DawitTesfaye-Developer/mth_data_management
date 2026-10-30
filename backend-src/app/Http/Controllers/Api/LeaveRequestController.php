<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LeaveRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = LeaveRequest::query()
            ->with(['employee:id,first_name,last_name,employee_number', 'leaveType:id,name'])
            ->latest();

        if (! $user->isHr()) {
            $query->where('employee_id', $user->employee?->id ?? 0);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        return response()->json($query->paginate(min((int) $request->query('per_page', 15), 100)));
    }

    public function store(Request $request): JsonResponse
    {
        $employee = $request->user()->employee;
        abort_unless($employee, 422, 'Your account is not linked to an employee record.');

        $data = $request->validate([
            'leave_type_id' => ['required', 'exists:leave_types,id'],
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $start = Carbon::parse($data['start_date']);
        $end = Carbon::parse($data['end_date']);

        $days = collect(CarbonPeriod::create($start, $end))->reject(fn ($d) => $d->isWeekend())->count();
        abort_if($days < 1, 422, 'The selected dates only cover a weekend.');

        $overlaps = LeaveRequest::where('employee_id', $employee->id)
            ->whereIn('status', ['pending', 'approved'])
            ->whereDate('start_date', '<=', $end)
            ->whereDate('end_date', '>=', $start)
            ->exists();
        abort_if($overlaps, 422, 'You already have a leave request that overlaps these dates.');

        $leave = LeaveRequest::create($data + ['employee_id' => $employee->id, 'days' => $days]);

        return response()->json($leave->load(['employee:id,first_name,last_name', 'leaveType:id,name']), 201);
    }

    public function approve(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        return $this->decide($request, $leaveRequest, 'approved');
    }

    public function reject(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        return $this->decide($request, $leaveRequest, 'rejected');
    }

    /** Employees can withdraw their own pending requests. */
    public function destroy(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        $employeeId = $request->user()->employee?->id;
        abort_unless($employeeId && $leaveRequest->employee_id === $employeeId, 403);
        abort_unless($leaveRequest->status === 'pending', 422, 'Only pending requests can be cancelled.');

        $leaveRequest->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Request cancelled.']);
    }

    private function decide(Request $request, LeaveRequest $leaveRequest, string $status): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->isHr(), 403, 'Only HR can review leave requests.');
        abort_unless($leaveRequest->status === 'pending', 422, 'This request has already been reviewed.');
        abort_if(
            $leaveRequest->employee?->user_id === $user->id,
            403,
            'You cannot review your own leave request.'
        );

        $data = $request->validate(['review_note' => ['nullable', 'string', 'max:500']]);

        $leaveRequest->update([
            'status' => $status,
            'reviewed_by' => $user->id,
            'reviewed_at' => now(),
            'review_note' => $data['review_note'] ?? null,
        ]);

        return response()->json($leaveRequest->load(['employee:id,first_name,last_name', 'leaveType:id,name']));
    }
}
