const fs = require('fs');
const content = fs.readFileSync('resources/js/pages/TaskReport.jsx', 'utf8');
const startIndex = content.indexOf('const JOB_TITLE_TASKS = {');
const endIndex = content.indexOf('  acc[normalizeText(key)] = JOB_TITLE_TASKS[key];\n  return acc;\n}, {});') + '  acc[normalizeText(key)] = JOB_TITLE_TASKS[key];\n  return acc;\n}, {});'.length;

let extracted = content.substring(startIndex, endIndex);

// Add normalizeText helper at the top
const header = `const normalizeText = (text) => text ? text.replace(/[\u064B-\u065F]/g, '').trim().toLowerCase() : '';\n\n`;
const footer = `\n\nexport { JOB_TITLE_TASKS, NORMALIZED_JOB_TITLE_TASKS };\n`;

fs.mkdirSync('resources/js/constants', { recursive: true });
fs.writeFileSync('resources/js/constants/jobTasks.js', header + extracted + footer);
console.log('Extraction complete');
