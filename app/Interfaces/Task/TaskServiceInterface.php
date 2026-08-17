<?php

namespace App\Interfaces\Task;

interface TaskServiceInterface
{
    public function getAllTasks();
    public function getTaskById(int $id);
    public function createTask(array $data, int $createdBy);
    public function updateTask(int $id, array $data);
    public function deleteTask(int $id);
}
