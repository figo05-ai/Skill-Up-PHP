import fs from 'fs';
import { JOB_TITLE_TASKS } from './resources/js/constants/jobTasks.js';

const sqlLines = [];
sqlLines.push("SET NAMES utf8mb4;");
sqlLines.push("TRUNCATE TABLE job_titles;");

let id = 1;
for (const [title, tasks] of Object.entries(JOB_TITLE_TASKS)) {
    let tasksJson;
    try {
        tasksJson = JSON.stringify(tasks).replace(/\\/g, '\\\\').replace(/'/g, "''");
    } catch(e) {
        console.log('Failed on title:', title, 'tasks:', tasks);
        continue;
    }
    if (!tasksJson) {
        console.log('tasksJson is undefined for title:', title);
        continue;
    }
    const escapedTitle = title.replace(/'/g, "''");
    sqlLines.push(`INSERT INTO job_titles (id, title, tasks, created_at, updated_at) VALUES (${id}, '${escapedTitle}', '${tasksJson}', NOW(), NOW());`);
    id++;
}

fs.writeFileSync('seed_job_titles.sql', sqlLines.join('\n'));
console.log('Created seed_job_titles.sql');
