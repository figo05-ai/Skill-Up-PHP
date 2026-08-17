<?php

namespace App\Http\Requests\Task;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
            'deadline' => 'nullable|date',
            'status' => ['sometimes', 'required', Rule::in(['todo', 'in-progress', 'completed'])],
            'progress_percentage' => 'nullable|numeric|min:0|max:100',
        ];
    }
}
