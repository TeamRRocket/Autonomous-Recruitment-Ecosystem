import AppError from '../../utils/AppError.js';
import { pool } from '../../config/db.js';
import aptitudeRepository from './aptitude.repository.js';

const nowIso = () => new Date().toISOString();

const validateDifficulty = (value) => {
  const v = (value || '').toString().trim().toLowerCase();
  if (!['easy', 'medium', 'hard'].includes(v)) return null;
  return v;
};

const validateSelected = (value) => {
  const v = (value || '').toString().trim().toUpperCase();
  if (!['A', 'B', 'C', 'D'].includes(v)) return null;
  return v;
};

const mapQuestionsForClient = (rows) =>
  rows.map((q) => ({
    id: q.id,
    question: q.question_text,
    options: [q.option_a, q.option_b, q.option_c, q.option_d],
  }));

class AptitudeService {
  async start(userId, body) {
    const { jobId } = body || {};
    if (!jobId) throw new AppError('jobId is required', 400);

    const candidateId = await aptitudeRepository.getCandidateIdByUserId(userId);
    if (!candidateId) throw new AppError('Candidate profile not found', 404);

    const applied = await aptitudeRepository.assertCandidateAppliedToJob(jobId, candidateId);
    if (!applied) throw new AppError('You are not assigned to this job', 403);

    const win = await pool.query(
      'SELECT selection_lock_from, selection_lock_until FROM jobs WHERE id = $1',
      [jobId]
    );
    const fromRaw = win.rows[0]?.selection_lock_from;
    const untilRaw = win.rows[0]?.selection_lock_until;
    if (fromRaw && untilRaw) {
      const from = new Date(fromRaw);
      const until = new Date(untilRaw);
      if (!Number.isNaN(from.getTime()) && !Number.isNaN(until.getTime())) {
        const now = new Date();
        if (now < from) throw new AppError('Round is not active yet. Please start within the interview window.', 403);
        if (now > until) throw new AppError('Interview window has ended.', 403);
      }
    }

    const jobCfg = await aptitudeRepository.getJobAptitudeConfig(jobId);
    if (!jobCfg) throw new AppError('Job not found', 404);

    // Pipeline gating (no-gap): if DSA is configured as the first round, aptitude is locked until CODING/DSA is completed.
    try {
      const pipeline = await pool.query('SELECT pipeline_first_round FROM jobs WHERE id = $1', [jobId]);
      const first = pipeline.rows[0]?.pipeline_first_round || 'APTITUDE';
      if (first === 'DSA') {
        const codingSubmission = await pool.query(
          `SELECT 1
           FROM coding_submissions cs
           JOIN coding_problems cp ON cp.id = cs.problem_id
           JOIN interview_rounds ir ON ir.id = cp.round_id
           WHERE ir.job_id = $1
             AND ir.round_type = 'CODING'
             AND cs.candidate_id = $2
           LIMIT 1`,
          [jobId, candidateId]
        );

        if (codingSubmission.rows.length === 0) {
          throw new AppError('Complete DSA round first to unlock Aptitude round', 403);
        }
      }
    } catch (err) {
      // If the column does not exist yet, surface a clear error instead of failing silently.
      if (err?.code === '42703') {
        throw new AppError('Pipeline is not initialized. Please run initDb.js to migrate schema.', 500);
      }
      throw err;
    }

    if (!jobCfg.aptitude_enabled) throw new AppError('Aptitude round not available for this job', 404);

    const level = validateDifficulty(jobCfg.aptitude_level);
    if (!level) throw new AppError('Aptitude configuration is invalid for this job', 500);

    const durationMinutes = Number(jobCfg.aptitude_duration_minutes);
    const questionCount = Number(jobCfg.aptitude_question_count);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) throw new AppError('Aptitude duration is invalid', 500);
    if (!Number.isFinite(questionCount) || questionCount <= 0) throw new AppError('Aptitude question_count is invalid', 500);

    const existing = await aptitudeRepository.getAttemptByJobCandidate(jobId, candidateId);
    if (existing) {
      if (existing.status === 'submitted') throw new AppError('You have already completed this Aptitude round', 400);

      const endsAt = new Date(existing.ends_at).getTime();
      if (existing.status === 'started' && Number.isFinite(endsAt) && Date.now() > endsAt) {
        // Auto-expire on start call (refresh-safe) by scoring whatever exists.
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const locked = await aptitudeRepository.getAttemptByIdForUpdate(client, existing.id);
          if (locked && locked.status === 'started') {
            const { score } = await aptitudeRepository.computeScore(locked.id);
            await aptitudeRepository.finalizeAttempt(client, { attemptId: locked.id, status: 'expired', score });
          }
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
        throw new AppError('Aptitude round has expired', 400);
      }

      if (existing.status === 'expired') throw new AppError('Aptitude round has expired', 400);

      const questions = await aptitudeRepository.listAttemptQuestions(existing.id);
      return {
        attemptId: existing.id,
        durationMinutes,
        endsAt: existing.ends_at,
        serverTime: nowIso(),
        questions: mapQuestionsForClient(questions),
      };
    }

