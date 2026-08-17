<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Client\ClientController;
use App\Http\Controllers\Api\Task\TaskController;
use App\Http\Controllers\Api\Attendance\AttendanceController;
use App\Http\Controllers\Api\User\UserController;
use App\Http\Controllers\Api\SystemLog\SystemLogController;
use App\Http\Controllers\Api\Report\ReportController;

Route::post('/login', [AuthController::class, 'login']);

// Dummy route for frontend manual logs (since observers handle it automatically)
Route::post('/system-logs-dummy', function () {
    return response()->json(['status' => 'Success']);
});

Route::post('/reports/download-all-zip', [ReportController::class, 'downloadReport']);
Route::post('/reports/all-data', [ReportController::class, 'getAllData']);
Route::post('/reports/send-email', function () {
    // dummy endpoint for now to prevent errors
    return response()->json(['status' => 'Success', 'message' => 'Email sent successfully']);
});

use App\Http\Controllers\Api\JobTitleController;
Route::get('/job-titles', [JobTitleController::class, 'getMap']);
Route::get('/job-titles/admin', [JobTitleController::class, 'indexAdmin']);
Route::post('/job-titles', [JobTitleController::class, 'store']);
Route::put('/job-titles/{id}', [JobTitleController::class, 'update']);
Route::delete('/job-titles/{id}', [JobTitleController::class, 'destroy']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::apiResource('clients', ClientController::class);
    Route::apiResource('tasks', TaskController::class);
    Route::post('attendance/seed', [AttendanceController::class, 'seed']);
    Route::delete('attendance/range', [AttendanceController::class, 'deleteRange']);
    Route::apiResource('attendances', AttendanceController::class);
    
    // Admin only routes
    Route::middleware('role:admin')->group(function () {
        Route::post('users/bulk', [UserController::class, 'bulk']);
        Route::apiResource('users', UserController::class);
        Route::get('system-logs', [SystemLogController::class, 'index']);
        Route::get('system-logs/{log}', [SystemLogController::class, 'show']);
        Route::get('users/{user}/logs', [SystemLogController::class, 'userLogs']);
    });
});
