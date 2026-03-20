import { pool } from '../../config/db.js';
import AppError from '../../utils/AppError.js';
import { sendRejectionEmail, sendShortlistEmail } from '../communication/emailAutomation.service.js';

export const selectTopCandidates = async ({ jobId, recruiterUserId, topN, nextRound, schedule }) => {
  if (!jobId) throw new AppError('jobId is required', 400);
  if (!recruiterUserId) throw new AppError('recruiterUserId is required', 400);
  if (!topN || Number.isNaN(Number(topN)) || Number(topN) <= 0) throw new AppError('top_n must be a positive number', 400);
  if (!nextRound || !['APTITUDE', 'DSA', 'TECHNICAL', 'INTERVIEW'].includes(nextRound)) throw new AppError('next_round must be APTITUDE, DSA, TECHNICAL, or INTERVIEW', 400);

  const lockFrom = schedule?.lock_from ? new Date(schedule.lock_from) : null;
  if (lockFrom && Number.isNaN(lockFrom.getTime())) {
    throw new AppError('lock_from must be a valid datetime', 400);
  }

  const lockUntil = schedule?.lock_until ? new Date(schedule.lock_until) : null;
  if (lockUntil && Number.isNaN(lockUntil.getTime())) {
    throw new AppError('lock_until must be a valid datetime', 400);
  }

  if (lockFrom && lockUntil && lockFrom > lockUntil) {
    throw new AppError('lock_from must be before lock_until', 400);
  }

  const jobRes = await pool.query(
    `SELECT j.id, j.title, j.status, j.selection_lock_until
     FROM jobs j
     JOIN recruiters r ON j.recruiter_id = r.id
     WHERE j.id = $1 AND r.user_id = $2`,
    [jobId, recruiterUserId]
  );
  if (jobRes.rows.length === 0) throw new AppError('Job not found or access denied', 404);

  const job = jobRes.rows[0];
  if (job.status !== 'CLOSED') {
    throw new AppError('Selection is available only after the job is CLOSED', 400);
  }

  if (job.selection_lock_until && new Date(job.selection_lock_until) > new Date()) {
    throw new AppError('Selection is locked until the configured interview window ends', 400);
  }

  const rankedRes = await pool.query(
    `SELECT a.id AS application_id,
            a.candidate_id,
            a.rank,
            u.email
     FROM applications a
     JOIN candidate_profiles cp ON cp.id = a.candidate_id
     JOIN users u ON u.id = cp.user_id
     WHERE a.job_id = $1
       AND a.stage = 'applied'
       AND a.resume_score IS NOT NULL
       AND a.rank IS NOT NULL
     ORDER BY a.rank ASC`,
    [jobId]
  );

  const ranked = rankedRes.rows;
  if (ranked.length === 0) {
    throw new AppError('No ranked candidates available for selection', 400);
  }

  const shortlisted = ranked.slice(0, Number(topN));
  const rejected = ranked.slice(Number(topN));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (shortlisted.length > 0) {
      const ids = shortlisted.map((r) => r.application_id);
      await client.query(
        `UPDATE applications
         SET stage = 'shortlisted',
             next_round = $2,
             status = 'SHORTLISTED',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ANY($1::uuid[])`,
        [ids, nextRound]
      );
    }

    if (rejected.length > 0) {
      const ids = rejected.map((r) => r.application_id);
      // Remove non-selected candidates completely from this job.
      // We keep shortlist state for selected candidates and delete the rest.
      await client.query(
        `DELETE FROM applications
         WHERE id = ANY($1::uuid[])`,
        [ids]
      );
    }

    if (lockFrom || lockUntil) {
      await client.query(
        `UPDATE jobs
         SET selection_mail_sent_at = CURRENT_TIMESTAMP,
             selection_lock_from = $2,
             selection_lock_until = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [jobId, lockFrom ? lockFrom.toISOString() : null, lockUntil ? lockUntil.toISOString() : null]
      );
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  const isValidEmail = (email) => typeof email === 'string' && email.includes('@');

  const emailJobs = [];
  for (const row of shortlisted) {
    if (!isValidEmail(row.email)) {
      console.error(`Shortlist email skipped: invalid email for application ${row.application_id}:`, row.email);
      continue;
    }

    emailJobs.push(
      sendShortlistEmail({
        email: row.email,
        jobTitle: job.title,
        nextRound,
        date: schedule?.date || '',
        time: schedule?.time || '',
        duration: schedule?.duration || '',
        instructions: schedule?.instructions || '',
      })
    );
  }

  for (const row of rejected) {
    if (!isValidEmail(row.email)) {
      console.error(`Rejection email skipped: invalid email for application ${row.application_id}:`, row.email);
      continue;
    }

    emailJobs.push(sendRejectionEmail({ email: row.email, jobTitle: job.title }));
  }

  const results = await Promise.allSettled(emailJobs);
  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length > 0) {
    console.error(`Some emails failed to send (${failed.length}/${results.length}). Check logs above for recipients.`);
    for (const f of failed) {
      console.error('Email send failure:', f.reason);
    }
  }

  return {
    job_id: job.id,
    shortlisted_count: shortlisted.length,
    rejected_count: rejected.length,
    next_round: nextRound,
    selection_lock_until: lockUntil ? lockUntil.toISOString() : null,
  };
};
