<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceResource extends JsonResource
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
            'date' => $this->date,
            'checkIn' => $this->check_in,
            'checkOut' => $this->check_out,
            'workHours' => $this->work_hours,
            'work_hours' => $this->work_hours,
            'status' => $this->status,
            'userRef' => $this->user_id,
            'employeeId' => $this->whenLoaded('user', function () {
                return new UserResource($this->user);
            }, $this->user_id),
            'createdAt' => $this->created_at?->format('Y-m-d\TH:i:s.u\Z'),
            'updatedAt' => $this->updated_at?->format('Y-m-d\TH:i:s.u\Z'),
        ];
    }
}
