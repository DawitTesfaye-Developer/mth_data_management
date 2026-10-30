<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeaveType;
use App\Models\Position;
use Illuminate\Http\JsonResponse;

class LookupController extends Controller
{
    public function positions(): JsonResponse
    {
        return response()->json(Position::orderBy('title')->get());
    }

    public function leaveTypes(): JsonResponse
    {
        return response()->json(LeaveType::orderBy('name')->get());
    }
}
