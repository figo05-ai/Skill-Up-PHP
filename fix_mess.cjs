const fs = require('fs');

// Fix jobTasks.js
let jt = fs.readFileSync('resources/js/constants/jobTasks.js', 'utf8');
if (jt.includes('../api/axios')) {
  // It has junk at the top. Let's rebuild it cleanly.
  // Actually I have extract.cjs that worked correctly. Let's just run it again?
  // Wait, I can just clean it up.
  const lines = jt.split('\n');
  const cleanLines = lines.filter(l => l.includes('JOB_TITLE_TASKS') || l.includes('normalizeText') || l.includes('return acc;') || l.includes('}, {});') || l.trim().startsWith('//') || l.trim() === '' || l.includes(': [') || l.includes('",') || l.includes('"]'));
  // This might be risky. Let's just fix the top lines.
  const startIdx = lines.findIndex(l => l.includes('const JOB_TITLE_TASKS = {'));
  const header = `const normalizeText = (text) => text ? text.replace(/[ً-ٟ]/g, '').trim().toLowerCase() : '';\n\n`;
  const footer = `\n\nexport { JOB_TITLE_TASKS, NORMALIZED_JOB_TITLE_TASKS };\n`;
  
  if (startIdx !== -1) {
    fs.writeFileSync('resources/js/constants/jobTasks.js', header + lines.slice(startIdx).join('\n'));
  }
}

// Fix TaskReport.jsx
let tr = fs.readFileSync('resources/js/pages/TaskReport.jsx', 'utf8');
// It seems TaskReport.jsx has duplicated imports. Let's restore the top part.
const topImports = `import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { format, endOfMonth, parseISO, endOfDay, isValid, differenceInMonths, isAfter, addDays } from 'date-fns';
import ClientSelect from '../components/ClientSelect';
import { useLanguage } from '../context/LanguageContext';
import logo from '../assets/logo.jpeg';
import { JOB_TITLE_TASKS, NORMALIZED_JOB_TITLE_TASKS } from '../constants/jobTasks';

`;
const compStart = tr.indexOf('const TaskReport = () => {');
if (compStart !== -1) {
  fs.writeFileSync('resources/js/pages/TaskReport.jsx', topImports + tr.substring(compStart));
}
console.log('Fixed');
