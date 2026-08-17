<?php

namespace App\Observers;

use App\Models\Task;
use App\Models\SystemLog;

class TaskObserver
{
    private function logAction(Task $task, string $action)
    {
        if (auth()->check()) {
            SystemLog::create([
                'performed_by' => auth()->id(),
                'user_id' => $task->assigned_to, // Relevant user
                'action' => $action . ' Task',
                'details' => 'Task Title: ' . $task->title,
            ]);
        }
    }

    public function created(Task $task): void
    {
        $this->logAction($task, 'Created');
    }

    public function updated(Task $task): void
    {
        $this->logAction($task, 'Updated');
    }

    public function deleted(Task $task): void
    {
        $this->logAction($task, 'Deleted');
    }

    public function restored(Task $task): void
    {
        $this->logAction($task, 'Restored');
    }

    public function forceDeleted(Task $task): void
    {
        $this->logAction($task, 'Force Deleted');
    }
}
