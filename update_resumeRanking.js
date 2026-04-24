const fs = require('fs');

const FILE_PATH = 'backend/src/modules/resume/resumeRanking.service.js';
let content = fs.readFileSync(FILE_PATH, 'utf-8');

// Ensure axios is imported
if (!content.includes("import axios")) {
    content = content.replace("import AppError from '../../utils/AppError.js';", "import AppError from '../../utils/AppError.js';\nimport axios from 'axios';");
}

// Replace the manual summary build with the API call construction
const STR_START = `let summary = "";
    if (cand.resume_summary) {
        summary += cand.resume_summary + " ";
    }
    summary += \`Overall score across all rounds is \${totalScore.toFixed(1)}/100. \`;
    if (strengths.length > 0) summary += \`Notable strengths: \${strengths.map(s => s.toLowerCase()).join(', ')}. \`;
    if (gaps.length > 0) summary += \`Areas for improvement: \${gaps.map(g => g.toLowerCase()).join(', ')}.\`;`;

const STR_REP = `
    const aiPayload = {
        candidate_name: cand.candidate_name || "Candidate",
        job_description: "General software development / evaluation",
        resume_summary: cand.resume_summary || "",
        scores: {
            aptitude: aptitudeMap.has(id) ? aptScore : "N/A",
            dsa: dsaMap.has(id) ? dsaScore : "N/A",
            technical: techMap.has(id) ? techScore : "N/A"
        }
    };
    let summary = "AI generating..."; // We will mutate this right after
    updates.push({
      appId: cand.id,
      total_score: totalScore,
      strengths: JSON.stringify(strengths),
      gaps: JSON.stringify(gaps),
      overall_summary: summary,
      aiPayload
    });
`;

if (content.includes(STR_START)) {
    content = content.replace(STR_START, STR_REP.trim());
    
    // Also we need to execute them before BEGIN
    const DB_BEGIN = `const client = await pool.connect();`;
    
    const DB_AI_BLOCK = `
  // Query AI service in parallel for all candidates
  const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  await Promise.all(updates.map(async (u) => {
     try {
         const res = await axios.post(\`\${AI_URL}/ai/resume/performance-summary\`, u.aiPayload);
         u.overall_summary = res.data.summary;
     } catch (err) {
         console.error("Failed to generate AI performance summary for app", u.appId, err.message);
         u.overall_summary = "AI Evaluation unavailable. Total Score: " + u.total_score.toFixed(1);
     }
  }));

  const client = await pool.connect();`;
  
    content = content.replace(DB_BEGIN, DB_AI_BLOCK);
}

// Remove the old updates.push logic that didn't have aiPayload
const OLD_PUSH = `updates.push({
      appId: cand.id,
      total_score: totalScore,
      strengths: JSON.stringify(strengths),
      gaps: JSON.stringify(gaps),
      overall_summary: summary
    });`;

if(content.includes(OLD_PUSH)) {
    content = content.replace(OLD_PUSH, "");
}

fs.writeFileSync(FILE_PATH, content);
