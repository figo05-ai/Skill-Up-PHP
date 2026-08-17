<!DOCTYPE html>
<html dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>تقرير المهام</title>
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
    <h2>تقرير المهام</h2>
    <h3>الشركة: {{ $clientName }} | شهر: {{ $month }}/{{ $year }}</h3>

    <table>
        <thead>
            <tr>
                <th>المهمة</th>
                <th>الموظف المكلف</th>
                <th>الحالة</th>
                <th>نسبة الإنجاز</th>
            </tr>
        </thead>
        <tbody>
            @foreach($tasks as $task)
            <tr>
                <td>{{ $task->title }}</td>
                <td>{{ $task->assignee ? $task->assignee->name : 'غير محدد' }}</td>
                <td>{{ $task->status }}</td>
                <td>{{ $task->progress_percentage }}%</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
