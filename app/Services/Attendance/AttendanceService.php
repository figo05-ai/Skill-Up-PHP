<?php

namespace App\Services\Attendance;

use App\Interfaces\Attendance\AttendanceServiceInterface;
use App\Models\Attendance;

class AttendanceService implements AttendanceServiceInterface
{
    public function getAllAttendances()
    {
        $user = auth()->user();
        $query = Attendance::with('user');

        if ($user && $user->role !== 'admin') {
            $query->where('user_id', $user->id);
        }

        if (request()->has('startDate')) {
            $query->where('date', '>=', request('startDate'));
        }
        if (request()->has('endDate')) {
            $query->where('date', '<=', request('endDate'));
        }

        return $query->get();
    }

    public function getAttendanceById(int $id)
    {
        return Attendance::with('user')->find($id);
    }

    public function createAttendance(array $data)
    {
        return Attendance::create($data);
    }

    public function updateAttendance(int $id, array $data)
    {
        $attendance = Attendance::find($id);
        if ($attendance) {
            $attendance->update($data);
            return $attendance;
        }
        return null;
    }

    public function deleteAttendance(int $id)
    {
        $attendance = Attendance::find($id);
        if ($attendance) {
            $attendance->delete();
            return true;
        }
        return false;
    }
}
