<?php

namespace App\Http\Controllers\Api\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Responses\ApiResponse;
use App\Interfaces\User\UserServiceInterface;
use App\Http\Resources\UserResource;

class UserController extends Controller
{
    use ApiResponse;

    protected UserServiceInterface $userService;

    public function __construct(UserServiceInterface $userService)
    {
        $this->userService = $userService;
    }

    public function index(\Illuminate\Http\Request $request)
    {
        $type = $request->query('type');
        $users = $this->userService->getAllUsers($type);
        return $this->successResponse(UserResource::collection($users)->response()->getData(true), 'Users retrieved successfully.');
    }

    public function show($id)
    {
        $user = $this->userService->getUserById($id);
        
        if (!$user) {
            return $this->errorResponse('User not found.', 404);
        }

        return $this->successResponse(new UserResource($user), 'User retrieved successfully.');
    }

    public function store(StoreUserRequest $request)
    {
        $validated = $request->validated();
        if (empty($validated['email'])) {
            $validated['email'] = 'emp_' . uniqid() . '@example.com';
        }
        if (empty($validated['role'])) {
            $validated['role'] = 'staff';
        }
        $stringFields = ['phone', 'job_title', 'nationality', 'personal_email', 'department'];
        foreach ($stringFields as $field) {
            if (!isset($validated[$field]) || $validated[$field] === null) {
                $validated[$field] = '';
            }
        }
        $user = $this->userService->createUser($validated);
        return $this->successResponse(new UserResource($user), 'User created successfully.', 201);
    }

    public function bulk(\Illuminate\Http\Request $request)
    {
        $employees = $request->input('employees', []);
        $successCount = 0;
        $errors = [];
        $stringFields = ['phone', 'job_title', 'nationality', 'personal_email', 'department'];

        foreach ($employees as $index => $empData) {
            try {
                // set role to staff by default (valid enum values: admin, staff, system_user)
                $empData['role'] = 'staff';
                // dummy email if not provided since it might be required by DB schema for users table
                if (empty($empData['email'])) {
                    $empData['email'] = 'emp_' . uniqid() . '@example.com';
                }
                foreach ($stringFields as $field) {
                    if (!isset($empData[$field]) || $empData[$field] === null) {
                        $empData[$field] = '';
                    }
                }
                $this->userService->createUser($empData);
                $successCount++;
            } catch (\Exception $e) {
                $name = $empData['name'] ?? 'Unknown';
                $errors[] = "Error adding $name: " . $e->getMessage();
            }
        }

        return response()->json([
            'status' => 'Success',
            'successCount' => $successCount,
            'errors' => $errors
        ]);
    }

    public function update(UpdateUserRequest $request, $id)
    {
        $validated = $request->validated();
        $stringFields = ['phone', 'job_title', 'nationality', 'personal_email', 'department'];
        foreach ($stringFields as $field) {
            if (array_key_exists($field, $validated) && $validated[$field] === null) {
                $validated[$field] = '';
            }
        }
        $user = $this->userService->updateUser($id, $validated);

        if (!$user) {
            return $this->errorResponse('User not found.', 404);
        }

        return $this->successResponse(new UserResource($user), 'User updated successfully.');
    }

    public function destroy($id)
    {
        $deleted = $this->userService->deleteUser($id);

        if (!$deleted) {
            return $this->errorResponse('User not found.', 404);
        }

        return $this->successResponse(null, 'User deleted successfully.');
    }
}
