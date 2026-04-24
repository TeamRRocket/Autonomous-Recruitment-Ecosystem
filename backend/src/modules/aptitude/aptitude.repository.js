import { pool } from '../../config/db.js';

const asUuid = (v) => (v || '').toString();

class AptitudeRepository {
  async getCandidateIdByUserId(userId) {
    const res = await pool.query('SELECT id FROM candidate_profiles WHERE user_id = $1', [userId]);
    return res.rows[0]?.id || null;
  }

  async assertCandidateAppliedToJob(jobId, candidateId) {
    const res = await pool.query('SELECT 1 FROM applications WHERE job_id = $1 AND candidate_id = $2', [jobId, candidateId]);
    return res.rows.length > 0;
  }

  async getJobAptitudeConfig(jobId) {
    const res = await pool.query(
      `SELECT id, aptitude_enabled, aptitude_level, aptitude_duration_minutes, aptitude_question_count
       FROM jobs
       WHERE id = $1`,
      [jobId]
    );
    return res.rows[0] || null;
  }

  async getAttemptByJobCandidate(jobId, candidateId) {
    const res = await pool.query(
      `SELECT *
       FROM candidate_aptitude_attempts
       WHERE job_id = $1 AND candidate_id = $2
       LIMIT 1`,
      [jobId, candidateId]
    );
    return res.rows[0] || null;
  }

  async getAttemptByIdForUpdate(client, attemptId) {
    const res = await client.query(
      `SELECT *
       FROM candidate_aptitude_attempts
       WHERE id = $1
       FOR UPDATE`,
      [attemptId]
    );
    return res.rows[0] || null;
  }

  async createAttempt(client, { candidateId, jobId, endsAtIso }) {
    const res = await client.query(
      `INSERT INTO candidate_aptitude_attempts (candidate_id, job_id, ends_at, status)
       VALUES ($1,$2,$3,'started')
       ON CONFLICT (job_id, candidate_id)
       DO UPDATE SET ends_at = candidate_aptitude_attempts.ends_at
       RETURNING *`,
      [candidateId, jobId, endsAtIso]
    );
    return res.rows[0];
  }

  async selectRandomQuestions({ difficulty, limit }) {
    const res = await pool.query(
      `SELECT id, question_text, option_a, option_b, option_c, option_d, difficulty, topic
       FROM aptitude_questions
       WHERE difficulty = $1
       ORDER BY RANDOM()
       LIMIT $2`,
      [difficulty, limit]
    );
    return res.rows;
  }

  async lockQuestionsForAttempt(client, attemptId, questionIds) {
    for (const qid of questionIds) {
      await client.query(
        `INSERT INTO candidate_aptitude_responses (attempt_id, question_id, selected_option)
         VALUES ($1,$2,NULL)
         ON CONFLICT (attempt_id, question_id) DO NOTHING`,
        [attemptId, asUuid(qid)]
      );
    }
  }

  async listAttemptQuestions(attemptId) {
    const res = await pool.query(
      `SELECT q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d
       FROM candidate_aptitude_responses r
       JOIN aptitude_questions q ON q.id = r.question_id
       WHERE r.attempt_id = $1
       ORDER BY q.created_at ASC`,
      [attemptId]
    );
    return res.rows;
  }

  async upsertResponses(client, attemptId, answers) {
    const updated = [];
    for (const a of answers) {
      const res = await client.query(
        `UPDATE candidate_aptitude_responses
         SET selected_option = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE attempt_id = $1 AND question_id = $2`,
        [attemptId, asUuid(a.questionId), a.selected]
      );
      updated.push({ questionId: asUuid(a.questionId), rowCount: res.rowCount });
    }
    return updated;
  }

  async computeScore(client, attemptId) {
    const res = await client.query(
      `SELECT COUNT(*)::int AS total,
              SUM(CASE WHEN r.selected_option = q.correct_option THEN 1 ELSE 0 END)::int AS correct
       FROM candidate_aptitude_responses r
       JOIN aptitude_questions q ON q.id = r.question_id
       WHERE r.attempt_id = $1`,
      [attemptId]
    );
    const total = Number(res.rows[0]?.total) || 0;
    const correct = Number(res.rows[0]?.correct) || 0;
    return { total, correct, score: correct };
  }

  async finalizeAttempt(client, { attemptId, status, score }) {
    const res = await client.query(
      `UPDATE candidate_aptitude_attempts
       SET status = $2,
           submitted_at = CURRENT_TIMESTAMP,
           score = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [attemptId, status, score]
    );
    return res.rows[0];
  }
}

export default new AptitudeRepository();
