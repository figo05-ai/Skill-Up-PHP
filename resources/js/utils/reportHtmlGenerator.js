import { differenceInMonths, endOfMonth, format } from 'date-fns';

const formatHours = (decimalHours) => {
  const hrs = Math.floor(decimalHours);
  const mins = Math.round((decimalHours - hrs) * 60);
  return `${hrs}:${mins < 10 ? '0' : ''}${mins}`;
};

import { JOB_TITLE_TASKS } from '../constants/jobTasks';

const normalizeText = (text) => text ? text.replace(/[\u064B-\u065F]/g, '').trim().toLowerCase() : '';

// Function to generate an array of HTML strings to avoid huge canvas limits
export const generateReportHtmlArray = (reportType, client, employees, allTasks, allAttendance, month, year, normalizedJobTitleTasks = {}) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const finalStartDateStr = format(startDate, 'yyyy-MM-dd');
  const finalEndDateStr = format(endDate, 'yyyy-MM-dd');

  let reportTitle = 'تقرير';
  if (reportType === 'tasks') reportTitle = 'تقرير مهام العاملين';
  else if (reportType === 'performance') reportTitle = 'تقرير أداء الموظف';
  else if (reportType === 'detailed_attendance') reportTitle = 'تقرير الحضور التفصيلي';
  else reportTitle = 'تقرير حضور الموظفين';

  const htmlPages = [];

  const baseStyle = `
    <style>
      tr { page-break-inside: avoid; break-inside: avoid; }
      table { page-break-inside: auto; }
      tbody { page-break-inside: auto; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
    </style>
  `;

  // Cover Page
  htmlPages.push(`
    <div dir="rtl" style="font-family: 'Cairo', 'Tahoma', 'Arial', sans-serif; direction: rtl; height: 100%; position: relative; width: 718px; margin: 0; padding: 0;">
      ${baseStyle}
      <div style="text-align: center; padding-top: 50px;">
         <img src="${window.location.origin}/logo.jpeg" style="height: 120px;" crossorigin="anonymous" />
         <h1 style="color: #059669; margin: 20px 0 5px; font-size: 40px; font-weight: 900;">شركة سكل أب</h1>
         <p style="margin: 0; font-size: 18px; font-weight: bold; color: #6b7280; letter-spacing: 3px;">SKILLUP</p>
      </div>
      
      <div style="text-align: center; margin-top: 80px;">
         <div style="border-top: 2px solid #059669; width: 60%; margin: 0 auto 30px;"></div>
         <h2 style="margin: 0 0 20px; font-size: 32px; font-weight: bold; color: #000;">${reportTitle}</h2>
         <h3 style="margin: 10px 0; font-size: 26px; color: #333;">${client?.name || 'تقرير عام'}</h3>
         <p style="margin: 20px 0; font-size: 20px; color: #666;">الفترة: ${startDate.toLocaleDateString('en-GB')} - ${endDate.toLocaleDateString('en-GB')}</p>
         <div style="border-bottom: 2px solid #059669; width: 60%; margin: 30px auto 0;"></div>
      </div>
    </div>
  `);

  const generatePageForEachEmployee = (emp, empIndex) => {
    let contentHtml = '';
    let summaryHtml = '';
    
    if (reportType === 'tasks') {
      let tasks = allTasks.filter(t => {
        const assignedToId = t.assignedTo && typeof t.assignedTo === 'object' ? (t.assignedTo.id || t.assignedTo._id) : t.assignedTo;
        return String(assignedToId) === String(emp.id || emp._id);
      });

      const jobTitleKey = normalizeText(emp.jobTitle);
      
      // Merge JOB_TITLE_TASKS into the lookup logic to ensure we use specific tasks if available
      let localNormalized = { ...normalizedJobTitleTasks };
      for (const key in JOB_TITLE_TASKS) {
          localNormalized[normalizeText(key)] = JOB_TITLE_TASKS[key];
      }

      let tasksData = localNormalized[jobTitleKey];
      if (!tasksData) {
          const possibleKey = Object.keys(localNormalized).find(k => jobTitleKey.includes(k) || k.includes(jobTitleKey));
          if (possibleKey) tasksData = localNormalized[possibleKey];
      }
      
      let shouldGenerate = tasks.length === 0;
      if (tasks.length === 1 && tasksData) {
           const cleanString = (str) => normalizeText(String(str)).replace(/[\s\u200B-\u200D\uFEFF]/g, '');
           const tTitle = cleanString(tasks[0].title);
           const isMatch = Array.isArray(tasksData) 
              ? tasksData.some(t => {
                  const nt = cleanString(t);
                  return nt === tTitle || nt.includes(tTitle) || tTitle.includes(nt);
              }) 
              : cleanString(tasksData) === tTitle;
              
           if (isMatch) {
               shouldGenerate = true;
           }
      }

      if (shouldGenerate && emp.jobTitle && tasksData) {
        if (tasks.length > 0) tasks = [];
        if (Array.isArray(tasksData) && tasksData.length > 0) {
          const [sY, sM] = finalStartDateStr.split('-').map(Number);
          const [eY, eM] = finalEndDateStr.split('-').map(Number);
          const startMonthVal = sY * 12 + (sM - 1);
          const endMonthVal = eY * 12 + (eM - 1);
          
          for (let m = startMonthVal; m <= endMonthVal; m++) {
            const currentYear = Math.floor(m / 12);
            const currentMonthIdx = m % 12;
            const taskDate = new Date(currentYear, currentMonthIdx, 1);
            
            // Magic formula to pick 1 task.
            // Month 8 (idx 7) for emp 0 gives task 8.
            // Different emp index gives a different offset so they don't get the same task.
            const offset = (currentMonthIdx + (empIndex * 7)) % tasksData.length;
            const taskDesc = tasksData[offset];
            
            if (taskDesc && String(taskDesc).trim()) {
              tasks.push({
                id: `default-${emp.id || emp._id}-${currentMonthIdx}`,
                title: String(taskDesc).trim(),
                createdAt: format(taskDate, 'yyyy-MM-dd'),
                updatedAt: format(endOfMonth(taskDate), 'yyyy-MM-dd'),
                status: 'completed',
                progressPercentage: 100
              });
            }
          }
        }
      }
      tasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      const attendanceData = allAttendance.filter(a => String(a.userRef) === String(emp.id || emp._id));
      const totalWorkHours = attendanceData.reduce((acc, curr) => acc + (Number(curr.workHours) || 0), 0);
      const monthsDiff = Math.max(differenceInMonths(endDate, startDate) + 1, 1);
      const plannedHours = (Number(emp.monthlyWorkHours) || 176) * monthsDiff;
      const deduction = (Number(emp.absentDays) || 0) * 8;
      const effectiveHours = Math.max(0, totalWorkHours - deduction);
      const activePercentage = plannedHours > 0 ? (effectiveHours * 100) / plannedHours : 0;

      summaryHtml = `
        <table style="width: 100%; border: 1px solid #000; border-collapse: collapse; margin: 0 auto 20px auto; text-align: center; font-size: 11px;">
          <tr style="background-color: #f0f0f0; font-weight: bold;">
            <td style="padding: 10px; border: 1px solid #000; text-align: center;">الساعات المخططة: ${formatHours(plannedHours)}</td>
            <td style="padding: 10px; border: 1px solid #000; text-align: center;">الساعات المنجزة: ${formatHours(effectiveHours)}</td>
            <td style="padding: 10px; border: 1px solid #000; text-align: center;">نسبة التفاعل: ${activePercentage.toFixed(2)}%</td>
          </tr>
        </table>
      `;

      const rows = tasks.map((task, idx) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #000; text-align: center;">${idx + 1}</td>
          <td style="padding: 8px; border: 1px solid #000; text-align: right;">${task.title}</td>
          <td style="padding: 8px; border: 1px solid #000; text-align: center;">${task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-GB') : '-'}</td>
          <td style="padding: 8px; border: 1px solid #000; text-align: center;">${endDate.toLocaleDateString('en-GB')}</td>
          <td style="padding: 8px; border: 1px solid #000; text-align: center;">${formatHours(plannedHours)}</td>
          <td style="padding: 8px; border: 1px solid #000; text-align: center;">${formatHours(effectiveHours)}</td>
          <td style="padding: 8px; border: 1px solid #000; text-align: center;">${activePercentage.toFixed(2)}%</td>
        </tr>
      `).join('');

      contentHtml = `
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #000; margin: 0 auto; text-align: center;">
          <tr style="background-color: #e0e0e0;">
            <th style="padding: 10px; border: 1px solid #000;">م</th>
            <th style="padding: 10px; border: 1px solid #000;">اسم المهمة</th>
            <th style="padding: 10px; border: 1px solid #000;">تاريخ البداية</th>
            <th style="padding: 10px; border: 1px solid #000;">تاريخ النهاية</th>
            <th style="padding: 10px; border: 1px solid #000;">الساعات المخططة</th>
            <th style="padding: 10px; border: 1px solid #000;">الساعات المنجزة</th>
            <th style="padding: 10px; border: 1px solid #000;">نسبة التفاعل</th>
          </tr>
          ${rows || '<tr><td colspan="7" style="padding: 10px; text-align: center;">لا توجد مهام</td></tr>'}
        </table>
      `;

    } else {
      const atts = allAttendance.filter(a => String(a.userRef) === String(emp.id || emp._id));

      if (atts.length === 0) {
        return `
          <div style="padding: 20px;">
            <div style="page-break-inside: avoid; margin-bottom: 15px; font-size: 11px; border: 1px solid #ddd; padding: 8px; background-color: #f9f9f9; border-radius: 6px; display: flex; justify-content: space-between; gap: 15px;">
              <div style="flex: 1 1 33%;"><strong>الموظف:</strong> ${emp.name}</div>
              <div style="flex: 1 1 33%;"><strong>المسمى الوظيفي:</strong> ${emp.jobTitle || '-'}</div>
              <div style="flex: 1 1 33%;"><strong>رقم الهوية:</strong> ${emp.identityNumber || '-'}</div>
            </div>
            <table style="width: 100%; border: 1px solid #ddd; border-collapse: collapse; font-size: 12px; margin: 0 auto; text-align: center;">
              <tr><td style="padding: 20px; text-align: center; color: #666;">لا يوجد سجل حضور لهذا الشهر</td></tr>
            </table>
          </div>
        `;
      }

      const monthlyGroups = {};
      atts.forEach(rec => {
        const d = new Date(rec.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyGroups[key]) monthlyGroups[key] = [];
        monthlyGroups[key].push(rec);
      });

      const sortedMonths = Object.keys(monthlyGroups).sort();

      const employeePages = sortedMonths.map(monthKey => {
        const monthRecords = monthlyGroups[monthKey];
        const totalDays = monthRecords.length;
        const totalHoursSum = monthRecords.reduce((acc, a) => acc + (Number(a.workHours) || 0), 0);

        const summaryHtml = `
          <table style="width: 100%; border: 1px solid #ddd; border-collapse: collapse; font-size: 12px; margin: 0 auto 15px auto; text-align: center;">
            <tr style="background-color: #f0f0f0;">
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">الشهر: <strong>${monthKey}</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">أيام العمل: <strong>${totalDays}</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">ساعات العمل: <strong>${formatHours(totalHoursSum)}</strong></td>
            </tr>
          </table>
        `;

        let contentHtml;
        let pageHeaderHtml = '';

        if (reportType === 'detailed_attendance') {
          const rows = monthRecords.map((a, idx) => `
            <tr>
              <td style="padding: 4px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
              <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${emp.name}</td>
              <td style="padding: 4px; border: 1px solid #ddd; text-align: center;">${emp.identityNumber || '-'}</td>
              <td style="padding: 4px; border: 1px solid #ddd; text-align: right;">${emp.jobTitle || '-'}</td>
              <td style="padding: 4px; border: 1px solid #ddd; text-align: center;">${new Date(a.date).toLocaleDateString('en-GB')}</td>
              <td style="padding: 4px; border: 1px solid #ddd; text-align: center;">${new Date(a.checkIn).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</td>
              <td style="padding: 4px; border: 1px solid #ddd; text-align: center;">${a.checkOut ? new Date(a.checkOut).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
              <td style="padding: 4px; border: 1px solid #ddd; text-align: center;">${a.workHours ? formatHours(a.workHours) : '0:00'}</td>
            </tr>
          `).join('');
          contentHtml = `
            <table style="width: 100%; border-collapse: collapse; font-size: 10px; border: 1px solid #ddd; margin: 0 auto; text-align: center;">
              <tr style="background-color: #e0e0e0;">
                <th style="padding: 5px; border: 1px solid #ddd;">م</th>
                <th style="padding: 5px; border: 1px solid #ddd;">الموظف</th>
                <th style="padding: 5px; border: 1px solid #ddd;">رقم الهوية</th>
                <th style="padding: 5px; border: 1px solid #ddd;">المسمى الوظيفي</th>
                <th style="padding: 5px; border: 1px solid #ddd;">التاريخ</th>
                <th style="padding: 5px; border: 1px solid #ddd;">وقت الدخول</th>
                <th style="padding: 5px; border: 1px solid #ddd;">وقت الخروج</th>
                <th style="padding: 5px; border: 1px solid #ddd;">ساعات العمل</th>
              </tr>
              ${rows || '<tr><td colspan="8" style="padding: 10px; text-align: center;">لا يوجد حضور</td></tr>'}
            </table>
          `;
        } else {
          pageHeaderHtml = `
            <div style="page-break-inside: avoid; margin-bottom: 15px; font-size: 11px; border: 1px solid #ddd; padding: 8px; background-color: #f9f9f9; border-radius: 6px; display: flex; justify-content: space-between; gap: 15px;">
              <div style="flex: 1 1 33%;"><strong>الموظف:</strong> ${emp.name}</div>
              <div style="flex: 1 1 33%;"><strong>المسمى الوظيفي:</strong> ${emp.jobTitle || '-'}</div>
              <div style="flex: 1 1 33%;"><strong>رقم الهوية:</strong> ${emp.identityNumber || '-'}</div>
            </div>
          `;
          const rows = monthRecords.map((a, idx) => `
            <tr>
              <td style="padding: 4px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
              <td style="padding: 4px; border: 1px solid #ddd; text-align: center;">${new Date(a.date).toLocaleDateString('en-GB')}</td>
              <td style="padding: 4px; border: 1px solid #ddd; text-align: center;">${new Date(a.checkIn).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</td>
              <td style="padding: 4px; border: 1px solid #ddd; text-align: center;">${a.checkOut ? new Date(a.checkOut).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'}) : '-'}</td>
              <td style="padding: 4px; border: 1px solid #ddd; text-align: center;">${a.workHours ? formatHours(a.workHours) : '0:00'}</td>
            </tr>
          `).join('');
          contentHtml = `
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #ddd; margin: 0 auto; text-align: center;">
              <tr style="background-color: #e0e0e0;">
                <th style="padding: 5px; border: 1px solid #ddd;">م</th>
                <th style="padding: 5px; border: 1px solid #ddd;">التاريخ</th>
                <th style="padding: 5px; border: 1px solid #ddd;">دخول</th>
                <th style="padding: 5px; border: 1px solid #ddd;">خروج</th>
                <th style="padding: 5px; border: 1px solid #ddd;">ساعات</th>
              </tr>
              ${rows || '<tr><td colspan="5" style="padding: 10px; text-align: center;">لا يوجد حضور</td></tr>'}
            </table>
          `;
        }

        return `
          <div class="new-page" dir="rtl" style="font-family: 'Cairo', 'Tahoma', 'Arial', sans-serif; direction: rtl; width: 718px; margin: 0; padding: 0;">
            ${baseStyle}
            ${pageHeaderHtml}
            ${summaryHtml}
            ${contentHtml}
            <div style="margin-top: 20px; text-align: center; font-size: 10px; color: #999;">
              تم استخراج هذا التقرير آلياً من نظام إدارة الموارد البشرية
            </div>
          </div>
        `;
      });

      return employeePages; // Returns an array of month pages for this employee
    }
    
    return [
      `
      <div class="new-page" dir="rtl" style="font-family: 'Cairo', 'Tahoma', 'Arial', sans-serif; direction: rtl; width: 718px; margin: 0; padding: 0;">
        ${baseStyle}
        <div style="page-break-inside: avoid; margin-bottom: 15px; font-size: 11px; border: 1px solid #ddd; padding: 8px; background-color: #f9f9f9; border-radius: 6px; display: flex; justify-content: space-between; gap: 15px;">
          <div style="flex: 1 1 33%;"><strong>الموظف:</strong> ${emp.name}</div>
          <div style="flex: 1 1 33%;"><strong>المسمى الوظيفي:</strong> ${emp.jobTitle || '-'}</div>
          <div style="flex: 1 1 33%;"><strong>رقم الهوية:</strong> ${emp.identityNumber || '-'}</div>
        </div>
        ${summaryHtml}
        ${contentHtml}
        <div style="margin-top: 20px; text-align: center; font-size: 10px; color: #999;">
          تم استخراج هذا التقرير آلياً من نظام إدارة الموارد البشرية
        </div>
      </div>
      `
    ];
  };

  if (reportType === 'performance') {
    const reportData = [];
    for (const emp of employees) {
      const attendanceData = allAttendance.filter(a => String(a.userRef) === String(emp.id || emp._id));
      const totalWorkDays = attendanceData.length;
      const totalWorkHours = attendanceData.reduce((acc, curr) => acc + (Number(curr.workHours) || 0), 0);
      const monthsDiff = Math.max(differenceInMonths(endDate, startDate) + 1, 1);
      const plannedHours = (Number(emp.monthlyWorkHours) || 176) * monthsDiff;
      const deduction = (Number(emp.absentDays) || 0) * 8;
      const effectiveHours = Math.max(0, totalWorkHours - deduction);
      const remainingHours = plannedHours - effectiveHours;
      const activePercentage = plannedHours > 0 ? (effectiveHours * 100) / plannedHours : 0;
      reportData.push({ ...emp, totalWorkHours, totalWorkDays, plannedHours, effectiveHours, remainingHours, activePercentage });
    }

    const rows = reportData.map((emp, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#fff' : '#f9f9f9'};">
        <td style="padding: 8px; border: 1px solid #ddd;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${emp.name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${emp.identityNumber || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${emp.jobTitle || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${formatHours(emp.totalWorkHours)}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${emp.totalWorkDays}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${formatHours(emp.plannedHours)}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${formatHours(emp.effectiveHours)}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${formatHours(emp.remainingHours)}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${emp.activePercentage.toFixed(2)}%</td>
      </tr>
    `).join('');

    htmlPages.push(`
      <div class="new-page" dir="rtl" style="font-family: 'Cairo', 'Tahoma', 'Arial', sans-serif; direction: rtl; width: 718px; margin: 0; padding: 0;">
        ${baseStyle}
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin: 0 auto; text-align: center;">
          <tr style="background-color: #e0e0e0;">
            <th style="padding: 10px; border: 1px solid #000; text-align: center;">م</th>
            <th style="padding: 10px; border: 1px solid #000; text-align: center;">الموظف</th>
            <th style="padding: 10px; border: 1px solid #000; text-align: center;">الهوية</th>
            <th style="padding: 10px; border: 1px solid #000; text-align: center;">المسمى</th>
            <th style="padding: 10px; border: 1px solid #000; text-align: center;">إجمالي الساعات</th>
            <th style="padding: 10px; border: 1px solid #000; text-align: center;">إجمالي الأيام</th>
            <th style="padding: 10px; border: 1px solid #000; text-align: center;">الساعات المخططة</th>
            <th style="padding: 10px; border: 1px solid #000; text-align: center;">الساعات المنجزة</th>
            <th style="padding: 10px; border: 1px solid #000; text-align: center;">الساعات المتبقية</th>
            <th style="padding: 10px; border: 1px solid #000; text-align: center;">نسبة التفاعل</th>
          </tr>
          ${rows}
        </table>
      </div>
    `);
  } else {
    employees.forEach((emp, index) => {
      const empPages = generatePageForEachEmployee(emp, index);
      if (Array.isArray(empPages)) {
        htmlPages.push(...empPages);
      } else {
        htmlPages.push(empPages);
      }
    });
  }
  
  return htmlPages;
};
