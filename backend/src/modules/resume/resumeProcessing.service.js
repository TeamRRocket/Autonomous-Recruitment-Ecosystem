import fs from 'fs/promises';
import path from 'path';
import AppError from '../../utils/AppError.js';
import { scoreResume } from '../../services/ai.service.js';
import { pool } from '../../config/db.js';

const resumesDir = path.join(process.cwd(), 'uploads', 'resumes');

const loadResumeFile = async (fileName) => {
  if (!fileName) return null;
  const filePath = path.join(resumesDir, fileName);
  try {
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
};

const _validateScorePayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new AppError('Invalid AI response', 502);
  }

  const scores = payload.matching_scores;
  if (!scores || typeof scores !== 'object') {
    throw new AppError('Invalid AI response: missing matching_scores', 502);
  }

  const overall = scores.overall_resume_score;
  if (overall === null || overall === undefined || Number.isNaN(Number(overall))) {
    throw new AppError('Invalid AI response: missing overall_resume_score', 502);
  }
};

export const processApplicationResume = async ({ applicationId }) => {
  const appRes = await pool.query(
    `SELECT a.id, a.job_id, a.resume_file_path, j.description AS job_description, j.requirements
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     WHERE a.id = $1`,
    [applicationId]
  );

  if (appRes.rows.length === 0) {
    throw new AppError('Application not found', 404);
  }

  const application = appRes.rows[0];

  const fileBytes = await loadResumeFile(application.resume_file_path);
  if (!fileBytes) {
    await pool.query(
      `UPDATE applications
       SET resume_score = NULL,
           resume_data = NULL,
           resume_summary = NULL,
           resume_score_breakdown = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [applicationId]
    );
    return;
  }

  const aiPayload = {
    job_description: application.job_description,
    required_skills: application.requirements || [],
    resume_file_base64: fileBytes.toString('base64'),
    resume_filename: application.resume_file_path,
  };

  const aiResponse = await scoreResume(aiPayload);
  _validateScorePayload(aiResponse);

  const scores = aiResponse.matching_scores || {};
  const resumeScore = Math.round(Number(scores.overall_resume_score));

  await pool.query(
    `UPDATE applications
     SET resume_score = $2,
         resume_data = $3,
         resume_summary = $4,
         resume_score_breakdown = $5,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [
      applicationId,
      resumeScore,
      JSON.stringify(aiResponse),
      aiResponse.professional_summary || null,
      JSON.stringify({
        skill_match_score: scores.skill_match_score ?? null,
        experience_relevance_score: scores.experience_relevance_score ?? null,
        education_relevance_score: scores.education_relevance_score ?? null,
      }),
    ]
  );
};
