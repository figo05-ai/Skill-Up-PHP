import React, { useState } from 'react';
import api from '../api/axios';
import ClientSelect from '../components/ClientSelect';
import JSZip from 'jszip';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { createRoot } from 'react-dom/client';
import ReportTemplate from '../components/ReportTemplate';
import { useLanguage } from '../context/LanguageContext';

const MonthlyReports = () => {
  const { t, language } = useLanguage();
  const [reportType, setReportType] = useState('attendance');
  const [clientId, setClientId] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPassword, setSenderPassword] = useState('');

  const reportTypes = [
    { value: 'attendance', label: t('attendanceReports') },
    { value: 'detailed_attendance', label: t('detailedAttendance') },
    { value: 'tasks', label: t('taskReports') },
    { value: 'performance', label: t('employeePerformance') },
  ];

  const handleSend = async () => {
    if (!clientId) {
      alert(t('selectClientFirst'));
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      // إرسال طلب للباك إند لإرسال التقرير
      await api.post('/reports/send-email', {
        reportType,
        clientId,
        year,
        month,
        senderEmail,
        senderPassword
      });
      setMessage({ type: 'success', text: t('emailSentSuccess') });
    } catch (err) {
      console.error(err);
      let msg = err.response?.data?.message || err.message || t('emailSentError');
      if (err.response && err.response.status === 404) {
        msg = language === 'ar' ? 'عذراً، خدمة الإرسال غير مبرمجة في السيرفر (404).' : 'Service endpoint not found (404). Backend implementation missing.';
      }
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const [zipLoading, setZipLoading] = useState(false);

  const handleDownloadZip = async () => {
    if (!clientId) {
      alert(t('selectClientFirst') || 'الرجاء اختيار الشركة أولاً');
      return;
    }

    setZipLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const types = ['attendance', 'detailed_attendance', 'tasks', 'performance'];
      const typeNames = {
        'attendance': 'الحضور',
        'detailed_attendance': 'تفاصيل_الحضور',
        'tasks': 'المهام',
        'performance': 'الأداء'
      };

      for (const type of types) {
        const response = await api.post('/reports/download-all-zip', {
          clientId,
          year,
          month,
          type
        }, {
          responseType: 'blob'
        });

        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `تقرير_${typeNames[type]}_${month}_${year}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        // Small delay between downloads to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setMessage({ type: 'success', text: language === 'ar' ? 'تم تنزيل التقارير الأربعة بنجاح!' : 'All 4 reports downloaded successfully!' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: language === 'ar' ? 'حدث خطأ أثناء تنزيل التقارير' : 'Failed to download reports' });
    } finally {
      setZipLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('monthlyReports')}</h1>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        
        {/* ZIP Download Section Header */}
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
          <h2 className="text-lg font-bold text-emerald-800 mb-1">📦 تحميل الحزمة الكاملة للتقارير (ZIP)</h2>
          <p className="text-xs text-emerald-600">يحتوي ملف الـ ZIP على 4 تقارير PDF مستقلة (تقارير الحضور - تفاصيل الحضور - تقارير المهام - أداء الموظفين)</p>
        </div>

        {/* Client Select */}
        <div>
           <ClientSelect value={clientId} onChange={setClientId} />
        </div>

        {/* Date Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">{t('year')}</label>
            <input 
              type="number" 
              value={year} 
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">{t('month')}</label>
            <select 
              value={month} 
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Primary ZIP Action Button */}
        <button 
          onClick={handleDownloadZip} 
          disabled={zipLoading || loading}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-4 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
        >
          {zipLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {language === 'ar' ? 'جاري تجميع التقارير الـ 4 في ملف ZIP...' : 'Generating 4 PDF Reports in ZIP...'}
            </>
          ) : (
            <>
              <span>📦</span>
              <span>{language === 'ar' ? 'تحميل جميع التقارير الـ 4 في ملف مضغوط (ZIP)' : 'Download All 4 Reports in ZIP'}</span>
            </>
          )}
        </button>

        <hr className="my-6 border-gray-200" />

        {/* Email Single Report Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-700 mb-2">✉️ أو إرسال تقرير فردي بالبريد الإلكتروني:</h3>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">{t('reportType')}</label>
            <select 
              value={reportType} 
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            >
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
            <div>
              <label className="block font-medium mb-1 text-gray-600">{t('senderEmail')}</label>
              <input 
                type="email" 
                value={senderEmail} 
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-600">{t('senderPassword')}</label>
              <input 
                type="password" 
                value={senderPassword} 
                onChange={(e) => setSenderPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <button 
            onClick={handleSend} 
            disabled={loading || zipLoading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all shadow disabled:opacity-50 text-sm"
          >
            {loading ? t('sending') : t('sendReportViaEmail')}
          </button>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl text-center font-medium text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyReports;