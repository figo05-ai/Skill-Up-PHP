<?php

namespace App\Http\Requests\Client;

use Illuminate\Foundation\Http\FormRequest;

class StoreClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255|unique:clients,email',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'personal_id' => 'nullable|string|max:255',
            'commercial_record' => 'nullable|string|max:255',
            'labor_office_number' => 'nullable|string|max:255',
        ];
    }
}
