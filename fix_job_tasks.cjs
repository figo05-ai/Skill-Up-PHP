const fs = require('fs');

const configTasks = fs.readFileSync('../config/jobTasks.js', 'utf8');

const normalizeHelper = `const normalizeText = (text) => text ? text.replace(/[ً-ٟ]/g, '').trim().toLowerCase() : '';\n\n`;

const esModuleContent = configTasks.replace('module.exports = JOB_TITLE_TASKS;', `
const NORMALIZED_JOB_TITLE_TASKS = Object.keys(JOB_TITLE_TASKS).reduce((acc, key) => {
  acc[normalizeText(key)] = JOB_TITLE_TASKS[key];
  return acc;
}, {});

export { JOB_TITLE_TASKS, NORMALIZED_JOB_TITLE_TASKS };
`);

fs.writeFileSync('resources/js/constants/jobTasks.js', normalizeHelper + esModuleContent);

console.log('Fixed jobTasks.js');
