import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const NotFound = () => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      <h1 className="text-6xl font-bold text-emerald-600 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">{t('noData')}</h2>
      <p className="text-gray-500 mb-8">{t('errorPreparingReport')}</p>
      <Link to="/dashboard" className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors">{t('dashboard')}</Link>
    </div>
  );
};

export default NotFound;