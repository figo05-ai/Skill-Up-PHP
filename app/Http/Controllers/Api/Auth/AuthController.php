<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Responses\ApiResponse;
use App\Interfaces\Auth\AuthServiceInterface;

class AuthController extends Controller
{
    use ApiResponse;

    protected AuthServiceInterface $authService;

    /**
     * Injecting AuthServiceInterface to strictly decouple logic from the controller.
     */
    public function __construct(AuthServiceInterface $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Handle user login.
     *
     * @param LoginRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(LoginRequest $request)
    {
        // 1. Data is already validated in LoginRequest
        $credentials = $request->only('email', 'password');

        // 2. Delegate business logic to the Service
        $authData = $this->authService->login($credentials);

        if (!$authData) {
            // 3. Return standardized error response if login fails
            return $this->errorResponse('Invalid credentials or account is deactivated.', 401);
        }

        // 4. Return standardized success response
        return $this->successResponse([
            'user' => $authData['user'],
            'token' => $authData['token']
        ], 'Logged in successfully.');
    }
}
