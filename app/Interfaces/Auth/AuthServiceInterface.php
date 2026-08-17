<?php

namespace App\Interfaces\Auth;

interface AuthServiceInterface
{
    /**
     * Authenticate user and generate access token.
     *
     * @param array $credentials
     * @return array|null Returns user data and token on success, null on failure.
     */
    public function login(array $credentials): ?array;
}
