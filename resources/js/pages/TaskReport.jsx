import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { format, endOfMonth, parseISO, endOfDay, isValid, differenceInMonths, isAfter, addDays } from 'date-fns';
import ClientSelect from '../components/ClientSelect';
import { useLanguage } from '../context/LanguageContext';
import { JOB_TITLE_TASKS } from '../constants/jobTasks';
import logo from '../assets/logo.jpeg';

const TaskReport = () => {
  const { t, language } = useLanguage();
  const [clientId, setClientId] = useState(null);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(0);
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);
  
  const [employees, setEmployees] = useState([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState({});
  const [clientName, setClientName] = useState('');
  
  const [printData, setPrintData] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showHeaderFooter, setShowHeaderFooter] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const [jobTitleTasks, setJobTitleTasks] = useState({});
  const [normalizedJobTitleTasks, setNormalizedJobTitleTasks] = useState({});

  const normalizeText = (text) => text ? text.replace(/[ً-ٟ]/g, '').trim().toLowerCase() : '';

  useEffect(() => {
    const fetchJobTitles = async () => {
      try {
        const res = await api.get('/job-titles');
        setJobTitleTasks(res.data);
        const normalized = {};
        for (const key in res.data) {
            normalized[normalizeText(key)] = res.data[key];
        }
        setNormalizedJobTitleTasks(normalized);
      } catch (err) {
        console.error('Failed to fetch job titles:', err);
      }
    };
    fetchJobTitles();
  }, []);

  const handleYearChange = (e) => {
    const y = Number(e.target.value);
    setYear(y);
    updateDates(y, month);
  };

  const handleMonthChange = (e) => {
    const m = Number(e.target.value);
    setMonth(m);
    updateDates(year, m);
  };

  const updateDates = (y, m) => {
    if (m === 0) {
      setStartDate(`${y}-01-01`);
      setEndDate(`${y}-12-31`);
    } else {
      const lastDay = new Date(y, m, 0).getDate();
      const mStr = String(m).padStart(2, '0');
      setStartDate(`${y}-${mStr}-01`);
      setEndDate(`${y}-${mStr}-${lastDay}`);
    }
  };

  // جلب اسم العميل عند الاختيار (لأجل الترويسة في الطباعة)
  useEffect(() => {
    if (!clientId) return;
    const fetchClientName = async () => {
      try {
        const res = await api.get('/clients');
        const client = res.data.find(c => (c.id || c._id) === clientId);
        if (client) setClientName(client.name);
      } catch (err) {
        console.error(err);
      }
    };
    fetchClientName();
  }, [clientId]);

  const handleGetEmployees = async () => {
    if (!clientId) {
      alert(t('selectClientFirst'));
      return;
    }
    try {
      const res = await api.get('/employees');
      const allEmployees = res.data || [];
      const filteredEmployees = allEmployees.filter(e => {
        const eClientId = e.client?.id || e.client?._id || e.client;
        return String(eClientId) === String(clientId) && e.status !== 'inactive';
      });
      setEmployees(filteredEmployees);
      setSelectedEmpIds({}); // تصفية التحديد
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      if (err.message === 'Network Error') {
        alert(t('networkError'));
      } else {
        alert(t('errorFetchingEmployees'));
      }
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedEmpIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const all = {};
      employees.forEach(e => all[e.id || e._id] = true);
      setSelectedEmpIds(all);
    } else {
      setSelectedEmpIds({});
    }
  };

  const handlePrintTasks = async () => {
    const idsToPrint = Object.keys(selectedEmpIds).filter(id => selectedEmpIds[id]);

    if (idsToPrint.length === 0) {
      alert(t('selectOneEmployee'));
      return;
    }

    // Sort the IDs to print based on the original employee list order to ensure a stable `empIndex`
    const stableIdsToPrint = [...employees]
      .map(e => String(e.id || e._id))
      .filter(id => idsToPrint.includes(id));

    try {
      api.post('/auth/log', { action: 'PRINT_REPORT', details: `Task Report - Client: ${clientName}, Date: ${startDate} to ${endDate}` }).catch(() => {});

      // جلب البيانات دفعة واحدة لتسريع الطباعة
      let allTasks = [];
      let allAttendance = [];
      let hasErrors = false;
      const seenTaskIds = new Set();
      const seenAttIds = new Set();

      // تقسيم الفترة إلى أجزاء صغيرة (15 يوم) لتجنب مشاكل الترحيل في السيرفر تماماً
      let currentStart = parseISO(startDate);
      const finalEnd = parseISO(endDate);

      while (!isAfter(currentStart, finalEnd)) {
        let chunkEnd = addDays(currentStart, 45); 
        if (isAfter(chunkEnd, finalEnd)) chunkEnd = finalEnd;

        const chunkStartStr = format(currentStart, 'yyyy-MM-dd');
        const chunkEndStr = format(chunkEnd, 'yyyy-MM-dd');

        // جلب المهام
        try {
          let tasksRes;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              tasksRes = await api.get('/tasks', { 
                params: { 
                  startDate: chunkStartStr, endDate: chunkEndStr,
                  limit: 5000, all: true
                } 
              });
              break;
            } catch (err) {
              if (attempt === 2) throw err;
              const delay = err.response?.status === 429 ? 2000 : 500;
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
          const data = tasksRes?.data || [];
          data.forEach(item => {
            const itemId = item.id || item._id;
            if (!seenTaskIds.has(itemId)) {
              seenTaskIds.add(itemId);
              allTasks.push(item);
            }
          });
        } catch (e) {
          console.error(`Error fetching chunk ${chunkStartStr}`, e);
          hasErrors = true;
        }
        
        // جلب الحضور
        try {
          let attRes;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              attRes = await api.get('/attendance/history', {
                params: { 
                  startDate: chunkStartStr, endDate: chunkEndStr, 
                  limit: 5000, all: true
                }
              });
              break;
            } catch (err) {
              if (attempt === 2) throw err;
              const delay = err.response?.status === 429 ? 2000 : 500;
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
          const data = attRes?.data ? (Array.isArray(attRes.data) ? attRes.data : (attRes.data.data || [])) : [];
          data.forEach(item => {
            const itemId = item.id || item._id;
            if (!seenAttIds.has(itemId)) {
              seenAttIds.add(itemId);
              allAttendance.push(item);
            }
          });
        } catch (e) {
          console.error(`Error fetching attendance chunk ${chunkStartStr}`, e);
          hasErrors = true;
        }

        currentStart = addDays(chunkEnd, 1);
      }


      const employeesData = [];
      
      // Calculate a stable rank for each employee within their job title for the entire company
      const allCompanyEmployees = [...employees].sort((a, b) => String(a.id || a._id).localeCompare(String(b.id || b._id)));
      const jobTitleRanks = {};
      allCompanyEmployees.forEach(e => {
        const titleKey = normalizeText(e.jobTitle);
        if (!jobTitleRanks[titleKey]) jobTitleRanks[titleKey] = [];
        jobTitleRanks[titleKey].push(String(e.id || e._id));
      });

      for (const [empIndex, id] of stableIdsToPrint.entries()) {
        const emp = employees.find(e => String(e.id || e._id) === String(id));
        
        // 1. فلترة الحضور الخاص بهذا الموظف
        const attendanceData = allAttendance.filter(a => String(a.userRef || a.user?.id || a.user?._id) === String(id));

        const totalMinutes = attendanceData.reduce((acc, curr) => {
            const val = Number(curr.workHours || curr.work_hours) || 0;
            const h = Math.floor(val);
            const m = Math.round((val - h) * 60);
            return acc + h * 60 + m;
        }, 0);
        const totalWorkHours = totalMinutes / 60;

        let idMatchCount = 0;

        // فلترة المهام الخاصة بالموظف وضمن التاريخ المحدد
        let empTasks = allTasks.filter(t => {
          // التحقق من تعيين المهمة
          const assignee = t.assignedTo || t.assigned_to || t.employeeId || t.employee_id;
          // استخدام منطق مرن للمطابقة يغطي جميع الحالات (كائن أو نص) كما في صفحة الملف الشخصي
          const isAssigned = (assignee?.id == id) || (assignee?._id == id) || (String(assignee) === String(id));

          if (!isAssigned) return false;
          
          idMatchCount++;

          // التحقق من التاريخ
          const createdDate = (t.createdAt || t.created_at) ? new Date(t.createdAt || t.created_at) : null;
          if (!createdDate || !isValid(createdDate)) return false;

          // FIX: Use local timezone for date range to avoid off-by-one-day errors.
          const [startY, startM, startD] = startDate.split('-').map(Number);
          const [endY, endM, endD] = endDate.split('-').map(Number);
          const rangeStart = new Date(startY, startM - 1, startD);
          const rangeEnd = endOfDay(new Date(endY, endM - 1, endD));

          // تعديل الفلتر: جلب المهام التي تم إنشاؤها داخل الشهر المحدد فقط (لحل مشكلة ظهور مهام الشهور السابقة)
          return createdDate >= rangeStart && createdDate <= rangeEnd;
        });

        // إزالة التكرار: الاحتفاظ بمهمة واحدة فقط لكل عنوان (لحل مشكلة ظهور مهام مكررة في بعض الشهور)
        empTasks = empTasks.filter((task, index, self) =>
          index === self.findIndex((t) => t.title === task.title)
        );

        // التحقق مما إذا كانت المهمة الموجودة هي مهمة افتراضية (مكررة) لاستبدالها
        const jobTitleKey = normalizeText(emp.jobTitle);
        
        // الأولوية للمهام المخصصة من الملف المحلي، ثم قاعدة البيانات
        let tasksData = null;
        const localKey = Object.keys(JOB_TITLE_TASKS).find(k => normalizeText(k) === jobTitleKey || normalizeText(k).includes(jobTitleKey) || jobTitleKey.includes(normalizeText(k)));
        
        if (localKey) {
            tasksData = JOB_TITLE_TASKS[localKey];
        } else {
            tasksData = normalizedJobTitleTasks[jobTitleKey];
            if (!tasksData) {
                const possibleKey = Object.keys(normalizedJobTitleTasks).find(k => 
                    jobTitleKey.includes(k) || k.includes(jobTitleKey)
                );
                if (possibleKey) {
                    tasksData = normalizedJobTitleTasks[possibleKey];
                }
            }
        }
        
        let shouldGenerate = empTasks.length === 0;
        // إذا وجدت مهمة واحدة فقط، وتطابق اسمها إحدى المهام الافتراضية، قم بتفعيل التوليد العشوائي للتنوع
        if (empTasks.length === 1 && tasksData) {
             const tTitle = String(empTasks[0].title).trim();
             if (Array.isArray(tasksData) ? tasksData.some(t => String(t).trim() === tTitle) : String(tasksData).trim() === tTitle) {
                 shouldGenerate = true;
             }
        }

        if (shouldGenerate && emp.jobTitle) {
          if (empTasks.length > 0) empTasks = []; // حذف المهمة الثابتة لاستبدالها
          
          if (tasksData) {
             if (Array.isArray(tasksData)) {
                const [sY, sM] = startDate.split('-').map(Number);
                const [eY, eM] = endDate.split('-').map(Number);

                const startMonthVal = sY * 12 + (sM - 1);
                const endMonthVal = eY * 12 + (eM - 1);

                // استخراج الترتيب الثابت للموظف داخل مسماه الوظيفي لضمان توزيع المهام باختلافها
                const stableEmpIndex = jobTitleRanks[jobTitleKey] ? jobTitleRanks[jobTitleKey].indexOf(String(emp.id || emp._id)) : 0;
                const finalEmpIndex = Math.max(0, stableEmpIndex);

                for (let m = startMonthVal; m <= endMonthVal; m++) {
                    const currentYear = Math.floor(m / 12);
                    const currentMonthIdx = m % 12;
                    const taskDate = new Date(currentYear, currentMonthIdx, 1);

                    const taskIndex = (currentMonthIdx + finalEmpIndex) % tasksData.length;
                    const taskDesc = tasksData[taskIndex];
                    
                    if (taskDesc) {
                        empTasks.push({
                           id: `default-${emp.id || emp._id}-${currentMonthIdx}`,
                           title: taskDesc,
                           createdAt: format(taskDate, 'yyyy-MM-dd'),
                           updatedAt: format(endOfMonth(taskDate), 'yyyy-MM-dd'),
                           status: 'completed',
                           progressPercentage: 100
                        });
                    }
                }
             } else {
                 empTasks.push({
                    id: `default-${emp.id || emp._id}`,
                    title: tasksData,
                    createdAt: startDate,
                    updatedAt: endDate,
                    status: 'completed',
                    progressPercentage: 100
                 });
             }
          }
        }

        empTasks.sort((a, b) => new Date(a.createdAt || a.created_at) - new Date(b.createdAt || b.created_at));

        const monthsDiff = Math.max(differenceInMonths(parseISO(endDate), parseISO(startDate)) + 1, 1);

        const plannedHours = (Number(emp.monthlyWorkHours) || 176) * monthsDiff;
        
        const deduction = (Number(emp.absentDays) || 0) * 8;
        const effectiveHours = Math.max(0, totalWorkHours - deduction);
        const remainingHours = plannedHours - effectiveHours;
        const activePercentage = plannedHours > 0 ? (effectiveHours * 100) / plannedHours : 0;
        
        console.log(`Employee ${emp.name}: Found ${empTasks.length} tasks (Total ID matches: ${idMatchCount})`);
        
        employeesData.push({ ...emp, tasks: empTasks, totalIdMatches: idMatchCount, 
          stats: { plannedHours, effectiveHours, remainingHours, avgProgress: activePercentage } });
      }

      if (hasErrors) {
        alert(language === 'ar' ? 'تنبيه: حدثت أخطاء أثناء جلب بعض البيانات، قد يكون التقرير غير مكتمل.' : 'Warning: Some data failed to load, the report may be incomplete.');
      }

      setPrintData({
        clientName,
        employees: employeesData,
        startDate,
        endDate
      });
      setIsPrinting(true);
    } catch (err) {
      console.error(err);
      if (err.message === 'Network Error') {
        alert(t('networkError'));
      } else {
        alert(t('errorFetchingTasks'));
      }
    }
  };

  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintData(null);
      setIsPrinting(false);
    };

    if (isPrinting && printData) {
      const timer = setTimeout(() => {
        window.addEventListener('afterprint', handleAfterPrint, { once: true });
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [isPrinting, printData]);

  const formatHours = (val) => {
    let h = Math.floor(val);
    let m = Math.round((val - h) * 60);
    if (m === 60) { h += 1; m = 0; }
    return `${h}:${m < 10 ? '0' : ''}${m}`;
  };

  const totalPages = Math.ceil(employees.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEmployees = employees.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSelectPage = (e) => {
    if (e.target.checked) {
      const all = { ...selectedEmpIds };
      paginatedEmployees.forEach(emp => all[emp.id || emp._id] = true);
      setSelectedEmpIds(all);
    } else {
      const newSelected = { ...selectedEmpIds };
      paginatedEmployees.forEach(emp => delete newSelected[emp.id || emp._id]);
      setSelectedEmpIds(newSelected);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('reportTitleTask')}</h1>
          <p className="text-gray-500 mt-1 text-sm">{language === 'ar' ? 'قم بتصفية واستخراج تقارير مهام الموظفين بدقة' : 'Filter and extract employee task reports'}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleGetEmployees} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            {t('getEmployee')}
          </button>
          <button onClick={handlePrintTasks} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            {t('print')}
          </button>
          <button 
            onClick={() => setShowHeaderFooter(!showHeaderFooter)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all active:scale-95 ${showHeaderFooter ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
          >
            {showHeaderFooter ? (language === 'ar' ? 'إخفاء الهيدر والفوتر' : 'Hide Header & Footer') : (language === 'ar' ? 'إظهار الهيدر والفوتر' : 'Show Header & Footer')}
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-start">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{language === 'ar' ? 'العميل / الشركة' : 'Client'}</label>
            <ClientSelect value={clientId} onChange={(id) => { setClientId(id); if (!id) setClientName(''); }} hideLabel noMargin />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('year')}</label>
            <input type="number" value={year} onChange={handleYearChange} className="w-full border border-gray-200 bg-gray-50 focus:bg-white h-[46px] px-3 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('month')}</label>
            <select value={month} onChange={handleMonthChange} className="w-full border border-gray-200 bg-gray-50 focus:bg-white h-[46px] px-3 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none">
              <option value={0}>{t('allMonths')}</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('start_date')}</label>
            <input type="date" lang="en-GB" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-gray-200 bg-gray-50 focus:bg-white h-[46px] px-3 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" />
            <div className="text-xs text-emerald-600 mt-1 font-medium">{startDate && isValid(parseISO(startDate)) ? format(parseISO(startDate), 'dd/MM/yyyy') : ''}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('end_date')}</label>
            <input type="date" lang="en-GB" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-gray-200 bg-gray-50 focus:bg-white h-[46px] px-3 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" />
            <div className="text-xs text-emerald-600 mt-1 font-medium">{endDate && isValid(parseISO(endDate)) ? format(parseISO(endDate), 'dd/MM/yyyy') : ''}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 text-sm font-semibold">
                <th className="p-4 border-r border-gray-100 text-center w-16">{t('no')}</th>
                <th className="p-4 border-r border-gray-100 text-center w-24">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <label className="text-[10px] flex items-center gap-1.5 cursor-pointer mb-0" title={language === 'ar' ? 'تحديد الكل' : 'Select all'}>
                      <input type="checkbox" onChange={handleSelectAll} checked={employees.length > 0 && employees.every(e => selectedEmpIds[e.id || e._id])} className="rounded text-emerald-600 focus:ring-emerald-500" />
                      <span>{language === 'ar' ? 'الكل' : 'All'}</span>
                    </label>
                    <label className="text-[10px] flex items-center gap-1.5 cursor-pointer text-emerald-600 mb-0" title={language === 'ar' ? 'تحديد هذه الصفحة فقط' : 'Select this page only'}>
                      <input type="checkbox" onChange={handleSelectPage} checked={paginatedEmployees.length > 0 && paginatedEmployees.every(e => selectedEmpIds[e.id || e._id])} className="rounded text-emerald-600 focus:ring-emerald-500" />
                      <span>{language === 'ar' ? 'الصفحة' : 'Page'}</span>
                    </label>
                  </div>
                </th>
                <th className="p-4 border-r border-gray-100">{t('employee')}</th>
                <th className="p-4 border-r border-gray-100">{t('identity')}</th>
                <th className="p-4 border-r border-gray-100">{t('start_date')}</th>
                <th className="p-4">{t('jobTitle')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.length > 0 ? paginatedEmployees.map((emp, index) => (
                <tr key={emp.id || emp._id || startIndex + index} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors">
                  <td className="p-4 border-r border-gray-100 text-center text-gray-500">{startIndex + index + 1}</td>
                  <td className="p-4 border-r border-gray-100 text-center">
                    <input type="checkbox" checked={!!selectedEmpIds[emp.id || emp._id]} onChange={() => handleCheckboxChange(emp.id || emp._id)} className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                  </td>
                  <td className="p-4 border-r border-gray-100 font-medium text-gray-900">{emp.name}</td>
                  <td className="p-4 border-r border-gray-100 text-gray-600">{emp.identityNumber || '-'}</td>
                  <td className="p-4 border-r border-gray-100 text-gray-600">{emp.joiningDate ? format(new Date(emp.joiningDate), 'dd/MM/yyyy') : '-'}</td>
                  <td className="p-4 text-gray-600">{emp.jobTitle || '-'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      <span className="text-base font-medium">{t('noData')}</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white p-4 rounded shadow mb-6 mt-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
          >
            {language === 'ar' ? 'السابق' : 'Previous'}
          </button>
          <span className="text-sm text-gray-600 font-bold">
            {language === 'ar' ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
          >
            {language === 'ar' ? 'التالي' : 'Next'}
          </button>
        </div>
      )}

      {printData && isPrinting && (
        <div id="printable-content">
          {printData.employees.map((emp, index) => (
              <div key={emp.id || emp._id || index} className="page-break" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                {showHeaderFooter && (
                <div className="print-footer-fixed text-center px-10 pb-5 text-[10px] text-gray-600">
                    <div className="border-t-2 border-emerald-600 mb-2"></div>
                    <p dir="rtl">المملكة العربية السعودية – الرياض – ترخيص رقم (7041409280) هاتف (+966-555876997)</p>
                    <p dir="ltr">Kingdom of Saudi Arabia – Riyadh – License No (7041409280) ,Tel (+966-555876997)</p>
                </div>
                )}

                {showHeaderFooter && (
                <div className="print-header-fixed px-10 pt-5 pb-2">
                  <header className="mb-4 relative">
                    <div className="flex justify-between items-end pb-2 border-b-2 border-emerald-600">
                      <div className="w-1/3">
                        <img src={logo} alt="Logo" className="h-16 w-auto object-contain" />
                      </div>
                      <div className="w-1/3 text-right">
                        <h2 className="text-2xl font-extrabold text-emerald-600">شركة سكل أب</h2>
                        <p className="text-gray-500 font-bold tracking-widest text-xs">SKILLUP</p>
                      </div>
                    </div>
                    <div className="text-center mt-2">
                      <h1 className="text-lg font-bold">{t('printTitleTaskReport')}</h1>
                      <h2 className="text-base text-gray-600">{printData.clientName}</h2>
                      <p className="text-xs text-gray-500">{t('from')}: {format(new Date(printData.startDate), 'dd/MM/yyyy')} - {t('to')}: {format(new Date(printData.endDate), 'dd/MM/yyyy')}</p>
                    </div>
                  </header>
                </div>
                )}

                <table className="w-full">
                  <thead>
                    <tr>
                      <td>
                        <div className={showHeaderFooter ? "h-[180px]" : "h-[20px]"}></div>
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-10 align-top">
                        <div className="mb-6 border border-black p-4 rounded bg-gray-50">
                          <div className="grid grid-cols-3 gap-4 text-sm font-bold">
                            <p>{t('worker')}: <span className="font-normal">{emp.name}</span></p>
                            <p>{t('jobTitle')}: <span className="font-normal">{emp.jobTitle || '-'}</span></p>
                            <p>{t('identity')}: <span className="font-normal">{emp.identityNumber || '-'}</span></p>
                          </div>
                        </div>

                        <table className="w-full mb-6 border border-black font-semibold text-sm">
                          <tbody>
                            <tr>
                              <td className="p-2 border border-black bg-gray-100 w-1/4">{t('initialPlannedHours')}</td>
                              <td className="p-2 border border-black w-1/4 text-center">{formatHours(emp.stats.plannedHours)}</td>
                              <td className="p-2 border border-black bg-gray-100 w-1/4">{t('effectiveHours')}</td>
                              <td className="p-2 border border-black w-1/4 text-center">{formatHours(emp.stats.effectiveHours)}</td>
                            </tr>
                            <tr>
                              <td className="p-2 border border-black bg-gray-100">{t('remainingHours')}</td>
                              <td className="p-2 border border-black text-center">{formatHours(emp.stats.remainingHours)}</td>
                              <td className="p-2 border border-black bg-gray-100">{t('activePercentage')}</td>
                              <td className="p-2 border border-black text-center">{emp.stats.avgProgress.toFixed(2)}%</td>
                            </tr>
                          </tbody>
                        </table>

                        <table className="w-full border-collapse text-center text-sm mb-8 border border-black">
                          <thead>
                            <tr className="bg-gray-200 border-b border-black">
                              <th className="border border-black p-2 w-12">{t('no')}</th>
                              <th className="border border-black p-2">{t('taskName')}</th>
                              <th className="border border-black p-2 w-24">{t('startDate')}</th>
                              <th className="border border-black p-2 w-24">{t('endDate')}</th>
                              <th className="border border-black p-2 w-20">{t('plannedHours')}</th>
                              <th className="border border-black p-2 w-20">{t('effectiveHours')}</th>
                              <th className="border border-black p-2 w-20">{t('activePercentage')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {emp.tasks && emp.tasks.length > 0 ? emp.tasks.map((task, idx) => {
                              return (
                                <tr key={task.id || task._id || idx}>
                                <td className="border border-black p-2">{idx + 1}</td>
                                <td className="border border-black p-2 text-right">{task.title}</td>
                                <td className="border border-black p-2">{task.createdAt ? format(new Date(task.createdAt), 'dd/MM/yyyy') : format(parseISO(printData.startDate), 'dd/MM/yyyy')}</td>
                                <td className="border border-black p-2">{task.updatedAt ? format(new Date(task.updatedAt), 'dd/MM/yyyy') : format(parseISO(printData.endDate), 'dd/MM/yyyy')}</td>
                                <td className="border border-black p-2">{formatHours(emp.stats.plannedHours)}</td>
                                <td className="border border-black p-2">{formatHours(emp.stats.effectiveHours)}</td>
                                <td className="border border-black p-2">{emp.stats.avgProgress.toFixed(2)}%</td>
                              </tr>
                              );
                            }) : (
                              <tr>
                                <td colSpan="7" className="border border-black p-4">
                                  {t('noTasks')}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>
                        <div className={showHeaderFooter ? "h-[80px]" : "h-[20px]"}></div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskReport;
