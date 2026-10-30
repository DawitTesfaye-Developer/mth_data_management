<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\LeaveRequestController;
use App\Http\Controllers\Api\LookupController;
use Illuminate\Support\Facades\Route;

Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:6,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    Route::get('dashboard', DashboardController::class);

    Route::get('positions', [LookupController::class, 'positions']);
    Route::get('leave-types', [LookupController::class, 'leaveTypes']);

    Route::apiResource('departments', DepartmentController::class)->except('show');
    Route::apiResource('employees', EmployeeController::class);

    Route::get('leave-requests', [LeaveRequestController::class, 'index']);
    Route::post('leave-requests', [LeaveRequestController::class, 'store']);
    Route::patch('leave-requests/{leaveRequest}/approve', [LeaveRequestController::class, 'approve']);
    Route::patch('leave-requests/{leaveRequest}/reject', [LeaveRequestController::class, 'reject']);
    Route::delete('leave-requests/{leaveRequest}', [LeaveRequestController::class, 'destroy']);

    Route::get('attendance', [AttendanceController::class, 'index']);
    Route::get('attendance/today', [AttendanceController::class, 'today']);
    Route::post('attendance/clock-in', [AttendanceController::class, 'clockIn']);
    Route::post('attendance/clock-out', [AttendanceController::class, 'clockOut']);
});
