<?php

namespace App\Http\Controllers\Api\Attendance;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\Attendance\StoreAttendanceRequest;
use App\Http\Requests\Attendance\UpdateAttendanceRequest;
use App\Http\Responses\ApiResponse;
use App\Interfaces\Attendance\AttendanceServiceInterface;
use App\Http\Resources\AttendanceResource;

class AttendanceController extends Controller
{
    use ApiResponse;

    protected AttendanceServiceInterface $attendanceService;

    public function __construct(AttendanceServiceInterface $attendanceService)
    {
        $this->attendanceService = $attendanceService;
    }

    public function index()
    {
        $attendances = $this->attendanceService->getAllAttendances();
        return $this->successResponse(AttendanceResource::collection($attendances)->response()->getData(true), 'Attendances retrieved successfully.');
    }

    public function show($id)
    {
        $attendance = $this->attendanceService->getAttendanceById($id);
        
        if (!$attendance) {
            return $this->errorResponse('Attendance not found.', 404);
        }

        return $this->successResponse(new AttendanceResource($attendance), 'Attendance retrieved successfully.');
    }

    public function store(StoreAttendanceRequest $request)
    {
        $attendance = $this->attendanceService->createAttendance($request->validated());
        return $this->successResponse(new AttendanceResource($attendance), 'Attendance created successfully.', 201);
    }

    public function update(UpdateAttendanceRequest $request, $id)
    {
        $attendance = $this->attendanceService->updateAttendance($id, $request->validated());

        if (!$attendance) {
            return $this->errorResponse('Attendance not found.', 404);
        }

        return $this->successResponse(new AttendanceResource($attendance), 'Attendance updated successfully.');
    }

    public function destroy($id)
    {
        $deleted = $this->attendanceService->deleteAttendance($id);

        if (!$deleted) {
            return $this->errorResponse('Attendance not found.', 404);
        }

        return $this->successResponse(null, 'Attendance deleted successfully.');
    }

    public function seed(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'user_id' => 'required|exists:users,id',
        ]);

        $startDate = \Carbon\Carbon::parse($request->start_date);
        $endDate = \Carbon\Carbon::parse($request->end_date);
        $userId = $request->user_id;

        $current = $startDate->copy();
        $seededCount = 0;

        while ($current->lte($endDate)) {
            // Skip Friday and Saturday
            if (!$current->isFriday() && !$current->isSaturday()) {
                // Check if attendance already exists
                $exists = \App\Models\Attendance::where('user_id', $userId)
                    ->where('date', $current->format('Y-m-d'))
                    ->exists();

                if (!$exists) {
                    // Random check in between 09:00 and 09:59
                    $checkInHour = 9;
                    $checkInMinute = rand(0, 59);
                    $checkIn = $current->copy()->setTime($checkInHour, $checkInMinute, 0);

                    // Random check out between 16:00 and 16:59
                    $checkOutHour = 16;
                    $checkOutMinute = rand(0, 59);
                    $checkOut = $current->copy()->setTime($checkOutHour, $checkOutMinute, 0);

                    // Work hours diff
                    $workHours = $checkIn->diffInMinutes($checkOut) / 60;

                    \App\Models\Attendance::create([
                        'user_id' => $userId,
                        'date' => $current->format('Y-m-d'),
                        'check_in' => $checkIn->format('Y-m-d H:i:s'),
                        'check_out' => $checkOut->format('Y-m-d H:i:s'),
                        'work_hours' => round($workHours, 2),
                    ]);
                    $seededCount++;
                }
            }
            $current->addDay();
        }

        return $this->successResponse(['seeded' => $seededCount], "Seeded $seededCount records successfully.");
    }

    public function deleteRange(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'user_id' => 'required|exists:users,id',
        ]);

        $deleted = \App\Models\Attendance::where('user_id', $request->user_id)
            ->whereBetween('date', [$request->start_date, $request->end_date])
            ->delete();

        return $this->successResponse(['deleted' => $deleted], "Deleted $deleted records successfully.");
    }
}
