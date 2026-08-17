<?php

namespace App\Http\Requests\Attendance;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => 'sometimes|required|exists:users,id',
            'check_in' => 'sometimes|required|date',
            'check_out' => 'nullable|date|after_or_equal:check_in',
            'date' => 'sometimes|required|date',
            'work_hours' => 'nullable|numeric|min:0',
        ];
    }
}
