import { pool } from '../config/db.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const uploadResume = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  if (!req.file) {
    return next(new AppError('Resume file is required', 400));
  }

  const candidateResult = await pool.query(
    'SELECT id FROM candidate_profiles WHERE user_id = $1',
    [userId]
  );

  if (candidateResult.rows.length === 0) {
    return next(new AppError('Candidate profile not found', 404));
  }

  const candidateId = candidateResult.rows[0].id;
  const fileUrl = req.file.filename;

  const existing = await pool.query(
    'SELECT id FROM resumes WHERE candidate_id = $1',
    [candidateId]
  );

  let resumeId;
  if (existing.rows.length > 0) {
    const updateResult = await pool.query(
      `UPDATE resumes
       SET file_url = $1, parsed = FALSE, created_at = CURRENT_TIMESTAMP
       WHERE candidate_id = $2
       RETURNING id`,
      [fileUrl, candidateId]
    );
    resumeId = updateResult.rows[0].id;
  } else {
    const insertResult = await pool.query(
      `INSERT INTO resumes (candidate_id, file_url, parsed)
       VALUES ($1, $2, FALSE)
       RETURNING id`,
      [candidateId, fileUrl]
    );
    resumeId = insertResult.rows[0].id;
  }

  res.status(201).json({
    status: 'success',
    data: { resume_id: resumeId },
  });
});
