<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            '_id' => $this->id, // Frontend sometimes falls back to _id
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->role,
            'jobTitle' => $this->job_title,
            'nationality' => $this->nationality,
            'attendancePercentage' => $this->attendance_percentage,
            'joiningDate' => $this->joining_date,
            'status' => $this->status,
            'personalEmail' => $this->personal_email,
            'department' => $this->department,
            'identityNumber' => $this->identity_number,
            'holidays' => $this->holidays,
            'monthlyWorkHours' => $this->monthly_work_hours,
            'allowLogin' => (bool) $this->allow_login,
            // the frontend expects client to be the client ID if it's not populated, 
            // but we can just provide the client object if it's loaded, otherwise fallback to id.
            'client' => $this->whenLoaded('client', function () {
                return new ClientResource($this->client);
            }, $this->client_id),
            'createdAt' => $this->created_at?->format('Y-m-d\TH:i:s.u\Z'),
            'updatedAt' => $this->updated_at?->format('Y-m-d\TH:i:s.u\Z'),
        ];
    }
}
