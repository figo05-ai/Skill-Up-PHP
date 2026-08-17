<!DOCTYPE html>
<html dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>تقرير الأداء</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: right;
        }
        th {
            background-color: #f2f2f2;
        }
        h2, h3 {
            text-align: center;
        }
    </style>
</head>
<body>
    <h2>تقرير أداء الموظفين</h2>
    <h3>الشركة: {{ $clientName }} | شهر: {{ $month }}/{{ $year }}</h3>

    <table>
        <thead>
            <tr>
                <th>الموظف</th>
                <th>نسبة الحضور</th>
                <th>إجمالي المهام المنجزة</th>
            </tr>
        </thead>
        <tbody>
            @foreach($users as $user)
            <tr>
                <td>{{ $user->name }}</td>
                <td>{{ $user->attendance_percentage ?? 100 }}%</td>
                <td>{{ $user->assignedTasks()->where('status', 'مكتملة')->count() }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
