<?php

namespace App\Observers;

use App\Models\Attendance;
use App\Models\SystemLog;

class AttendanceObserver
{
    private function logAction(Attendance $attendance, string $action)
    {
        if (auth()->check()) {
            SystemLog::create([
                'performed_by' => auth()->id(),
                'user_id' => $attendance->user_id, // Relevant user
                'action' => $action . ' Attendance',
                'details' => 'Date: ' . $attendance->date,
            ]);
        }
    }

    public function created(Attendance $attendance): void
    {
        $this->logAction($attendance, 'Created');
    }

    public function updated(Attendance $attendance): void
    {
        $this->logAction($attendance, 'Updated');
    }

    public function deleted(Attendance $attendance): void
    {
        $this->logAction($attendance, 'Deleted');
    }

    public function restored(Attendance $attendance): void
    {
        $this->logAction($attendance, 'Restored');
    }

    public function forceDeleted(Attendance $attendance): void
    {
        $this->logAction($attendance, 'Force Deleted');
    }
}
