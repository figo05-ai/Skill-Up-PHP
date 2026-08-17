<?php

namespace App\Services\User;

use App\Interfaces\User\UserServiceInterface;
use App\Models\User;

class UserService implements UserServiceInterface
{
    public function getAllUsers(?string $type = null)
    {
        $query = User::with('client');
        
        // Hide the superadmin account from all listings
        $query->where('email', '!=', 'ff@gmail.com');
        
        if ($type === 'admin') {
            $query->whereIn('role', ['admin', 'system_user']);
        } elseif ($type === 'staff') {
            $query->where('role', 'staff');
        }

        return $query->get();
    }

    public function getUserById(int $id)
    {
        return User::with('client')->find($id);
    }

    public function createUser(array $data)
    {
        return User::create($data);
    }

    public function updateUser(int $id, array $data)
    {
        $user = User::find($id);
        if ($user) {
            $user->update($data);
            return $user;
        }
        return null;
    }

    public function deleteUser(int $id)
    {
        $user = User::find($id);
        if ($user) {
            $user->delete();
            return true;
        }
        return false;
    }
}
