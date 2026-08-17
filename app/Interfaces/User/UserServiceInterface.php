<?php

namespace App\Interfaces\User;

interface UserServiceInterface
{
    public function getAllUsers(?string $type = null);
    public function getUserById(int $id);
    public function createUser(array $data);
    public function updateUser(int $id, array $data);
    public function deleteUser(int $id);
}
