import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, message }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
        <div className="p-5 border-b bg-red-50 border-red-100 flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="font-bold text-xl text-red-800 text-center">
            {t('confirmDelete') || 'هل أنت متأكد من الحذف؟'}
          </h3>
        </div>
        <div className="p-6 text-center bg-white">
          <p className="text-gray-600 font-medium leading-relaxed">
            {message || 'هل تريد بالتأكيد الاستمرار؟ لا يمكن التراجع عن هذا الإجراء.'}
          </p>
        </div>
        <div className="p-4 bg-gray-50 flex justify-center gap-3 border-t">
          <button 
            onClick={onConfirm} 
            className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-bold shadow-sm"
          >
            {t('delete') || 'نعم، احذف'}
          </button>
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors font-medium shadow-sm"
          >
            {t('cancel') || 'إلغاء الأمر'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
