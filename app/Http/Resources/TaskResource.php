<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
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
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'progressPercentage' => (float) $this->progress_percentage,
            'deadline' => $this->deadline,
            // Provide assignedTo either as loaded relation or as ID fallback for frontend
            'assignedTo' => $this->whenLoaded('assignee', function () {
                return new UserResource($this->assignee);
            }, $this->assigned_to),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'createdAt' => $this->created_at?->format('Y-m-d\TH:i:s.u\Z'),
            'updatedAt' => $this->updated_at?->format('Y-m-d\TH:i:s.u\Z'),
        ];
    }
}
