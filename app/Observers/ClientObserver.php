<?php

namespace App\Observers;

use App\Models\Client;
use App\Models\SystemLog;

class ClientObserver
{
    private function logAction(Client $client, string $action)
    {
        if (auth()->check()) {
            SystemLog::create([
                'performed_by' => auth()->id(),
                'user_id' => null, // Not a user action
                'action' => $action . ' Client',
                'details' => 'Client Name: ' . $client->name,
            ]);
        }
    }

    public function created(Client $client): void
    {
        $this->logAction($client, 'Created');
    }

    public function updated(Client $client): void
    {
        $this->logAction($client, 'Updated');
    }

    public function deleted(Client $client): void
    {
        $this->logAction($client, 'Deleted');
    }

    public function restored(Client $client): void
    {
        $this->logAction($client, 'Restored');
    }

    public function forceDeleted(Client $client): void
    {
        $this->logAction($client, 'Force Deleted');
    }
}