    const selected = await aptitudeRepository.selectRandomQuestions({ difficulty: level, limit: questionCount });
    if (selected.length !== questionCount) {
      throw new AppError('Not enough aptitude questions available for this configuration', 500);
    }

    const endsAt = new Date(Date.now() + durationMinutes * 60_000);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const attempt = await aptitudeRepository.createAttempt(client, {
        candidateId,
        jobId,
        endsAtIso: endsAt.toISOString(),
      });

      await aptitudeRepository.lockQuestionsForAttempt(
        client,
        attempt.id,
        selected.map((q) => q.id)
      );

      await client.query('COMMIT');

      return {
        attemptId: attempt.id,
        durationMinutes,
        endsAt: attempt.ends_at,
        serverTime: nowIso(),
        questions: mapQuestionsForClient(selected),
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async status(userId, query) {
    const jobId = query?.jobId;
    if (!jobId) throw new AppError('jobId is required', 400);

    const candidateId = await aptitudeRepository.getCandidateIdByUserId(userId);
    if (!candidateId) throw new AppError('Candidate profile not found', 404);

    const applied = await aptitudeRepository.assertCandidateAppliedToJob(jobId, candidateId);
    if (!applied) throw new AppError('You are not assigned to this job', 403);

    const attempt = await aptitudeRepository.getAttemptByJobCandidate(jobId, candidateId);
    if (!attempt) {
      return { exists: false, serverTime: nowIso() };
    }

    if (attempt.status === 'started') {
      const endsAt = new Date(attempt.ends_at).getTime();
      if (Number.isFinite(endsAt) && Date.now() > endsAt) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const locked = await aptitudeRepository.getAttemptByIdForUpdate(client, attempt.id);
          if (locked && locked.status === 'started') {
            const { score } = await aptitudeRepository.computeScore(locked.id);
            await aptitudeRepository.finalizeAttempt(client, { attemptId: locked.id, status: 'expired', score });
          }
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }

        const refreshed = await aptitudeRepository.getAttemptByJobCandidate(jobId, candidateId);
        return {
          exists: true,
          attemptId: refreshed.id,
          status: refreshed.status,
          endsAt: refreshed.ends_at,
          score: refreshed.score ?? null,
          serverTime: nowIso(),
        };
      }
    }

    return {
      exists: true,
      attemptId: attempt.id,
      status: attempt.status,
      endsAt: attempt.ends_at,
      score: attempt.score ?? null,
      serverTime: nowIso(),
    };
  }

  async submit(userId, body) {
    const { attemptId, answers } = body || {};
    if (!attemptId) throw new AppError('attemptId is required', 400);
    if (!Array.isArray(answers)) throw new AppError('answers must be an array', 400);

    const candidateId = await aptitudeRepository.getCandidateIdByUserId(userId);
    if (!candidateId) throw new AppError('Candidate profile not found', 404);

    const normalizedAnswers = [];
    for (const a of answers) {
      if (!a || !a.questionId) throw new AppError('Each answer must include questionId', 400);
      const selected = validateSelected(a.selected);
      if (!selected) throw new AppError('selected must be one of A, B, C, D', 400);
      normalizedAnswers.push({ questionId: a.questionId, selected });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const attempt = await aptitudeRepository.getAttemptByIdForUpdate(client, attemptId);
      if (!attempt) throw new AppError('Attempt not found', 404);
      if (attempt.candidate_id !== candidateId) throw new AppError('Access denied', 403);

      if (attempt.status === 'submitted') throw new AppError('Attempt already submitted', 400);
      if (attempt.status === 'expired') throw new AppError('Attempt already expired', 400);

      const ended = Date.now() > new Date(attempt.ends_at).getTime();

      const updates = await aptitudeRepository.upsertResponses(client, attempt.id, normalizedAnswers);
      const invalid = updates.find((u) => u.rowCount === 0);
      if (invalid) {
        throw new AppError('One or more questions are not part of this attempt', 400);
      }

      const { score } = await aptitudeRepository.computeScore(attempt.id);
      const status = ended ? 'expired' : 'submitted';

      const finalized = await aptitudeRepository.finalizeAttempt(client, { attemptId: attempt.id, status, score });

      await client.query('COMMIT');

      return {
        attemptId: finalized.id,
        status: finalized.status,
        score: finalized.score,
        serverTime: nowIso(),
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export default new AptitudeService();
