import { pool } from '../../config/db.js';
import AppError from '../../utils/AppError.js';

export const rankJobApplications = async (jobId) => {
  if (!jobId) {
    throw new AppError('jobId is required', 400);
  }

  const appsRes = await pool.query(
    `SELECT id
     FROM applications
     WHERE job_id = $1
       AND stage = 'applied'
       AND resume_score IS NOT NULL
     ORDER BY resume_score DESC, created_at ASC, id ASC`,
    [jobId]
  );

  const appIds = appsRes.rows.map((r) => r.id);
  if (appIds.length === 0) {
    return { job_id: jobId, ranked_count: 0 };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (let i = 0; i < appIds.length; i += 1) {
      const rank = i + 1;
      await client.query(
        `UPDATE applications
         SET rank = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [appIds[i], rank]
      );
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  return { job_id: jobId, ranked_count: appIds.length };
};
