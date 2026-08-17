<?php

namespace App\Http\Controllers\Api\Task;

use App\Http\Controllers\Controller;
use App\Http\Requests\Task\StoreTaskRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use App\Http\Responses\ApiResponse;
use App\Interfaces\Task\TaskServiceInterface;
use App\Http\Resources\TaskResource;
use Illuminate\Support\Facades\Auth;

class TaskController extends Controller
{
    use ApiResponse;

    protected TaskServiceInterface $taskService;

    public function __construct(TaskServiceInterface $taskService)
    {
        $this->taskService = $taskService;
    }

    public function index()
    {
        $tasks = $this->taskService->getAllTasks();
        return $this->successResponse(TaskResource::collection($tasks)->response()->getData(true), 'Tasks retrieved successfully.');
    }

    public function show($id)
    {
        $task = $this->taskService->getTaskById($id);
        
        if (!$task) {
            return $this->errorResponse('Task not found.', 404);
        }

        return $this->successResponse(new TaskResource($task), 'Task retrieved successfully.');
    }

    public function store(StoreTaskRequest $request)
    {
        $task = $this->taskService->createTask($request->validated(), Auth::id());
        return $this->successResponse(new TaskResource($task), 'Task created successfully.', 201);
    }

    public function update(UpdateTaskRequest $request, $id)
    {
        $task = $this->taskService->updateTask($id, $request->validated());

        if (!$task) {
            return $this->errorResponse('Task not found.', 404);
        }

        return $this->successResponse(new TaskResource($task), 'Task updated successfully.');
    }

    public function destroy($id)
    {
        $deleted = $this->taskService->deleteTask($id);

        if (!$deleted) {
            return $this->errorResponse('Task not found.', 404);
        }

        return $this->successResponse(null, 'Task deleted successfully.');
    }
}
