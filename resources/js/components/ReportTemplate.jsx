import React from 'react';
import { differenceInMonths } from 'date-fns';

const formatHours = (decimalHours) => {
  const hrs = Math.floor(decimalHours);
  const mins = Math.round((decimalHours - hrs) * 60);
  return `${hrs}:${mins < 10 ? '0' : ''}${mins}`;
};

const ReportTemplate = ({ reportType, client, employees, allTasks, allAttendance, month, year }) => {
  let reportTitle = 'تقرير';
  if (reportType === 'tasks') reportTitle = 'تقرير مهام العاملين';
  else if (reportType === 'performance') reportTitle = 'تقرير أداء الموظف';
  else if (reportType === 'detailed_attendance') reportTitle = 'تقرير الحضور التفصيلي';
  else if (reportType === 'attendance') reportTitle = 'تقرير حضور الموظفين';

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  // حسابات الإحصائيات المشتركة
  const getEmpStats = (emp) => {
    const attendanceData = allAttendance.filter(a => String(a.userRef) === String(emp.id || emp._id));
    const totalWorkDays = attendanceData.length;
    const totalWorkHours = attendanceData.reduce((acc, curr) => acc + (Number(curr.workHours) || 0), 0);
    const monthsDiff = Math.max(differenceInMonths(endDate, startDate) + 1, 1);
    const plannedHours = (Number(emp.monthlyWorkHours) || 176) * monthsDiff;
    const deduction = (Number(emp.absentDays) || 0) * 8;
    const effectiveHours = Math.max(0, totalWorkHours - deduction);
    const remainingHours = plannedHours - effectiveHours;
    const activePercentage = plannedHours > 0 ? (effectiveHours * 100) / plannedHours : 0;
    
    return { attendanceData, totalWorkDays, totalWorkHours, plannedHours, effectiveHours, remainingHours, activePercentage };
  };

  return (
    <div className="bg-white p-8 w-full max-w-[794px] mx-auto text-black font-sans" dir="rtl">
      
      {/* الغلاف */}
      {reportType === 'performance' && (
        <div className="text-center mb-8 border-b-2 border-green-600 pb-8">
          <img src="/logo.jpeg" alt="Logo" className="h-24 mx-auto mb-4" onError={(e) => { e.target.style.display = 'none'; }} />
          <h1 className="text-3xl font-bold text-green-700 mb-2">شركة سكل أب</h1>
          <p className="text-gray-500 font-bold tracking-widest text-sm mb-6">SKILLUP</p>
          <h2 className="text-2xl font-bold mb-2">{reportTitle}</h2>
          <h3 className="text-xl mb-2">{client?.name || 'تقرير عام'}</h3>
          <p className="text-gray-600">الفترة: {startDate.toLocaleDateString('en-GB')} - {endDate.toLocaleDateString('en-GB')}</p>
        </div>
      )}

      {/* تقرير الأداء: جدول واحد لكل الموظفين */}
      {reportType === 'performance' && (
        <table className="w-full border-collapse border border-black text-xs text-center">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black p-2">م</th>
              <th className="border border-black p-2">الموظف</th>
              <th className="border border-black p-2">الهوية</th>
              <th className="border border-black p-2">المسمى</th>
              <th className="border border-black p-2">إجمالي الساعات</th>
              <th className="border border-black p-2">إجمالي الأيام</th>
              <th className="border border-black p-2">الساعات المخططة</th>
              <th className="border border-black p-2">الساعات المنجزة</th>
              <th className="border border-black p-2">الساعات المتبقية</th>
              <th className="border border-black p-2">نسبة التفاعل</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr><td colSpan="10" className="p-4">لا توجد بيانات</td></tr>
            ) : (
              employees.map((emp, idx) => {
                const stats = getEmpStats(emp);
                return (
                  <tr key={emp.id || idx}>
                    <td className="border border-black p-2">{idx + 1}</td>
                    <td className="border border-black p-2">{emp.name}</td>
                    <td className="border border-black p-2">{emp.identityNumber || '-'}</td>
                    <td className="border border-black p-2">{emp.jobTitle || '-'}</td>
                    <td className="border border-black p-2">{formatHours(stats.totalWorkHours)}</td>
                    <td className="border border-black p-2">{stats.totalWorkDays}</td>
                    <td className="border border-black p-2">{formatHours(stats.plannedHours)}</td>
                    <td className="border border-black p-2">{formatHours(stats.effectiveHours)}</td>
                    <td className="border border-black p-2">{formatHours(stats.remainingHours)}</td>
                    <td className="border border-black p-2">{stats.activePercentage.toFixed(2)}%</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}

      {/* تقارير أخرى: صفحة لكل موظف */}
      {reportType !== 'performance' && employees.map((emp, idx) => {
        const stats = getEmpStats(emp);
        const empTasks = allTasks.filter(t => String(t.assignedTo) === String(emp.id || emp._id));

        return (
          <div key={emp.id || idx} className="mb-16" style={{ pageBreakInside: 'avoid' }}>
            <div className="text-center mb-6 border-b-2 border-green-600 pb-4">
              <img src="/logo.jpeg" alt="Logo" className="h-16 mx-auto mb-2" onError={(e) => { e.target.style.display = 'none'; }} />
              <h1 className="text-xl font-bold text-green-700 mb-1">شركة سكل أب</h1>
              <p className="text-gray-500 font-bold tracking-widest text-[10px] mb-3">SKILLUP</p>
              <h2 className="text-lg font-bold mb-1">{reportTitle}</h2>
              <h3 className="text-md mb-1">{client?.name || 'تقرير عام'}</h3>
              <p className="text-gray-600 text-xs">الفترة: {startDate.toLocaleDateString('en-GB')} - {endDate.toLocaleDateString('en-GB')}</p>
            </div>

            <div className="border border-black p-3 rounded bg-gray-50 mb-4 text-sm font-bold flex justify-between">
              <div>الموظف: <span className="font-normal">{emp.name}</span></div>
              <div>المسمى الوظيفي: <span className="font-normal">{emp.jobTitle || '-'}</span></div>
              <div>الهوية: <span className="font-normal">{emp.identityNumber || '-'}</span></div>
            </div>

            {reportType === 'tasks' && (
              <>
                <table className="w-full border-collapse border border-black text-center text-sm mb-4 font-bold bg-gray-100">
                  <tbody>
                    <tr>
                      <td className="border border-black p-2">الساعات المخططة: {formatHours(stats.plannedHours)}</td>
                      <td className="border border-black p-2">الساعات المنجزة: {formatHours(stats.effectiveHours)}</td>
                      <td className="border border-black p-2">نسبة التفاعل: {stats.activePercentage.toFixed(2)}%</td>
                    </tr>
                  </tbody>
                </table>
                <table className="w-full border-collapse border border-black text-xs text-center">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-black p-2">م</th>
                      <th className="border border-black p-2">اسم المهمة</th>
                      <th className="border border-black p-2">تاريخ البداية</th>
                      <th className="border border-black p-2">تاريخ النهاية</th>
                      <th className="border border-black p-2">الساعات المخططة</th>
                      <th className="border border-black p-2">الساعات المنجزة</th>
                      <th className="border border-black p-2">نسبة التفاعل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empTasks.length === 0 ? (
                      <tr><td colSpan="7" className="p-4">لا توجد مهام</td></tr>
                    ) : (
                      empTasks.map((t, i) => (
                        <tr key={i}>
                          <td className="border border-black p-2">{i + 1}</td>
                          <td className="border border-black p-2">{t.title}</td>
                          <td className="border border-black p-2">{t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB') : '-'}</td>
                          <td className="border border-black p-2">{endDate.toLocaleDateString('en-GB')}</td>
                          <td className="border border-black p-2">{formatHours(stats.plannedHours)}</td>
                          <td className="border border-black p-2">{formatHours(stats.effectiveHours)}</td>
                          <td className="border border-black p-2">{stats.activePercentage.toFixed(2)}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </>
            )}

            {(reportType === 'attendance' || reportType === 'detailed_attendance') && (
              <>
                <table className="w-full border-collapse border border-black text-xs text-center">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-black p-2">م</th>
                      <th className="border border-black p-2">التاريخ</th>
                      <th className="border border-black p-2">دخول</th>
                      <th className="border border-black p-2">خروج</th>
                      <th className="border border-black p-2">ساعات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.attendanceData.length === 0 ? (
                      <tr><td colSpan="5" className="p-4">لا يوجد سجل حضور</td></tr>
                    ) : (
                      stats.attendanceData.map((a, i) => (
                        <tr key={i}>
                          <td className="border border-black p-2">{i + 1}</td>
                          <td className="border border-black p-2">{new Date(a.date).toLocaleDateString('en-GB')}</td>
                          <td className="border border-black p-2">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                          <td className="border border-black p-2">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
                          <td className="border border-black p-2">{a.workHours ? formatHours(a.workHours) : '0:00'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </>
            )}
          </div>
        );
      })}

    </div>
  );
};

export default ReportTemplate;
