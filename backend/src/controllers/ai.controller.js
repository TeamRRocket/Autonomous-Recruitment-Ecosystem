import { pool } from '../config/db.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { rankJobApplications } from '../modules/resume/resumeRanking.service.js';

export const rankCandidates = catchAsync(async (req, res, next) => {
  const recruiterUserId = req.user.id;
  const { jobId } = req.params;

  const jobResult = await pool.query(
    `SELECT j.id, j.title, j.status, j.description, j.requirements
     FROM jobs j
     JOIN recruiters r ON j.recruiter_id = r.id
     WHERE j.id = $1 AND r.user_id = $2`,
    [jobId, recruiterUserId]
  );

  if (jobResult.rows.length === 0) {
    return next(new AppError('Job not found or access denied', 404));
  }

  const job = jobResult.rows[0];

  // Allow ranking for PUBLISHED or CLOSED jobs
  if (job.status !== 'PUBLISHED' && job.status !== 'CLOSED') {
    return next(new AppError('Ranking is only available for published or closed jobs', 400));
  }

  // Trigger ranking calculation based on resume scores
  await rankJobApplications(jobId);

  // Fetch ranked results
  const rankedRes = await pool.query(
    `SELECT a.candidate_id,
            cp.full_name AS name,
            a.resume_score,
            a.rank,
            a.resume_score_breakdown,
            a.resume_summary,
            a.total_score,
            a.overall_summary AS summary,
            a.strengths,
            a.gaps
     FROM applications a
     JOIN candidate_profiles cp ON a.candidate_id = cp.id
     WHERE a.job_id = $1
       AND a.resume_score IS NOT NULL
       AND a.rank IS NOT NULL
     ORDER BY a.rank ASC`,
    [jobId]
  );

  res.json({
    status: 'success',
    data: {
      job_id: job.id,
      ranked_candidates: rankedRes.rows,
    },
  });
});
