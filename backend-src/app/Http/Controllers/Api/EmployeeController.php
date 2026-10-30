<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Employee::query()->with(['department:id,name', 'position:id,title']);

        if ($search = trim((string) $request->query('search'))) {
            $like = '%'.$search.'%';
            $query->where(function ($q) use ($like) {
                $q->where('first_name', 'ilike', $like)
                    ->orWhere('last_name', 'ilike', $like)
                    ->orWhere('email', 'ilike', $like)
                    ->orWhere('employee_number', 'ilike', $like);
            });
        }

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->query('department_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $perPage = min((int) $request->query('per_page', 15), 100);
        $page = $query->orderBy('first_name')->orderBy('last_name')->paginate($perPage);

        $viewer = $request->user();
        $page->getCollection()->each(fn (Employee $e) => $this->scrub($e, $viewer));

        return response()->json($page);
    }

    public function show(Request $request, Employee $employee): JsonResponse
    {
        $employee->load(['department', 'position', 'user:id,role']);
        $this->scrub($employee, $request->user());

        return response()->json($employee);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeHr($request);

        $withAccount = $request->filled('password');
        $data = $request->validate($this->rules(null, $withAccount));

        if (($data['role'] ?? null) === 'admin' && ! $request->user()->isAdmin()) {
            abort(403, 'Only an admin can create another admin.');
        }

        $employee = DB::transaction(function () use ($data, $withAccount) {
            $userId = null;

            if ($withAccount) {
                $userId = User::create([
                    'name' => $data['first_name'].' '.$data['last_name'],
                    'email' => $data['email'],
                    'password' => $data['password'],
                    'role' => $data['role'] ?? 'employee',
                ])->id;
            }

            return Employee::create(collect($data)->except(['password', 'role'])->all() + ['user_id' => $userId]);
        });

        return response()->json($employee->load(['department', 'position']), 201);
    }

    public function update(Request $request, Employee $employee): JsonResponse
    {
        $this->authorizeHr($request);

        $data = $request->validate($this->rules($employee, false));

        DB::transaction(function () use ($employee, $data) {
            $employee->update($data);

            // keep the login account in sync with the HR record
            $employee->user?->update([
                'name' => $employee->full_name,
                'email' => $employee->email,
            ]);
        });

        return response()->json($employee->fresh(['department', 'position']));
    }

    public function destroy(Request $request, Employee $employee): JsonResponse
    {
        $this->authorizeHr($request);

        abort_if($employee->user_id === $request->user()->id, 422, 'You cannot delete your own record.');

        DB::transaction(function () use ($employee) {
            if ($employee->user) {
                $employee->user->tokens()->delete();
                $employee->user->delete();
            }
            $employee->delete();
        });

        return response()->json(['message' => 'Employee removed.']);
    }

    private function rules(?Employee $employee, bool $withAccount): array
    {
        $emailRules = ['required', 'email', 'max:255', Rule::unique('employees', 'email')->ignore($employee?->id)];

        if ($withAccount) {
            $emailRules[] = Rule::unique('users', 'email');
        } elseif ($employee?->user_id) {
            $emailRules[] = Rule::unique('users', 'email')->ignore($employee->user_id);
        }

        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => $emailRules,
            'phone' => ['nullable', 'string', 'max:40'],
            'gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'address' => ['nullable', 'string', 'max:500'],
            'hire_date' => ['required', 'date'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'position_id' => ['nullable', 'exists:positions,id'],
            'employment_type' => ['required', Rule::in(['full_time', 'part_time', 'contract', 'intern'])],
            'status' => ['required', Rule::in(['active', 'on_leave', 'terminated'])],
            'salary' => ['nullable', 'numeric', 'min:0', 'max:9999999999'],
            'emergency_contact_name' => ['nullable', 'string', 'max:120'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:40'],
            // only used when creating a login account together with the employee
            'password' => [$withAccount ? 'required' : 'prohibited', 'string', 'min:8'],
            'role' => [$withAccount ? 'sometimes' : 'prohibited', Rule::in(['employee', 'hr', 'admin'])],
        ];
    }

    private function scrub(Employee $employee, User $viewer): void
    {
        $isOwnRecord = $employee->user_id !== null && $employee->user_id === $viewer->id;

        if (! $viewer->isHr() && ! $isOwnRecord) {
            $employee->makeHidden(Employee::SENSITIVE);
        }
    }

    private function authorizeHr(Request $request): void
    {
        abort_unless($request->user()->isHr(), 403, 'Only HR can change employee records.');
    }
}
