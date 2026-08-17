<?php

namespace App\Interfaces\Client;

interface ClientServiceInterface
{
    public function getAllClients();
    public function getClientById(int $id);
    public function createClient(array $data);
    public function updateClient(int $id, array $data);
    public function deleteClient(int $id);
}
