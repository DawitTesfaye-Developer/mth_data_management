<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Attendance::query()
            ->with('employee:id,first_name,last_name,employee_number')
            ->orderByDesc('date')
            ->orderBy('clock_in');

        if ($user->isHr()) {
            $query->whereDate('date', $request->query('date', today()->toDateString()));
        } else {
            $query->where('employee_id', $user->employee?->id ?? 0);
            if ($request->filled('date')) {
                $query->whereDate('date', $request->query('date'));
            }
        }

        return response()->json($query->paginate(min((int) $request->query('per_page', 31), 100)));
    }

    public function today(Request $request): JsonResponse
    {
        $employee = $request->user()->employee;

        return response()->json(
            $employee ? Attendance::where('employee_id', $employee->id)->whereDate('date', today())->first() : null
        );
    }

    public function clockIn(Request $request): JsonResponse
    {
        $employee = $this->employeeOrFail($request);

        $record = Attendance::firstOrCreate(['employee_id' => $employee->id, 'date' => today()->toDateString()]);
        abort_if($record->clock_in !== null, 422, 'You already clocked in today.');

        $record->update(['clock_in' => now()]);

        return response()->json($record->fresh());
    }

    public function clockOut(Request $request): JsonResponse
    {
        $employee = $this->employeeOrFail($request);

        $record = Attendance::where('employee_id', $employee->id)->whereDate('date', today())->first();
        abort_if(! $record || ! $record->clock_in, 422, 'Clock in before clocking out.');
        abort_if($record->clock_out !== null, 422, 'You already clocked out today.');

        $record->update(['clock_out' => now()]);

        return response()->json($record->fresh());
    }

    private function employeeOrFail(Request $request)
    {
        $employee = $request->user()->employee;
        abort_unless($employee, 422, 'Your account is not linked to an employee record.');

        return $employee;
    }
}
