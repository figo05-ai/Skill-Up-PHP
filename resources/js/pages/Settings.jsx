import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import * as XLSX from 'xlsx';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { t, language } = useLanguage();
  
  const [name, setName] = useState(user?.name || '');
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState({});
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [userLogs, setUserLogs] = useState([]);
  const [selectedLogUser, setSelectedLogUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', password: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, isBulk: false });

  const canDeleteUsers = ['Alama@gmail.com', 'admin@example.com', 'ff@gmail.com'].includes(user?.email);
  const canViewEmails = ['Alama@gmail.com', 'admin@example.com', 'ff@gmail.com'].includes(user?.email);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/auth/users');
      // إخفاء حساب admin@example.com و ff@gmail.com تماماً
      setUsersList(Array.isArray(res.data) ? res.data.filter(u => u.email !== 'admin@example.com' && u.email !== 'ff@gmail.com') : []);
    } catch (err) {
      console.error("Failed to fetch users", err);
      let msg = t('errorFetchingUsers');
      if (err.message === 'Network Error' && !err.response) {
        msg = t('networkError');
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.response) {
        msg = `${t('errorFetchingUsers')} (Code: ${err.response.status})`;
      }
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') fetchUsers();
  }, [user?.role]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      // يفترض وجود endpoint لتحديث البيانات
      await api.put('/auth/updatedetails', { name }); 
      setMessage({ type: 'success', text: t('successUpdate') });
      if (updateUser) updateUser({ name });
    } catch (err) {
      console.error(err);
      let msg = 'Error updating profile';
      if (err.response?.data?.message) msg = err.response.data.message;
      else if (err.response?.data?.errors) msg = err.response.data.errors.map(e => e.msg).join(', ');
      setMessage({ type: 'error', text: msg });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      setMessage({ type: 'error', text: t('passwordsDoNotMatch') });
      return;
    }
    try {
      // يفترض وجود endpoint لتحديث كلمة المرور
      await api.put('/auth/updatepassword', { 
        currentPassword: passwordData.current,
        newPassword: passwordData.new 
      });
      setMessage({ type: 'success', text: t('successUpdate') });
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (err) {
      console.error(err);
      let msg = 'Error updating password';
      if (err.response?.data?.message) msg = err.response.data.message;
      else if (err.response?.data?.errors) msg = err.response.data.errors.map(e => e.msg).join(', ');
      setMessage({ type: 'error', text: msg });
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      setMessage({ type: 'error', text: t('invalidEmail') });
      return;
    }

    if (usersList.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
      setMessage({ type: 'error', text: t('emailDuplicate') });
      return;
    }

    try {
      // يفترض وجود endpoint لإنشاء مستخدم جديد (تسجيل)
      await api.post('/auth/register', newUser); 
      setMessage({ type: 'success', text: t('successCreate') });
      setNewUser({ name: '', email: '', password: '', role: 'admin' });
      fetchUsers(); // تحديث القائمة بعد الإضافة
    } catch (err) {
      console.error(err);
      let msg = 'Error creating user';
      if (err.response?.data?.message) msg = err.response.data.message;
      else if (err.response?.data?.errors) msg = err.response.data.errors.map(e => e.msg).join(', ');
      setMessage({ type: 'error', text: msg });
    }
  };

  const handleDeleteUser = (id) => {
    setDeleteConfirm({ show: true, id, isBulk: false });
  };

  const handleCheckboxChange = (id) => {
    setSelectedUsers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const all = {};
      const currentUserId = user._id || user.id;
      usersList.forEach(u => {
        // عدم تحديد الحساب الحالي
        if ((u._id || u.id) !== currentUserId) {
          all[u._id || u.id] = true;
        }
      });
      setSelectedUsers(all);
    } else {
      setSelectedUsers({});
    }
  };

  const handleBulkDelete = () => {
    const ids = Object.keys(selectedUsers).filter(k => selectedUsers[k]);
    if (ids.length === 0) return;
    setDeleteConfirm({ show: true, id: null, isBulk: true });
  };

  const executeDeleteConfirm = async () => {
    if (deleteConfirm.isBulk) {
      const ids = Object.keys(selectedUsers).filter(k => selectedUsers[k]);
      setDeleteConfirm({ show: false, id: null, isBulk: false });
      try {
        await Promise.all(ids.map(id => api.delete(`/auth/users/${id}`)));
        setMessage({ type: 'success', text: t('successUpdate') });
        setSelectedUsers({});
        fetchUsers();
      } catch (err) {
        console.error(err);
        setMessage({ type: 'error', text: t('errorDeletingUser') });
      }
    } else {
      const id = deleteConfirm.id;
      setDeleteConfirm({ show: false, id: null, isBulk: false });
      try {
        await api.delete(`/auth/users/${id}`);
        setMessage({ type: 'success', text: t('successUpdate') });
        fetchUsers();
      } catch (err) {
        console.error(err);
        let msg = t('errorDeletingUser');
        if (err.message === 'Network Error' && !err.response) {
          msg = t('networkError');
        } else if (err.response?.data?.message) msg = err.response.data.message;
        setMessage({ type: 'error', text: msg });
      }
    }
  };

  const handleViewLogs = async (targetUser) => {
    setSelectedLogUser(targetUser);
    setShowLogsModal(true);
    setUserLogs([]);
    try {
      const res = await api.get(`/auth/users/${targetUser._id || targetUser.id}/logs`);
      setUserLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportLogs = () => {
    if (!userLogs || userLogs.length === 0) return;
    
    const data = userLogs.map(log => ({
      [t('action')]: log.action,
      [t('details')]: log.details,
      [t('date')]: new Date(log.createdAt).toLocaleString()
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Logs");
    XLSX.writeFile(wb, `Logs_${selectedLogUser?.name || 'User'}.xlsx`);
  };

  const handleEditUser = (targetUser) => {
    setEditingUser(targetUser);
    setEditForm({
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      password: '' // كلمة المرور فارغة افتراضياً
    });
  };

  const handleSaveUserChanges = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...editForm };
      if (!payload.password) delete payload.password; // لا ترسل كلمة المرور إذا كانت فارغة
      
      await api.put(`/employees/${editingUser._id || editingUser.id}`, payload);
      setMessage({ type: 'success', text: t('successUpdate') });
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
      let msg = 'Error updating user';
      if (err.response?.data?.message) msg = err.response.data.message;
      setMessage({ type: 'error', text: msg });
    }
  };

  const handleToggleUserStatus = async (targetUser) => {
    if ((targetUser._id || targetUser.id) === (user._id || user.id)) {
      setMessage({ type: 'error', text: t('cannotDisableSelf') });
      return;
    }

    const newStatus = !targetUser.allowLogin;
    try {
      await api.put(`/employees/${targetUser._id || targetUser.id}`, { allowLogin: newStatus });
      setMessage({ type: 'success', text: t('successUpdate') });
      fetchUsers();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error updating user status' });
    }
  };

  const filteredUsers = usersList.filter(u => 
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('settings')}</h1>
        <p className="text-gray-500 mt-1 text-sm">{language === 'ar' ? 'إدارة إعدادات النظام وحسابك الشخصي والمستخدمين' : 'Manage system settings, your profile, and users'}</p>
      </div>
      
      {message.text && (
        <div className={`p-4 mb-6 rounded-2xl flex items-center gap-3 animate-fadeIn ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* إعدادات الملف الشخصي وتغيير كلمة المرور */}
        <div className="flex flex-col gap-8">
          {/* الملف الشخصي */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">{t('profileSettings')}</h2>
            </div>
            
            <form onSubmit={handleUpdateProfile}>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1.5 text-gray-700">{t('name')}</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" />
              </div>
              <button type="submit" className="w-full flex justify-center items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/30 font-bold active:scale-[0.98]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                {t('updateProfile')}
              </button>
            </form>
          </div>

          {/* تغيير كلمة المرور */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">{t('changePassword')}</h3>
            </div>
            
            <form onSubmit={handleChangePassword}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">{t('currentPassword')}</label>
                  <input type="password" value={passwordData.current} onChange={(e) => setPasswordData({...passwordData, current: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">{t('newPassword')}</label>
                  <input type="password" value={passwordData.new} onChange={(e) => setPasswordData({...passwordData, new: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">{t('confirmNewPassword')}</label>
                  <input type="password" value={passwordData.confirm} onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full flex justify-center items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-xl hover:bg-gray-900 transition-all shadow-lg font-bold active:scale-[0.98]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                {t('changePassword')}
              </button>
            </form>
          </div>
        </div>

        {/* إنشاء مستخدم جديد (للمدير فقط) */}
        {user?.role === 'admin' && (
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 h-fit">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">{t('createNewUser')}</h2>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">{t('name')}</label>
                <input type="text" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">{t('email')}</label>
                <input type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">{t('password')}</label>
                <input type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">{t('role')}</label>
                <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none">
                  <option value="system_user">{t('user')}</option>
                  <option value="admin">{t('admin')}</option>
                </select>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full flex justify-center items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/30 font-bold active:scale-[0.98]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  {t('createUser')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* قائمة المستخدمين */}
      {user?.role === 'admin' && (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">{t('usersList')}</h2>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input 
                  type="text" 
                  placeholder={language === 'ar' ? 'بحث (الاسم، الايميل، الصلاحية)...' : 'Search...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                />
              </div>
              <button onClick={fetchUsers} className="p-2.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors" title={t('refresh')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          
          {loadingUsers ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
               <svg className="animate-spin h-8 w-8 text-emerald-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               <span>{t('loading')}</span>
            </div>
          ) : (
            <div className="overflow-hidden border border-gray-100 rounded-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 text-sm font-semibold">
                      <th className="p-4 border-r border-gray-100 w-12 text-center">
                        {canDeleteUsers && <input 
                          type="checkbox" 
                          onChange={handleSelectAll}
                          checked={usersList.length > 0 && usersList.every(u => {
                            const uId = u._id || u.id;
                            const currentUserId = user._id || user.id;
                            return uId === currentUserId || selectedUsers[uId];
                          })}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />}
                      </th>
                      <th className="p-4 border-r border-gray-100">{t('name')}</th>
                      <th className="p-4 border-r border-gray-100">{t('email')}</th>
                      <th className="p-4 border-r border-gray-100">{t('role')}</th>
                      <th className="p-4 text-center">
                        {Object.values(selectedUsers).filter(Boolean).length > 0 ? (
                          <button onClick={handleBulkDelete} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors inline-flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            {t('delete')} ({Object.values(selectedUsers).filter(Boolean).length})
                          </button>
                        ) : (
                          t('actions')
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? filteredUsers.map((u) => (
                      <tr key={u._id || u.id} className={`border-b border-gray-50 hover:bg-emerald-50/30 transition-colors ${!u.allowLogin ? 'bg-red-50/30' : ''}`}>
                        <td className="p-4 border-r border-gray-100 text-center">
                          {((u._id || u.id) !== (user._id || user.id)) && canDeleteUsers && (
                            <input 
                              type="checkbox" 
                              checked={!!selectedUsers[u._id || u.id]} 
                              onChange={() => handleCheckboxChange(u._id || u.id)} 
                              className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                            />
                          )}
                        </td>
                        <td className="p-4 border-r border-gray-100 font-medium text-gray-900">{u.name}</td>
                        <td className="p-4 border-r border-gray-100 text-gray-600 font-mono text-sm">{canViewEmails ? u.email : '***'}</td>
                        <td className="p-4 border-r border-gray-100">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium ${u.role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                            {u.role === 'admin' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            )}
                            {t(u.role)}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center items-center gap-2">
                            <button 
                              onClick={() => handleToggleUserStatus(u)} 
                              className={`p-2 rounded-lg transition-colors ${u.allowLogin ? 'text-orange-600 hover:bg-orange-50 bg-white border border-gray-100 shadow-sm' : 'text-green-600 hover:bg-green-50 bg-white border border-gray-100 shadow-sm'}`}
                              title={u.allowLogin ? t('disable') : t('enable')}
                            >
                              {u.allowLogin ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                              )}
                            </button>
                            <button onClick={() => handleEditUser(u)} className="text-emerald-600 hover:text-emerald-700 p-2 rounded-lg hover:bg-emerald-50 bg-white border border-gray-100 shadow-sm transition-colors" title={t('edit')}>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                              </svg>
                            </button>
                            <button onClick={() => handleViewLogs(u)} className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 bg-white border border-gray-100 shadow-sm transition-colors" title={t('viewLogs')}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            {((u._id || u.id) !== (user._id || user.id)) && canDeleteUsers && (
                              <button onClick={() => handleDeleteUser(u._id || u.id)} className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-50 bg-white border border-gray-100 shadow-sm" title={t('delete')}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="p-12 text-center text-gray-400">
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
          )}
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">{t('edit')} {t('user')}</h2>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSaveUserChanges} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">{t('name')}</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">{t('email')}</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">{t('role')}</label>
                <select value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none">
                  <option value="system_user">{t('user')}</option>
                  <option value="admin">{t('admin')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">{t('password')}</label>
                <input type="password" value={editForm.password} onChange={(e) => setEditForm({...editForm, password: e.target.value})} placeholder={t('senderPasswordHint')} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingUser(null)} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">{t('close')}</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shadow-lg shadow-emerald-200">{t('saveChanges')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800">
                {t('userOperations')}: <span className="text-emerald-600">{selectedLogUser?.name}</span>
              </h2>
              <button onClick={() => setShowLogsModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-0 overflow-y-auto flex-1">
              {userLogs.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="p-4 border-b text-sm font-semibold text-gray-600">{t('action')}</th>
                      <th className="p-4 border-b text-sm font-semibold text-gray-600">{t('details')}</th>
                      <th className="p-4 border-b text-sm font-semibold text-gray-600">{t('date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userLogs.map(log => (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 text-sm font-medium text-gray-800">{log.action}</td>
                        <td className="p-4 text-sm text-gray-600">{log.details}</td>
                        <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-gray-500">{t('noData')}</div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-2">
              {userLogs.length > 0 && (
                <button onClick={handleExportLogs} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  {t('exportExcel')}
                </button>
              )}
              <button onClick={() => setShowLogsModal(false)} className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors">
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal 
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, id: null, isBulk: false })}
        onConfirm={executeDeleteConfirm}
        message={deleteConfirm.isBulk ? 'هل تريد بالتأكيد حذف جميع المستخدمين المحددين؟ لا يمكن التراجع عن هذا الإجراء.' : t('confirmDeleteUser') || 'هل أنت متأكد من حذف هذا المستخدم؟'}
      />
    </div>
  );
};

export default Settings;