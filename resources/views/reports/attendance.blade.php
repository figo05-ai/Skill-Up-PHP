<!DOCTYPE html>
<html dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>تقرير الحضور</title>
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
    <h2>تقرير الحضور والانصراف</h2>
    <h3>الشركة: {{ $clientName }} | شهر: {{ $month }}/{{ $year }}</h3>

    <table>
        <thead>
            <tr>
                <th>الموظف</th>
                <th>أيام الحضور</th>
            </tr>
        </thead>
        <tbody>
            @foreach($users as $user)
            <tr>
                <td>{{ $user->name }}</td>
                <td>{{ isset($attendances[$user->id]) ? $attendances[$user->id]->count() : 0 }} يوم</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
