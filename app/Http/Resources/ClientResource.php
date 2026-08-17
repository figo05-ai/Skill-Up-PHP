<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            '_id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'address' => $this->address,
            'personalId' => $this->personal_id,
            'commercialRecord' => $this->commercial_record,
            'laborOfficeNumber' => $this->labor_office_number,
            'createdAt' => $this->created_at?->format('Y-m-d\TH:i:s.u\Z'),
            'updatedAt' => $this->updated_at?->format('Y-m-d\TH:i:s.u\Z'),
        ];
    }
}
