import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";



const DevTools = () => {
  const { user } = useAuth();
  const [isDevAuth, setIsDevAuth] = useState(false);
  const [devPassword, setDevPassword] = useState("");
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [empForm, setEmpForm] = useState({ name: "", email: "", password: "" });
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
  });
  const [msg, setMsg] = useState("");
  const [knownJobTitles, setKnownJobTitles] = useState([]);

  const [checkEmpId, setCheckEmpId] = useState("");
  const [checkStartDate, setCheckStartDate] = useState("2026-01-01");
  const [checkEndDate, setCheckEndDate] = useState("2026-03-31");
  const [attendanceResult, setAttendanceResult] = useState(null);
  const [seederModal, setSeederModal] = useState({
    show: false,
    mode: '', // 'seed' or 'delete'
    targetEmployees: [],
    progress: 0,
    total: 0,
    status: 'idle', // 'idle', 'processing', 'done'
    errors: [],
    successCount: 0,
  });

  const [seedStartDate, setSeedStartDate] = useState("2026-01-01");
  const [seedEndDate, setSeedEndDate] = useState("2026-12-31");
  const [seedClientId, setSeedClientId] = useState("");

  const [scanYear, setScanYear] = useState(2026);
  const [scanResults, setScanResults] = useState(null);

  // حساب المسميات الوظيفية غير المعتمدة
  const unmappedJobTitles = React.useMemo(() => {
    const unmapped = {};
    // دالة لتجاهل المسافات والهمزات أثناء الفحص
    const normalize = (t) =>
      String(t)
        .replace(/[أإآ]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/[ىئ]/g, "ي")
        .replace(/\s+/g, "")
        .trim();
    const knownNormalized = knownJobTitles.map(normalize);

    employees.forEach((emp) => {
      if (!emp.jobTitle || emp.status === "inactive") return;
      const title = String(emp.jobTitle).trim();
      const normalizedTitle = normalize(title);
      if (
        !knownJobTitles.includes(title) &&
        !knownNormalized.includes(normalizedTitle)
      ) {
        if (!unmapped[title]) unmapped[title] = [];
        unmapped[title].push(emp.name);
      }
    });
    return unmapped;
  }, [employees, knownJobTitles]);

  const fetch = async () => {
    try {
      const e = await api.get("/employees");
      setEmployees(e.data || []);
      const t = await api.get("/tasks");
      setTasks(t.data || []);
      const c = await api.get("/clients");
      setClients(c.data || []);
      const jts = await api.get("/job-titles");
      setKnownJobTitles(Object.keys(jts.data || {}));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isDevAuth) fetch();
  }, [isDevAuth]);

  const createEmp = async (ev) => {
    ev.preventDefault();
    try {
      await api.post("/employees", empForm);
      setMsg("Employee created");
      setEmpForm({ name: "", email: "", password: "" });
      fetch();
    } catch (err) {
      setMsg(err.response?.data?.message || "Create failed");
    }
  };

  const createTask = async (ev) => {
    ev.preventDefault();
    try {
      await api.post("/tasks", taskForm);
      setMsg("Task created");
      setTaskForm({ title: "", description: "", assignedTo: "" });
      fetch();
    } catch (err) {
      setMsg(err.response?.data?.message || "Create failed");
    }
  };

  const checkAttendance = async (ev) => {
    ev.preventDefault();
    if (!checkEmpId) return;
    api
      .post("/auth/log", {
        action: "DEV_INSPECT_DB",
        details: `Inspected attendance for user ${checkEmpId}`,
      })
      .catch(() => {});
    setAttendanceResult("Loading...");
    try {
      const res = await api.get("/attendance/history", {
        params: {
          userId: checkEmpId,
          startDate: checkStartDate,
          endDate: checkEndDate,
          limit: 1000,
          all: true,
        },
      });
      setAttendanceResult(res.data);
    } catch (err) {
      setAttendanceResult({ error: err.message, response: err.response?.data });
    }
  };

  const handleSeed = (ev) => {
    ev.preventDefault();

    let targetEmployees = [];
    if (seedClientId) {
      targetEmployees = employees.filter((e) => {
        const cId = e.client?.id || e.client?._id || e.client;
        return String(cId) === String(seedClientId) && e.status !== "inactive";
      });
    } else {
      targetEmployees = employees.filter((e) => e.status !== "inactive");
    }

    if (targetEmployees.length === 0) {
      setMsg("لا يوجد موظفين نشطين لهذه الشركة.");
      return;
    }

    setSeederModal({
      show: true, mode: 'seed', targetEmployees, progress: 0, total: targetEmployees.length, status: 'idle', errors: [], successCount: 0,
    });
  };

  const handleDeleteAll = () => {
    let targetEmployees = [];
    if (seedClientId) {
      targetEmployees = employees.filter((e) => {
        const cId = e.client?.id || e.client?._id || e.client;
        return String(cId) === String(seedClientId);
      });
    } else {
      targetEmployees = employees;
    }

    if (targetEmployees.length === 0) {
      setMsg("لا يوجد موظفين.");
      return;
    }

    setSeederModal({
      show: true, mode: 'delete', targetEmployees, progress: 0, total: targetEmployees.length, status: 'idle', errors: [], successCount: 0,
    });
  };

  const executeSeederAction = async () => {
    setSeederModal(prev => ({ ...prev, status: 'processing', progress: 0, successCount: 0, errors: [] }));
    let successCount = 0;
    const errors = [];
    const targets = seederModal.targetEmployees;

    for (let i = 0; i < targets.length; i++) {
      const emp = targets[i];
      try {
        const payload = {
          startDate: seedStartDate,
          endDate: seedEndDate,
          userId: emp.id || emp._id,
          employeeId: emp.id || emp._id,
        };
        if (seedClientId) payload.clientId = seedClientId;

        if (seederModal.mode === 'seed') {
          await api.post("/attendance/seed", payload);
        } else {
          await api.delete("/attendance/range", { params: payload, data: payload });
        }
        successCount++;
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (err) {
        console.error(err);
        const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Unknown error";
        errors.push(`${emp.name}: ${errMsg}`);
      }
      setSeederModal(prev => ({ ...prev, progress: i + 1 }));
    }
    setSeederModal(prev => ({ ...prev, status: 'done', successCount, errors }));
  };

  const handleScanYear = async () => {
    api
      .post("/auth/log", {
        action: "DEV_SCAN_DATA",
        details: `Scanned data availability for year ${scanYear}`,
      })
      .catch(() => {});
    setScanResults({});
    const results = {};

    for (let m = 1; m <= 12; m++) {
      const mStr = String(m).padStart(2, "0");
      // حساب آخر يوم في الشهر يدوياً لضمان الدقة
      const lastDay = new Date(scanYear, m, 0).getDate();
      const start = `${scanYear}-${mStr}-01`;
      const end = `${scanYear}-${mStr}-${lastDay}`;

      try {
        // نطلب عدد قليل فقط للتأكد من الوجود، لكن الـ API الحالية ترجع الكل
        // سنستخدم limit 1 لتخفيف الحمل إذا كنا فقط نفحص الوجود،
        // لكن لمعرفة العدد الفعلي نحتاج limit كبير أو endpoint مخصص للعد.
        // هنا سنستخدم limit 1000 لنأخذ فكرة تقريبية
        const res = await api.get("/attendance/history", {
          params: { startDate: start, endDate: end, limit: 1000, all: true },
        });
        results[m] = Array.isArray(res.data) ? res.data.length : 0;
        setScanResults((prev) => ({ ...prev, [m]: results[m] }));
      } catch (err) {
        console.error(`Error scanning month ${m}`, err);
        results[m] = "Error";
        setScanResults((prev) => ({ ...prev, [m]: "Error" }));
      }
    }
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?"))
      return;
    try {
      await api.delete(`/employees/${id}`);
      setMsg("Employee deleted");
      fetch();
    } catch (err) {
      setMsg("Delete failed");
    }
  };

  const handleDownloadUnmappedTitles = () => {
    const titles = Object.keys(unmappedJobTitles);
    if (titles.length === 0) return;
    const blob = new Blob([titles.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "unmapped_job_titles.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [activeTab, setActiveTab] = useState('overview');

  if (user?.role !== "admin") {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
        <p className="text-gray-500">
          Only administrators can access Developer Tools.
        </p>
      </div>
    );
  }

  if (!isDevAuth) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center max-w-md w-full">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Developer Access
          </h1>
          <p className="text-gray-500 mb-6">
            This area is restricted. Please enter the access code.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (devPassword === "Alama123@") setIsDevAuth(true);
              else alert("Access Denied");
            }}
            className="space-y-4"
          >
            <input
              type="password"
              value={devPassword}
              onChange={(e) => setDevPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-center tracking-widest"
              placeholder="••••••••"
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-col md:flex-row gap-6 mb-6 items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
            <span>⚙️</span> أدوات المطور
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            صلاحيات المسؤول: {user?.name}
          </p>
        </div>
        <div className="flex bg-white rounded-xl shadow-sm p-1 border border-gray-200">
          <button onClick={() => setActiveTab('overview')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-gray-900 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>نظرة عامة والتحليل</button>
          <button onClick={() => setActiveTab('data')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'data' ? 'bg-gray-900 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>إدارة البيانات (Seeder)</button>
          <button onClick={() => setActiveTab('entities')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'entities' ? 'bg-gray-900 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>الموظفين والمهام</button>
        </div>
      </div>

      {msg && (
        <div className="mb-6 p-4 bg-blue-50 border-r-4 border-blue-500 text-blue-700 rounded-lg flex items-center gap-2 shadow-sm animate-pulse">
          <span>ℹ️</span> {msg}
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Unmapped Job Titles Scanner */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-2 h-full bg-red-500"></div>
            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span>⚠️</span> مكتشف المسميات الوظيفية الغريبة
              </h2>
              {Object.keys(unmappedJobTitles).length > 0 && (
                <button
                  onClick={handleDownloadUnmappedTitles}
                  className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors shadow-sm"
                >
                  تحميل القائمة (TXT)
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-6 max-w-3xl">
              هذه القائمة تعرض المسميات الوظيفية الموجودة حالياً في قاعدة البيانات
              (والتي تم رفعها بالخطأ أو عبر الإكسل) ولكنها غير مطابقة للقائمة
              المعتمدة في النظام.
            </p>

            {Object.keys(unmappedJobTitles).length === 0 ? (
              <div className="text-emerald-700 font-bold p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                <span>✅</span> ممتاز! جميع المسميات الوظيفية للموظفين النشطين مطابقة للنظام بالكامل.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(unmappedJobTitles).map(([title, emps]) => (
                  <div key={title} className="border border-red-100 rounded-xl p-4 bg-gradient-to-br from-red-50 to-white shadow-sm">
                    <div className="font-bold text-red-900 text-lg mb-1">{title}</div>
                    <div className="text-xs text-red-600 mb-3 font-semibold bg-red-100 inline-block px-2 py-1 rounded">
                      عدد الموظفين: {emps.length}
                    </div>
                    <ul className="text-xs text-gray-700 max-h-32 overflow-y-auto list-decimal list-inside space-y-1">
                      {emps.map((e, i) => (
                        <li key={i} className="truncate" title={e}>{e}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Data Scanner Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
            <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span>📊</span> فحص توافر البيانات (Data Scanner)
            </h2>
            <p className="text-sm text-gray-500 mb-6">قم بفحص قاعدة البيانات لمعرفة الأشهر التي تحتوي على سجلات حضور وانصراف.</p>
            
            <div className="flex gap-3 items-end mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200 w-fit">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">سنة الفحص</label>
                <input
                  type="number"
                  value={scanYear}
                  onChange={(e) => setScanYear(Number(e.target.value))}
                  className="border border-gray-300 p-2.5 rounded-lg w-32 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <button onClick={handleScanYear} className="bg-amber-600 text-white px-5 py-2.5 font-bold rounded-lg hover:bg-amber-700 transition-colors shadow-sm">
                بدء الفحص الشامل
              </button>
            </div>

            {scanResults && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <div key={m} className={`p-4 rounded-xl text-center border-2 transition-all ${scanResults[m] > 0 ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-100"}`}>
                    <div className="font-bold text-sm text-gray-600 mb-1">شهر {m}</div>
                    <div className={`text-2xl font-black ${scanResults[m] > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {scanResults[m] !== undefined ? (scanResults[m] === 1000 ? "+1000" : scanResults[m]) : "..."}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1 font-bold">
                      {scanResults[m] > 0 ? "سجل موجود" : "فارغ"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-purple-500"></div>
            <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span>🌱</span> مولد البيانات الوهمية (Data Seeder)
            </h2>
            <p className="text-sm text-gray-500 mb-6">استخدم هذه الأداة لتوليد سجلات حضور وانصراف عشوائية لشركة معينة أو مسحها بالكامل للتدريب والاختبار.</p>
            
            <form onSubmit={handleSeed} className="flex flex-wrap gap-4 items-end bg-gray-50 p-5 rounded-xl border border-gray-200">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-gray-700 mb-1">الشركة المستهدفة</label>
                <select value={seedClientId} onChange={(e) => setSeedClientId(e.target.value)} className="border border-gray-300 w-full p-2.5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none">
                  <option value="">جميع الشركات (خطر)</option>
                  {clients.map((c) => (
                    <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">تاريخ البداية</label>
                <input type="date" value={seedStartDate} onChange={(e) => setSeedStartDate(e.target.value)} className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">تاريخ النهاية</label>
                <input type="date" value={seedEndDate} onChange={(e) => setSeedEndDate(e.target.value)} className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-purple-600 text-white font-bold px-5 py-2.5 rounded-lg hover:bg-purple-700 transition-colors shadow-sm">
                  توليد السجلات
                </button>
                <button type="button" onClick={handleDeleteAll} className="bg-red-50 text-red-700 border border-red-200 font-bold px-5 py-2.5 rounded-lg hover:bg-red-100 transition-colors shadow-sm">
                  حذف السجلات
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
            <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span>🔍</span> فاحص قاعدة البيانات (Database Inspector)
            </h2>
            <p className="text-sm text-gray-500 mb-6">استعلم عن سجلات الحضور لموظف معين بشكل مباشر من الـ API.</p>
            
            <form onSubmit={checkAttendance} className="flex flex-wrap gap-4 items-end bg-gray-50 p-5 rounded-xl border border-gray-200">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-gray-700 mb-1">الموظف</label>
                <select value={checkEmpId} onChange={(e) => setCheckEmpId(e.target.value)} className="border border-gray-300 w-full p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">اختر موظفاً...</option>
                  {employees.map((e) => (
                    <option key={e.id || e._id} value={e.id || e._id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">من</label>
                <input type="date" value={checkStartDate} onChange={(e) => setCheckStartDate(e.target.value)} className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">إلى</label>
                <input type="date" value={checkEndDate} onChange={(e) => setCheckEndDate(e.target.value)} className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <button type="submit" className="bg-blue-600 text-white font-bold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                استعلام (API)
              </button>
            </form>
            {attendanceResult && (
              <div className="mt-4 bg-gray-900 text-green-400 p-5 rounded-xl overflow-auto max-h-80 text-xs font-mono shadow-inner border border-gray-800">
                <div className="mb-3 font-bold text-white border-b border-gray-700 pb-2 flex justify-between">
                  <span>نتائج الاستعلام</span>
                  <span className="bg-gray-800 px-2 py-1 rounded text-green-400">Count: {Array.isArray(attendanceResult) ? attendanceResult.length : "N/A"}</span>
                </div>
                <pre dir="ltr" className="whitespace-pre-wrap">{JSON.stringify(attendanceResult, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'entities' && (
        <div>
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">إنشاء موظف سريع</h2>
              <form onSubmit={createEmp} className="space-y-3">
                <input placeholder="اسم الموظف" value={empForm.name} onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 outline-none transition-all" />
                <input placeholder="البريد الإلكتروني" value={empForm.email} onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 outline-none transition-all" />
                <input placeholder="كلمة المرور" type="password" value={empForm.password} onChange={(e) => setEmpForm({ ...empForm, password: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 outline-none transition-all" />
                <button className="w-full bg-gray-900 text-white font-bold px-4 py-3 rounded-lg hover:bg-black transition-colors">إضافة الموظف</button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">إنشاء مهمة سريعة</h2>
              <form onSubmit={createTask} className="space-y-3">
                <input placeholder="عنوان المهمة" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 outline-none transition-all" />
                <input placeholder="الوصف" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 outline-none transition-all" />
                <select value={taskForm.assignedTo} onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 outline-none transition-all">
                  <option value="">-- تعيين لموظف --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                  ))}
                </select>
                <button className="w-full bg-gray-900 text-white font-bold px-4 py-3 rounded-lg hover:bg-black transition-colors">إسناد المهمة</button>
              </form>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="font-bold text-gray-800">قائمة الموظفين</h3>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">{employees.length} موظف</span>
              </div>
              <ul className="space-y-2 text-sm max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {employees.map((e) => (
                  <li key={e.id || e._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-300 transition-all">
                    <div>
                      <div className="font-bold text-gray-800">{e.name}</div>
                      <div className="text-xs text-gray-500">{e.email}</div>
                      {!e.client && <span className="text-red-500 text-[10px] font-bold bg-red-50 px-1 rounded mt-1 inline-block">غير مسجل بشركة</span>}
                    </div>
                    <button onClick={() => deleteEmployee(e.id || e._id)} className="text-red-500 hover:bg-red-50 hover:text-red-700 text-xs font-bold border border-red-200 px-3 py-1.5 rounded-lg transition-colors">
                      حذف
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="font-bold text-gray-800">سجل المهام الشامل</h3>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">{tasks.length} مهمة</span>
              </div>
              <ul className="space-y-2 text-sm max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {tasks.map((t) => (
                  <li key={t.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="font-bold text-gray-800 mb-1">{t.title}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <span>👤 مسندة إلى:</span>
                      <span className="font-bold text-gray-700">{t.assigned?.name || (typeof t.assignedTo === 'object' ? t.assignedTo?.name : t.assignedTo) || "غير محدد"}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Seeder / Delete Modal */}
      {seederModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" dir="rtl">
            <div className="p-6">
              {seederModal.status === 'idle' && (
                <>
                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${seederModal.mode === 'seed' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      <span className="text-3xl">{seederModal.mode === 'seed' ? '🌱' : '⚠️'}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {seederModal.mode === 'seed' ? 'تأكيد توليد البيانات' : 'تحذير خطير: حذف البيانات'}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {seederModal.mode === 'seed' 
                        ? `هل أنت متأكد من رغبتك في توليد بيانات حضور عشوائية لـ ${seederModal.total} موظف؟` 
                        : `هل أنت متأكد من حذف جميع بيانات الحضور لـ ${seederModal.total} موظف في الفترة المحددة؟ لا يمكن التراجع عن هذا الإجراء!`}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setSeederModal(prev => ({ ...prev, show: false }))} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors">
                      إلغاء
                    </button>
                    <button onClick={executeSeederAction} className={`flex-1 px-4 py-2.5 rounded-xl text-white font-bold transition-colors ${seederModal.mode === 'seed' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                      {seederModal.mode === 'seed' ? 'البدء بالتوليد' : 'نعم، احذف السجلات'}
                    </button>
                  </div>
                </>
              )}

              {seederModal.status === 'processing' && (
                <div className="py-6 text-center">
                  <div className="text-4xl animate-bounce mb-4">{seederModal.mode === 'seed' ? '⚙️' : '🗑️'}</div>
                  <h3 className="text-lg font-bold text-gray-800 mb-6">
                    {seederModal.mode === 'seed' ? 'جاري توليد البيانات...' : 'جاري مسح البيانات...'}
                  </h3>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-100 rounded-full h-4 mb-2 overflow-hidden shadow-inner relative">
                    <div 
                      className={`absolute top-0 bottom-0 right-0 rounded-full transition-all duration-300 ease-out ${seederModal.mode === 'seed' ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-red-600 to-red-400'}`}
                      style={{ width: `${(seederModal.progress / (seederModal.total || 1)) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-gray-500 mb-1">
                    <span>{Math.round((seederModal.progress / (seederModal.total || 1)) * 100)}%</span>
                    <span>{seederModal.progress} / {seederModal.total} موظف</span>
                  </div>
                </div>
              )}

              {seederModal.status === 'done' && (
                <div className="py-6 text-center">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full mx-auto flex items-center justify-center mb-4">
                    <span className="text-3xl">✓</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">اكتملت العملية</h3>
                  <p className="text-gray-600 mb-6 text-sm">
                    تمت العملية بنجاح لـ <span className="font-bold text-green-600">{seederModal.successCount}</span> موظف.
                    {seederModal.errors.length > 0 && (
                      <span className="block mt-2 text-red-600 font-bold">
                        فشل لـ {seederModal.errors.length} موظف (راجع الكونسول للمزيد).
                      </span>
                    )}
                  </p>
                  <button onClick={() => setSeederModal(prev => ({ ...prev, show: false }))} className="w-full px-4 py-2.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors">
                    إغلاق
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevTools;
