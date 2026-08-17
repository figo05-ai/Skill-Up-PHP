<?php

namespace App\Services\Auth;

use App\Interfaces\Auth\AuthServiceInterface;
use Illuminate\Support\Facades\Auth;

class AuthService implements AuthServiceInterface
{
    /**
     * @inheritDoc
     */
    public function login(array $credentials): ?array
    {
        if (Auth::attempt($credentials)) {
            $user = Auth::user();
            
            // Check if login is allowed for this user
            if ($user->allow_login == 0) {
                // Return null if they are not allowed to login (we can handle this case specifically later if needed)
                // For now, let's treat it as a failure to authenticate
                return null;
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            return [
                'user' => $user,
                'token' => $token,
            ];
        }

        return null;
    }
}
