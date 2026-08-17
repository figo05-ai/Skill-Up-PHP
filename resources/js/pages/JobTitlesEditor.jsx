import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const JobTitlesEditor = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [jobTitles, setJobTitles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [title, setTitle] = useState('');
  const [tasks, setTasks] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'Felo455' && password === '12#qW455') {
      setIsAuthenticated(true);
      fetchJobTitles();
    } else {
      setError('بيانات الدخول غير صحيحة!');
    }
  };

  const fetchJobTitles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/job-titles/admin');
      setJobTitles(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('فشل في جلب البيانات من الخادم.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setTasks('');
    setEditMode(false);
    setCurrentId(null);
  };

  const handleEdit = (jt) => {
    setTitle(jt.title);
    setTasks(jt.tasks.join('\n'));
    setCurrentId(jt.id);
    setEditMode(true);
    window.scrollTo(0, 0);
  };

  const handleDelete = (id) => {
    setDeleteConfirm({ show: true, id });
  };

  const executeDelete = async () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ show: false, id: null });
    try {
      await api.delete(`/job-titles/${id}`);
      fetchJobTitles();
    } catch (err) {
      alert('فشل الحذف');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !tasks.trim()) {
      setError('يرجى تعبئة جميع الحقول');
      return;
    }

    const taskArray = tasks.split('\n').map(t => t.trim()).filter(t => t);

    try {
      if (editMode) {
        await api.put(`/job-titles/${currentId}`, { title, tasks: taskArray });
      } else {
        await api.post('/job-titles', { title, tasks: taskArray });
      }
      resetForm();
      fetchJobTitles();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full mx-auto flex items-center justify-center mb-4">
              <span className="text-3xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة المسميات الوظيفية</h1>
            <p className="text-gray-500 mt-2 text-sm">يرجى تسجيل الدخول للوصول للوحة التحكم</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">اسم المستخدم</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                placeholder="Felo..."
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                placeholder="••••••••"
                dir="ltr"
              />
            </div>
            
            {error && <div className="text-red-500 text-sm font-bold text-center bg-red-50 p-2 rounded-lg">{error}</div>}

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md mt-4">
              دخول
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>💼</span> محرر المسميات الوظيفية
            </h1>
            <p className="text-gray-500 text-sm mt-1">يمكنك إضافة، تعديل وحذف المهام بكل سهولة، وسيتم تطبيقها مباشرة في التقارير.</p>
          </div>
          <button onClick={() => setIsAuthenticated(false)} className="text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg font-bold transition-colors">
            تسجيل خروج
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Editor Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">
                {editMode ? '✏️ تعديل مسمى وظيفي' : '➕ إضافة مسمى جديد'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">المسمى الوظيفي</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="مثال: مدير تسويق"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">المهام (كل مهمة في سطر جديد)</label>
                  <textarea
                    value={tasks}
                    onChange={(e) => setTasks(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[200px]"
                    placeholder="المهمة الأولى&#10;المهمة الثانية&#10;المهمة الثالثة..."
                    required
                  ></textarea>
                </div>
                
                {error && <div className="text-red-500 text-xs font-bold">{error}</div>}
                
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-all shadow-sm">
                    {editMode ? 'حفظ التعديلات' : 'إضافة'}
                  </button>
                  {editMode && (
                    <button type="button" onClick={resetForm} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-all">
                      إلغاء
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* List of Job Titles */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800">قائمة المسميات ({jobTitles.length})</h2>
                <button onClick={fetchJobTitles} className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
                  🔄 تحديث
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12 text-gray-500 font-bold animate-pulse">جاري التحميل...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobTitles.map((jt) => (
                    <div key={jt.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-gray-50 relative group">
                      <div className="absolute left-4 top-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(jt)} className="text-blue-600 bg-blue-100 hover:bg-blue-200 p-1.5 rounded" title="تعديل">✏️</button>
                        <button onClick={() => handleDelete(jt.id)} className="text-red-600 bg-red-100 hover:bg-red-200 p-1.5 rounded" title="حذف">🗑️</button>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2 pr-2">{jt.title}</h3>
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold mb-3">
                        {jt.tasks?.length || 0} مهام
                      </span>
                      <ul className="text-xs text-gray-600 space-y-1 pr-4 list-disc max-h-32 overflow-y-auto custom-scrollbar">
                        {(jt.tasks || []).map((t, idx) => (
                          <li key={idx} className="line-clamp-2">{t}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  
                  {jobTitles.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      لا يوجد مسميات وظيفية بعد.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <DeleteConfirmModal 
          isOpen={deleteConfirm.show}
          onClose={() => setDeleteConfirm({ show: false, id: null })}
          onConfirm={executeDelete}
          message="هل أنت متأكد من حذف هذا المسمى الوظيفي؟"
        />
      </div>
    </div>
  );
};

export default JobTitlesEditor;
