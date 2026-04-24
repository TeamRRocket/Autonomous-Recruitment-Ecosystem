const fs = require('fs');

const FILE_PATH = 'backend/src/modules/resume/resumeRanking.service.js';
let content = fs.readFileSync(FILE_PATH, 'utf-8');

const OLD_APPS_RES = `const appsRes = await pool.query(
    \`SELECT id, candidate_id, resume_score, resume_summary
     FROM applications
     WHERE job_id = $1
       AND resume_score IS NOT NULL\`,
    [jobId]
  );`;

const NEW_APPS_RES = `// 0. Fetch Job Details
  const jobRes = await pool.query('SELECT title, description, requirements FROM jobs WHERE id = $1', [jobId]);
  const jobDetails = jobRes.rows[0] || {};
  const jobDescriptionString = (jobDetails.title || '') + " " + (jobDetails.description || '') + " " + (jobDetails.requirements ? JSON.stringify(jobDetails.requirements) : '');

  // 1. Fetch all candidates with ANY score (resume is base)
  const appsRes = await pool.query(
    \`SELECT a.id, a.candidate_id, a.resume_score, a.resume_summary, c.full_name AS candidate_name
     FROM applications a
     LEFT JOIN candidate_profiles c ON c.id = a.candidate_id
     WHERE a.job_id = $1
       AND a.resume_score IS NOT NULL\`,
    [jobId]
  );`;

if(content.includes(OLD_APPS_RES)) {
    content = content.replace(OLD_APPS_RES, NEW_APPS_RES);
    content = content.replace(/"General software development \/ evaluation"/g, "jobDescriptionString");
    fs.writeFileSync(FILE_PATH, content);
}
