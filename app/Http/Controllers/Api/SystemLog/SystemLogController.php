<?php

namespace App\Http\Controllers\Api\SystemLog;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Interfaces\SystemLog\SystemLogServiceInterface;
use App\Http\Resources\SystemLogResource;

class SystemLogController extends Controller
{
    use ApiResponse;

    protected SystemLogServiceInterface $systemLogService;

    public function __construct(SystemLogServiceInterface $systemLogService)
    {
        $this->systemLogService = $systemLogService;
    }

    public function index()
    {
        $logs = $this->systemLogService->getAllLogs();
        return $this->successResponse(SystemLogResource::collection($logs)->response()->getData(true), 'System logs retrieved successfully.');
    }

    public function show($id)
    {
        $log = $this->systemLogService->getLogById($id);
        
        if (!$log) {
            return $this->errorResponse('System log not found.', 404);
        }

        return $this->successResponse(new SystemLogResource($log), 'System log retrieved successfully.');
    }

    public function userLogs($userId)
    {
        $logs = $this->systemLogService->getLogsForUser($userId);
        return $this->successResponse(SystemLogResource::collection($logs)->response()->getData(true), 'User system logs retrieved successfully.');
    }
}
