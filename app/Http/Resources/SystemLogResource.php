<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SystemLogResource extends JsonResource
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
            'action' => $this->action,
            'details' => $this->details,
            'ipAddress' => $this->ip_address,
            'performer' => new UserResource($this->whenLoaded('performer')),
            'targetUser' => new UserResource($this->whenLoaded('targetUser')),
            'createdAt' => $this->created_at?->format('Y-m-d\TH:i:s.u\Z'),
            'updatedAt' => $this->updated_at?->format('Y-m-d\TH:i:s.u\Z'),
        ];
    }
}
