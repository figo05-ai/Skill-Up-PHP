<?php

namespace App\Services\Task;

use App\Interfaces\Task\TaskServiceInterface;
use App\Models\Task;

class TaskService implements TaskServiceInterface
{
    public function getAllTasks()
    {
        $user = auth()->user();
        $query = Task::with(['assignee', 'creator']);

        if ($user && $user->role !== 'admin') {
            $query->where(function($q) use ($user) {
                $q->where('assigned_to', $user->id)
                  ->orWhere('created_by', $user->id);
            });
        }

        if (request()->has('startDate')) {
            $query->whereDate('created_at', '>=', request('startDate'));
        }
        if (request()->has('endDate')) {
            $query->whereDate('created_at', '<=', request('endDate'));
        }

        return $query->get();
    }

    public function getTaskById(int $id)
    {
        return Task::with(['assignee', 'creator'])->find($id);
    }

    public function createTask(array $data, int $createdBy)
    {
        $data['created_by'] = $createdBy;
        return Task::create($data);
    }

    public function updateTask(int $id, array $data)
    {
        $task = Task::find($id);
        if ($task) {
            $task->update($data);
            return $task;
        }
        return null;
    }

    public function deleteTask(int $id)
    {
        $task = Task::find($id);
        if ($task) {
            $task->delete();
            return true;
        }
        return false;
    }
}
