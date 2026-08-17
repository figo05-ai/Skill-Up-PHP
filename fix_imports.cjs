const fs = require('fs');

// 1. TaskReport.jsx
let content = fs.readFileSync('resources/js/pages/TaskReport.jsx', 'utf8');
const startIndex = content.indexOf('const JOB_TITLE_TASKS = {');
const endIndex = content.indexOf('  acc[normalizeText(key)] = JOB_TITLE_TASKS[key];\n  return acc;\n}, {});') + '  acc[normalizeText(key)] = JOB_TITLE_TASKS[key];\n  return acc;\n}, {});'.length;

let newContent = content.substring(0, startIndex) + 
                 "import { JOB_TITLE_TASKS, NORMALIZED_JOB_TITLE_TASKS } from '../constants/jobTasks';\n" + 
                 content.substring(endIndex);
fs.writeFileSync('resources/js/pages/TaskReport.jsx', newContent);

// 2. reportHtmlGenerator.js
let genContent = fs.readFileSync('resources/js/utils/reportHtmlGenerator.js', 'utf8');
genContent = "import { NORMALIZED_JOB_TITLE_TASKS } from '../constants/jobTasks';\n" + genContent;
// Remove it from the function parameters
genContent = genContent.replace(', NORMALIZED_JOB_TITLE_TASKS = {}', '');
fs.writeFileSync('resources/js/utils/reportHtmlGenerator.js', genContent);

// 3. CompanyDetails.jsx
let comContent = fs.readFileSync('resources/js/pages/CompanyDetails.jsx', 'utf8');
comContent = comContent.replace('window.NORMALIZED_JOB_TITLE_TASKS || {}', '');
// The above will leave a trailing comma which might cause syntax error, let's fix it properly.
comContent = comContent.replace(/,\s*window\.NORMALIZED_JOB_TITLE_TASKS\s*\|\|\s*\{\}\s*\)/, ')');
fs.writeFileSync('resources/js/pages/CompanyDetails.jsx', comContent);

console.log('Fixed imports');
