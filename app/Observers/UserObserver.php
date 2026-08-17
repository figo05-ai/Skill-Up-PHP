<?php

namespace App\Observers;

use App\Models\User;
use App\Models\SystemLog;

class UserObserver
{
    private function logAction(User $user, string $action)
    {
        if (auth()->check()) {
            SystemLog::create([
                'performed_by' => auth()->id(),
                'user_id' => $user->id,
                'action' => $action . ' User',
                'details' => 'User Email: ' . $user->email,
            ]);
        }
    }

    public function created(User $user): void
    {
        $this->logAction($user, 'Created');
    }

    public function updated(User $user): void
    {
        $this->logAction($user, 'Updated');
    }

    public function deleted(User $user): void
    {
        $this->logAction($user, 'Deleted');
    }

    public function restored(User $user): void
    {
        $this->logAction($user, 'Restored');
    }

    public function forceDeleted(User $user): void
    {
        $this->logAction($user, 'Force Deleted');
    }
}
