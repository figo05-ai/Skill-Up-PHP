<?php

namespace App\Interfaces\Attendance;

interface AttendanceServiceInterface
{
    public function getAllAttendances();
    public function getAttendanceById(int $id);
    public function createAttendance(array $data);
    public function updateAttendance(int $id, array $data);
    public function deleteAttendance(int $id);
}
