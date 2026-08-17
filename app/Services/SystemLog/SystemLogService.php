<?php

namespace App\Services\SystemLog;

use App\Interfaces\SystemLog\SystemLogServiceInterface;
use App\Models\SystemLog;

class SystemLogService implements SystemLogServiceInterface
{
    public function getAllLogs()
    {
        return SystemLog::with(['performer', 'targetUser'])->orderBy('created_at', 'desc')->paginate(15);
    }

    public function getLogById(int $id)
    {
        return SystemLog::with(['performer', 'targetUser'])->find($id);
    }

    public function getLogsForUser(int $userId)
    {
        return SystemLog::with(['performer', 'targetUser'])
            ->where('user_id', $userId)
            ->orWhere('performed_by', $userId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function logAction(int $userId, string $action, string $details = null)
    {
        return SystemLog::create([
            'performed_by' => $userId,
            'action' => $action,
            'details' => $details,
        ]);
    }
}
