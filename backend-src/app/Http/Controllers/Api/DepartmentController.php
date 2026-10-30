<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DepartmentController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Department::withCount('employees')->orderBy('name')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeHr($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120', 'unique:departments,name'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        return response()->json(Department::create($data), 201);
    }

    public function update(Request $request, Department $department): JsonResponse
    {
        $this->authorizeHr($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120', Rule::unique('departments', 'name')->ignore($department->id)],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $department->update($data);

        return response()->json($department);
    }

    public function destroy(Request $request, Department $department): JsonResponse
    {
        $this->authorizeHr($request);

        if ($department->employees()->exists()) {
            return response()->json([
                'message' => 'Move or remove the employees in this department before deleting it.',
            ], 422);
        }

        $department->delete();

        return response()->json(['message' => 'Department deleted.']);
    }

    private function authorizeHr(Request $request): void
    {
        abort_unless($request->user()->isHr(), 403, 'Only HR can manage departments.');
    }
}
