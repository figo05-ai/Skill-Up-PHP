<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user');

        return [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'nullable|email|max:255|unique:users,email,' . $userId,
            'phone' => 'nullable|string|max:255',
            'password' => 'nullable|string|min:6',
            'role' => ['nullable', Rule::in(['admin', 'staff', 'system_user'])],
            'job_title' => 'nullable|string|max:255',
            'nationality' => 'nullable|string|max:255',
            'attendance_percentage' => 'nullable|numeric',
            'joining_date' => 'nullable|date',
            'status' => ['nullable', Rule::in(['active', 'remote', 'inactive'])],
            'personal_email' => 'nullable|email|max:255',
            'department' => 'nullable|string|max:255',
            'client_id' => 'nullable|exists:clients,id',
            'identity_number' => 'nullable|string|max:255',
            'holidays' => 'nullable|integer',
            'monthly_work_hours' => 'nullable|numeric',
            'allow_login' => 'nullable|boolean',
        ];
    }
}
