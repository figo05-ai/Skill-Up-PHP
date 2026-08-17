<?php

namespace App\Http\Controllers\Api\Report;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Task;
use App\Models\Attendance;
use App\Models\Client;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    public function downloadReport(Request $request)
    {
        $clientId = $request->clientId ?? $request->client_id;
        $year = $request->year ?? date('Y');
        $month = str_pad($request->month ?? date('m'), 2, '0', STR_PAD_LEFT);
        $type = $request->reportType ?? $request->type ?? 'attendance';

        $client = Client::find($clientId);
        $clientName = $client ? $client->name : 'الكل';

        $startDate = "$year-$month-01";
        $endDate = date('Y-m-t', strtotime($startDate));

        $data = [
            'clientName' => $clientName,
            'year' => $year,
            'month' => $month,
        ];

        $users = User::where('client_id', $clientId)->get();
        $userIds = $users->pluck('id');

        if ($type === 'attendance' || $type === 'detailed_attendance') {
            $attendances = Attendance::whereIn('user_id', $userIds)
                ->whereBetween('date', [$startDate, $endDate])
                ->get();
            $data['users'] = $users;
            $data['attendances'] = $attendances->groupBy('user_id');
            $view = 'reports.attendance';
        } elseif ($type === 'tasks') {
            $tasks = Task::whereIn('assigned_to', $userIds)
                ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->with(['assignee', 'creator'])
                ->get();
            $data['tasks'] = $tasks;
            $view = 'reports.tasks';
        } elseif ($type === 'performance') {
            $data['users'] = $users;
            $view = 'reports.performance';
        } else {
            return response()->json(['message' => 'Invalid report type'], 400);
        }

        $pdf = Pdf::loadView($view, $data);
        return $pdf->download("report_{$type}_{$month}_{$year}.pdf");
    }

    public function getAllData(Request $request)
    {
        $clientIdField = $request->has('client_id') ? 'client_id' : 'clientId';

        $request->validate([
            $clientIdField => 'required|exists:clients,id',
            'year' => 'required|integer',
            'month' => 'required|integer|min:1|max:12',
        ]);

        $clientId = $request->$clientIdField;
        $year = $request->year;
        $month = str_pad($request->month, 2, '0', STR_PAD_LEFT);

        $client = Client::findOrFail($clientId);
        $employees = User::where('client_id', $clientId)->get();

        $startDate = "$year-$month-01";
        $endDate = date('Y-m-t', strtotime($startDate));
        $userIds = $employees->pluck('id');

        $tasks = Task::whereIn('assigned_to', $userIds)
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->with(['assignee', 'creator'])
            ->get();

        $attendances = Attendance::whereIn('user_id', $userIds)
            ->whereBetween('date', [$startDate, $endDate])
            ->get();

        return response()->json([
            'client' => new \App\Http\Resources\ClientResource($client),
            'employees' => \App\Http\Resources\UserResource::collection($employees),
            'allTasks' => \App\Http\Resources\TaskResource::collection($tasks),
            'allAttendance' => \App\Http\Resources\AttendanceResource::collection($attendances),
        ]);
    }
}
