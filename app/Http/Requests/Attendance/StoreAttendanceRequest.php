<?php

namespace App\Http\Requests\Attendance;

use Illuminate\Foundation\Http\FormRequest;

class StoreAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => 'required|exists:users,id',
            'check_in' => 'required|date',
            'check_out' => 'nullable|date|after_or_equal:check_in',
            'date' => 'required|date',
            'work_hours' => 'nullable|numeric|min:0',
        ];
    }
}
