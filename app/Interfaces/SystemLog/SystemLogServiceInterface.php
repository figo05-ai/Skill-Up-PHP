<?php

namespace App\Interfaces\SystemLog;

interface SystemLogServiceInterface
{
    public function getAllLogs();
    public function getLogById(int $id);
    public function getLogsForUser(int $userId);
    public function logAction(int $userId, string $action, string $details = null);
}
