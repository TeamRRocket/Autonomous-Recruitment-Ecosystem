import fs from 'fs/promises';
import path from 'path';
import { pool } from '../config/db.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { rankResumes } from '../services/ai.service.js';

const resumesDir = path.join(process.cwd(), 'uploads', 'resumes');

const loadResumeFile = async (fileName) => {
  if (!fileName) {
    return null;
  }
  const filePath = path.join(resumesDir, fileName);
  try {
    return await fs.readFile(filePath);
  } catch (error) {
    return null;
  }
};

export const rankCandidates = catchAsync(async (req, res, next) => {
  const recruiterUserId = req.user.id;
  const { jobId } = req.params;

  const jobResult = await pool.query(
    `SELECT j.id, j.title, j.description, j.requirements
     FROM jobs j
     JOIN recruiters r ON j.recruiter_id = r.id
     WHERE j.id = $1 AND r.user_id = $2`,
    [jobId, recruiterUserId]
  );

  if (jobResult.rows.length === 0) {
    return next(new AppError('Job not found or access denied', 404));
  }

  const job = jobResult.rows[0];

  const applicantsResult = await pool.query(
    `SELECT a.candidate_id, cp.full_name, COALESCE(r.file_url, a.resume_file_path) AS resume_file
     FROM applications a
     JOIN candidate_profiles cp ON a.candidate_id = cp.id
     LEFT JOIN resumes r ON r.candidate_id = cp.id
     WHERE a.job_id = $1`,
    [jobId]
  );

  const applicants = applicantsResult.rows;
  if (applicants.length === 0) {
    return res.json({ status: 'success', data: { job_id: job.id, ranked_candidates: [] } });
  }

  const candidatesForAi = [];
  const candidatesMissingResume = [];
  for (const applicant of applicants) {
    const fileBytes = await loadResumeFile(applicant.resume_file);
    if (!fileBytes) {
      candidatesMissingResume.push({
        candidate_id: applicant.candidate_id,
        name: applicant.full_name,
      });
      continue;
    }

    candidatesForAi.push({
      candidate_id: applicant.candidate_id,
      resume_file_base64: fileBytes.toString('base64'),
      resume_filename: applicant.resume_file,
    });
  }

  let rankedCandidates = [];
  if (candidatesForAi.length > 0) {
    const aiPayload = {
      job_id: job.id,
      job_title: job.title,
      job_description: job.description,
      required_skills: job.requirements || [],
      candidates: candidatesForAi,
    };

    const aiResponse = await rankResumes(aiPayload);

    const nameLookup = new Map(applicants.map((item) => [item.candidate_id, item.full_name]));
    rankedCandidates = (aiResponse.ranked_candidates || []).map((candidate) => ({
      ...candidate,
      name: nameLookup.get(candidate.candidate_id) || 'Unknown',
    }));
  }

  const zeroBreakdown = {
    skills: 0,
    experience: 0,
    projects: 0,
    education: 0,
    soft_skills: 0,
  };

  for (const missing of candidatesMissingResume) {
    rankedCandidates.push({
      candidate_id: missing.candidate_id,
      name: missing.name || 'Unknown',
      final_score: 0,
      score_breakdown: zeroBreakdown,
      strengths: [],
      gaps: ['Resume not uploaded'],
    });
  }

  rankedCandidates.sort((a, b) => (b.final_score || 0) - (a.final_score || 0));

  const insertValues = rankedCandidates.map((candidate) => [
    job.id,
    candidate.candidate_id,
    candidate.final_score,
    JSON.stringify(candidate.score_breakdown || {}),
    JSON.stringify(candidate.strengths || []),
    JSON.stringify(candidate.gaps || []),
  ]);

  if (insertValues.length > 0) {
    const valuePlaceholders = insertValues
      .map((_, idx) => {
        const base = idx * 6;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
      })
      .join(', ');

    const flatValues = insertValues.flat();

    await pool.query(
      `INSERT INTO resume_scores (job_id, candidate_id, final_score, score_breakdown, strengths, gaps)
       VALUES ${valuePlaceholders}`,
      flatValues
    );
  }

  res.json({
    status: 'success',
    data: {
      job_id: job.id,
      ranked_candidates: rankedCandidates,
    },
  });
});
