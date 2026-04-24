import { pool } from '../../config/db.js';
import AppError from '../../utils/AppError.js';
import axios from 'axios';

export const rankJobApplications = async (jobId) => {
  if (!jobId) {
    throw new AppError('jobId is required', 400);
  }

  // 1. Fetch all candidates with ANY score (resume is base)
  // 0. Fetch Job Details
  const jobRes = await pool.query('SELECT title, description, requirements FROM jobs WHERE id = $1', [jobId]);
  const jobDetails = jobRes.rows[0] || {};
  const jobDescriptionString = (jobDetails.title || '') + " " + (jobDetails.description || '') + " " + (jobDetails.requirements ? JSON.stringify(jobDetails.requirements) : '');

  // 1. Fetch all candidates with ANY score (resume is base)
  const appsRes = await pool.query(
    `SELECT a.id, a.candidate_id, a.resume_score, a.resume_summary, c.full_name AS candidate_name
     FROM applications a
     LEFT JOIN candidate_profiles c ON c.id = a.candidate_id
     WHERE a.job_id = $1
       AND a.resume_score IS NOT NULL`,
    [jobId]
  );

  const candidates = appsRes.rows;
  if (candidates.length === 0) {
    return { job_id: jobId, ranked_count: 0 };
  }

  const candidateIds = candidates.map((r) => r.candidate_id);

  // 2. Fetch all scores in parallel
  const [aptitudeRes, dsaRes, technicalRes, codingRes] = await Promise.all([
    pool.query(`
            SELECT a.candidate_id, a.score, 
                   COUNT(r.question_id)::int AS total_questions,
                   SUM(CASE WHEN r.selected_option = q.correct_option THEN 1 ELSE 0 END)::int AS correct_questions,
                   a.status
            FROM candidate_aptitude_attempts a
            LEFT JOIN candidate_aptitude_responses r ON r.attempt_id = a.id
            LEFT JOIN aptitude_questions q ON q.id = r.question_id
            WHERE a.job_id = $1 AND a.candidate_id = ANY($2::uuid[]) AND a.status IN ('submitted', 'expired')
            GROUP BY a.candidate_id, a.score, a.status
        `, [jobId, candidateIds]),
    pool.query(`
            SELECT candidate_id, final_score 
            FROM dsa_round_attempts 
            WHERE job_id = $1 AND candidate_id = ANY($2::uuid[]) AND status IN ('SUBMITTED', 'EXPIRED')
        `, [jobId, candidateIds]),
    pool.query(`
            SELECT candidate_id, final_score 
            FROM technical_interview_attempts 
            WHERE job_id = $1 AND candidate_id = ANY($2::uuid[]) AND status IN ('SUBMITTED', 'EXPIRED')
        `, [jobId, candidateIds]),
    pool.query(`
            SELECT cs.candidate_id, cs.passed_tests, cs.total_tests, cp.round_id
            FROM coding_submissions cs
            JOIN coding_problems cp ON cp.id = cs.problem_id
            JOIN interview_rounds ir ON ir.id = cp.round_id
            WHERE ir.job_id = $1 AND cs.candidate_id = ANY($2::uuid[])
        `, [jobId, candidateIds])
  ]);

  const aptitudeMap = new Map(aptitudeRes.rows.map(r => {
    let score = Number(r.score) || 0;
    if (r.total_questions > 0) {
      score = (r.correct_questions / r.total_questions) * 100;
    }
    return [r.candidate_id, score];
  }));
  const dsaMap = new Map(dsaRes.rows.map(r => [r.candidate_id, r.final_score]));
  const techMap = new Map(technicalRes.rows.map(r => [r.candidate_id, r.final_score]));

  const codingMap = new Map();
  codingRes.rows.forEach((row) => {
    if (!codingMap.has(row.candidate_id)) codingMap.set(row.candidate_id, []);
    const score = row.total_tests > 0 ? (row.passed_tests / row.total_tests) * 100 : 0;
    codingMap.get(row.candidate_id).push(score);
  });

  // 3. Calculate metrics and generate insights
  const updates = [];

  for (const cand of candidates) {
    const id = cand.candidate_id;
    const resumeScore = Number(cand.resume_score) || 0;
    const aptScore = Number(aptitudeMap.get(id)) || 0;
    const dsaScore = Number(dsaMap.get(id)) || 0;
    const techScore = Number(techMap.get(id)) || 0;

    const codingScores = codingMap.get(id) || [];
    const codingAvg = codingScores.length > 0
      ? codingScores.reduce((a, b) => a + b, 0) / codingScores.length
      : 0;

    let sum = resumeScore;
    let count = 1;

    if (aptitudeMap.has(id)) { sum += aptScore; count++; }
    if (dsaMap.has(id)) { sum += dsaScore; count++; }
    if (techMap.has(id)) { sum += techScore; count++; } // Use techScore from map
    if (codingMap.has(id)) { sum += codingAvg; count++; }

    const totalScore = sum / count;

    // Insights Generation
    const strengths = [];
    const gaps = [];

    if (resumeScore >= 80) strengths.push("Strong Resume Profile");
    if (aptScore >= 80) strengths.push("Excellent Aptitude");
    if (dsaScore >= 80) strengths.push("Strong DSA Skills");
    if (techScore >= 80) strengths.push("High Technical Proficiency");
    if (codingAvg >= 80) strengths.push("Good Coding Skills");

    if (resumeScore < 50) gaps.push("Resume needs improvement");
    if (aptitudeMap.has(id) && aptScore < 50) gaps.push("Low Aptitude Score");
    if (dsaMap.has(id) && dsaScore < 50) gaps.push("Weak in DSA");
    if (techMap.has(id) && techScore < 50) gaps.push("Technical Interview Gaps");
    if (codingMap.has(id) && codingAvg < 50) gaps.push("Coding Proficiency Gaps");

    if (strengths.length === 0 && totalScore > 60) strengths.push("Consistent Performance");
    if (strengths.length === 0 && totalScore <= 60) strengths.push("Developing Potential");

    const aiPayload = {
        candidate_name: cand.candidate_name || "Candidate",
        job_description: jobDescriptionString,
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

    
  }

  // 4. Sort and Update
  updates.sort((a, b) => b.total_score - a.total_score);

  
  // Query AI service in parallel for all candidates
  const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  await Promise.all(updates.map(async (u) => {
     try {
         const res = await axios.post(`${AI_URL}/ai/resume/performance-summary`, u.aiPayload);
         u.overall_summary = res.data.summary;
     } catch (err) {
         console.error("Failed to generate AI performance summary for app", u.appId, err.message);
         u.overall_summary = "AI Evaluation unavailable. Total Score: " + u.total_score.toFixed(1);
     }
  }));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < updates.length; i++) {
        const u = updates[i];
        const rank = i + 1;
        await client.query(
            `UPDATE applications 
             SET rank = $2, 
                 total_score = $3, 
                 strengths = $4, 
                 gaps = $5, 
                 overall_summary = $6, 
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [u.appId, rank, u.total_score, u.strengths, u.gaps, u.overall_summary]
        );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  return { job_id: jobId, ranked_count: candidates.length };
};
