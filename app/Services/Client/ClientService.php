<?php

namespace App\Services\Client;

use App\Interfaces\Client\ClientServiceInterface;
use App\Models\Client;

class ClientService implements ClientServiceInterface
{
    public function getAllClients()
    {
        return Client::get();
    }

    public function getClientById(int $id)
    {
        return Client::find($id);
    }

    public function createClient(array $data)
    {
        return Client::create($data);
    }

    public function updateClient(int $id, array $data)
    {
        $client = Client::find($id);
        if ($client) {
            $client->update($data);
            return $client;
        }
        return null;
    }

    public function deleteClient(int $id)
    {
        $client = Client::find($id);
        if ($client) {
            $client->delete();
            return true;
        }
        return false;
    }
}
