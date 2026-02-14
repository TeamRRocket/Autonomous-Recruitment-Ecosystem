import { pool } from '../../config/db.js';
import AppError from '../../utils/AppError.js';
import { ensureRedisConnected, redis } from '../../config/redis.js';
import * as judge0 from '../coding/judge0.service.js';

const CPP_LANGUAGE_ID = 54; // GNU C++17 on Judge0 CE

const MAX_SOURCE_BYTES = 80_000;
const MAX_STDIN_BYTES = 20_000;

const nowIso = () => new Date().toISOString();

const normalizeOutput = (v) => (v ?? '').toString().replace(/\r\n/g, '\n').trimEnd();

const assertCandidateProfile = async (userId) => {
  const res = await pool.query('SELECT id FROM candidate_profiles WHERE user_id = $1', [userId]);
  if (res.rows.length === 0) throw new AppError('Candidate profile not found', 404);
  return res.rows[0].id;
};

const assertRecruiterProfile = async (userId) => {
  const res = await pool.query('SELECT id FROM recruiters WHERE user_id = $1', [userId]);
  if (res.rows.length === 0) throw new AppError('Recruiter profile not found', 404);
  return res.rows[0].id;
};

const assertRecruiterOwnsJob = async (recruiterId, jobId) => {
  const job = await pool.query('SELECT recruiter_id FROM jobs WHERE id = $1', [jobId]);
  if (job.rows.length === 0) throw new AppError('Job not found', 404);
  if (job.rows[0].recruiter_id !== recruiterId) throw new AppError('Access denied', 403);
};

const assertAssignedToJob = async (jobId, candidateId) => {
  const res = await pool.query('SELECT 1 FROM applications WHERE job_id = $1 AND candidate_id = $2', [jobId, candidateId]);
  if (res.rows.length === 0) throw new AppError('You are not assigned to this job', 403);
};

const getPublishedConfig = async (jobId) => {
  const cfg = await pool.query('SELECT * FROM dsa_round_configs WHERE job_id = $1 AND enabled = TRUE AND published = TRUE', [jobId]);
  if (cfg.rows.length === 0) throw new AppError('DSA round not available for this job', 404);
  return cfg.rows[0];
};

const getConfigProblems = async (configId) => {
  const res = await pool.query(
    `SELECT p.id, p.dataset_id, p.title, p.difficulty, p.problem_statement, p.constraints, p.boilerplate_cpp, p.time_limit_ms, p.memory_limit_mb, cp.problem_order
     FROM dsa_round_config_problems cp
     JOIN dsa_bank_problems p ON p.id = cp.problem_id
     WHERE cp.config_id = $1
     ORDER BY cp.problem_order ASC`,
    [configId]
  );
  return res.rows;
};

const getPublicTestCasesForProblem = async (problemId) => {
  const res = await pool.query(
    `SELECT test_order, input, expected_output
     FROM dsa_bank_test_cases
     WHERE problem_id = $1 AND is_hidden = FALSE
     ORDER BY test_order ASC`,
    [problemId]
  );
  return res.rows;
};

const getAllTestCasesForProblem = async (problemId) => {
  const res = await pool.query(
    `SELECT test_order, input, expected_output, is_hidden
     FROM dsa_bank_test_cases
     WHERE problem_id = $1
     ORDER BY test_order ASC`,
    [problemId]
  );
  return res.rows;
};

const redisKeys = (attemptId) => ({
  expiry: `dsa:round:${attemptId}:expiry`,
  status: `dsa:round:${attemptId}:status`,
  activity: `dsa:round:${attemptId}:activityCounters`,
  drafts: `dsa:round:${attemptId}:drafts`,
});

const getSubmittedProblemIds = async (attemptId, client = pool) => {
  const res = await client.query(
    `SELECT DISTINCT problem_id
     FROM dsa_round_submissions
     WHERE attempt_id = $1 AND is_final = TRUE`,
    [attemptId]
  );
  return res.rows.map((r) => r.problem_id);
};

const assertProblemNotFinalSubmitted = async ({ attemptId, problemId }) => {
  const res = await pool.query(
    `SELECT 1
     FROM dsa_round_submissions
     WHERE attempt_id = $1 AND problem_id = $2 AND is_final = TRUE
     LIMIT 1`,
    [attemptId, problemId]
  );
  if (res.rows.length > 0) throw new AppError('Problem already submitted', 400);
};

const rateLimit = async (key, limit, windowSeconds) => {
  await ensureRedisConnected();
  const multi = redis.multi();
  multi.incr(key);
  multi.expire(key, windowSeconds, 'NX');
  const replies = await multi.exec();
  const current = Number(replies?.[0]);
  if (current > limit) {
    throw new AppError('Too many requests. Please slow down.', 429);
  }
};

const validateCodePayload = (sourceCode, stdin) => {
  if (!sourceCode || typeof sourceCode !== 'string') throw new AppError('source_code is required', 400);
  const srcBytes = Buffer.byteLength(sourceCode, 'utf8');
  if (srcBytes > MAX_SOURCE_BYTES) throw new AppError('source_code too large', 413);

  if (stdin != null && typeof stdin !== 'string') throw new AppError('stdin must be a string', 400);
  const stdinBytes = Buffer.byteLength(stdin || '', 'utf8');
  if (stdinBytes > MAX_STDIN_BYTES) throw new AppError('stdin too large', 413);
};

const validateDifficulty = (value) => {
  const v = (value || '').toString().trim().toLowerCase();
  if (!['easy', 'medium', 'hard'].includes(v)) {
    throw new AppError('difficulty must be one of easy, medium, hard', 400);
  }
  return v;
};

const mapRoundDifficulty = (value) => {
  const v = (value || '').toString().trim().toUpperCase();
  if (v === 'EASY') return 'easy';
  if (v === 'MEDIUM') return 'medium';
  if (v === 'HARD') return 'hard';
  return 'medium';
};

const getJobDsaSettings = async (jobId) => {
  const res = await pool.query(
    `SELECT duration_minutes, num_questions, difficulty_level
     FROM interview_rounds
     WHERE job_id = $1 AND round_type = 'CODING'
     ORDER BY round_order ASC
     LIMIT 1`,
    [jobId]
  );
  if (res.rows.length === 0) {
    throw new AppError('DSA round not configured for this job', 404);
  }
  const r = res.rows[0];
  const duration = Number(r.duration_minutes);
  const numQuestions = Number(r.num_questions);
  if (!Number.isFinite(duration) || duration <= 0) throw new AppError('DSA duration is invalid for this job', 500);
  if (!Number.isFinite(numQuestions) || numQuestions <= 0) throw new AppError('DSA num_questions is invalid for this job', 500);
  return {
    time_limit_minutes: duration,
    num_questions: numQuestions,
    difficulty: mapRoundDifficulty(r.difficulty_level),
  };
};

const ensureAutoPublishedConfig = async (jobId) => {
  const settings = await getJobDsaSettings(jobId);
  const upsert = await pool.query(
    `INSERT INTO dsa_round_configs (job_id, enabled, num_questions, difficulty, time_limit_minutes, published, published_at)
     VALUES ($1, TRUE, $2, $3, $4, TRUE, CURRENT_TIMESTAMP)
     ON CONFLICT (job_id)
     DO UPDATE SET
       enabled = TRUE,
       num_questions = EXCLUDED.num_questions,
       difficulty = EXCLUDED.difficulty,
       time_limit_minutes = EXCLUDED.time_limit_minutes,
       published = TRUE,
       published_at = COALESCE(dsa_round_configs.published_at, CURRENT_TIMESTAMP),
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [jobId, settings.num_questions, settings.difficulty, settings.time_limit_minutes]
  );
  return upsert.rows[0];
};

const pickRandomProblemsForAttempt = async ({ jobId, difficulty, limit }) => {
  const primary = await pool.query(
    `SELECT p.id
     FROM dsa_bank_problems p
     WHERE p.difficulty = $1
       AND NOT EXISTS (
         SELECT 1
         FROM dsa_round_attempts a
         WHERE a.job_id = $2
           AND a.problem_ids IS NOT NULL
           AND p.id = ANY(a.problem_ids)
       )
     ORDER BY RANDOM()
     LIMIT $3`,
    [difficulty, jobId, limit]
  );
  let ids = primary.rows.map((r) => r.id);

  if (ids.length < limit) {
    const fallback = await pool.query(
      `SELECT id
       FROM dsa_bank_problems
       WHERE difficulty = $1
       ORDER BY RANDOM()
       LIMIT $2`,
      [difficulty, limit]
    );
    ids = fallback.rows.map((r) => r.id);
  }

  if (ids.length < limit) throw new AppError('Not enough DSA problems in dataset for this difficulty', 500);
  return ids;
};

const getProblemsByIds = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const res = await pool.query(
    `SELECT id, dataset_id, title, difficulty, problem_statement, constraints, boilerplate_cpp, time_limit_ms, memory_limit_mb
     FROM dsa_bank_problems
     WHERE id = ANY($1::uuid[])`,
    [ids]
  );
  const byId = new Map(res.rows.map((r) => [r.id, r]));
  const ordered = [];
  for (const id of ids) {
    const row = byId.get(id);
    if (row) ordered.push(row);
  }
  return ordered;
};

const getActiveAttempt = async (jobId, candidateId) => {
  const res = await pool.query(
    `SELECT * FROM dsa_round_attempts
     WHERE job_id = $1 AND candidate_id = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [jobId, candidateId]
  );
  return res.rows[0] || null;
};

const autoSubmitIfExpired = async (userId, candidateId, attempt) => {
  if (!attempt) return null;
  if (attempt.status === 'SUBMITTED') return null;

  await ensureRedisConnected();
  const keys = redisKeys(attempt.id);
  const status = await redis.get(keys.status);
  if (status) return null;

  const problems = attempt.problem_ids ? await getProblemsByIds(attempt.problem_ids) : await getConfigProblems(attempt.config_id);
  const drafts = await redis.hGetAll(keys.drafts);

  const solutions = problems.map((p) => ({
    problem_id: p.id,
    source_code: drafts?.[p.id] || p.boilerplate_cpp || '',
  }));

  return await submit(userId, {
    job_id: attempt.job_id,
    attempt_id: attempt.id,
    solutions,
    is_auto: true,
  });
};

export const listBankProblems = async (userId, query) => {
  const recruiterId = await assertRecruiterProfile(userId);
  void recruiterId;

  const difficulty = query?.difficulty ? validateDifficulty(query.difficulty) : null;
  const limit = Math.min(200, Math.max(1, parseInt(query?.limit || '50', 10)));
  const offset = Math.max(0, parseInt(query?.offset || '0', 10));

  if (difficulty) {
    const res = await pool.query(
      `SELECT id, dataset_id, title, difficulty
       FROM dsa_bank_problems
       WHERE difficulty = $1
       ORDER BY title ASC
       LIMIT $2 OFFSET $3`,
      [difficulty, limit, offset]
    );
    return res.rows;
  }

  const res = await pool.query(
    `SELECT id, dataset_id, title, difficulty
     FROM dsa_bank_problems
     ORDER BY title ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return res.rows;
};

export const getConfig = async (userId, query) => {
  const jobId = query?.job_id;
  if (!jobId) throw new AppError('job_id is required', 400);

  const recruiterId = await assertRecruiterProfile(userId);
  await assertRecruiterOwnsJob(recruiterId, jobId);

  const cfg = await pool.query('SELECT * FROM dsa_round_configs WHERE job_id = $1', [jobId]);
  if (cfg.rows.length === 0) {
    return null;
  }

  const config = cfg.rows[0];
  const problems = await pool.query(
    `SELECT cp.problem_order, p.id, p.dataset_id, p.title, p.difficulty
     FROM dsa_round_config_problems cp
     JOIN dsa_bank_problems p ON p.id = cp.problem_id
     WHERE cp.config_id = $1
     ORDER BY cp.problem_order ASC`,
    [config.id]
  );

  return { ...config, problems: problems.rows };
};

export const upsertConfig = async (userId, body) => {
  const { job_id, enabled, num_questions, difficulty, time_limit_minutes, problem_ids } = body || {};

  if (!job_id) throw new AppError('job_id is required', 400);
  if (enabled == null) throw new AppError('enabled is required', 400);
  if (!Number.isFinite(num_questions) || num_questions <= 0) throw new AppError('num_questions must be a positive number', 400);
  if (!Number.isFinite(time_limit_minutes) || time_limit_minutes <= 0) throw new AppError('time_limit_minutes must be a positive number', 400);
  const diff = validateDifficulty(difficulty);

  if (!Array.isArray(problem_ids) || problem_ids.length !== num_questions) {
    throw new AppError('problem_ids length must match num_questions', 400);
  }

  const recruiterId = await assertRecruiterProfile(userId);
  await assertRecruiterOwnsJob(recruiterId, job_id);

  const distinct = new Set(problem_ids);
  if (distinct.size !== problem_ids.length) throw new AppError('problem_ids must be unique', 400);

  const bankCount = await pool.query('SELECT COUNT(*)::int AS cnt FROM dsa_bank_problems WHERE id = ANY($1::uuid[])', [problem_ids]);
  if (bankCount.rows[0].cnt !== problem_ids.length) {
    throw new AppError('One or more problems are invalid', 400);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT * FROM dsa_round_configs WHERE job_id = $1 FOR UPDATE', [job_id]);
    let config;

    if (existing.rows.length > 0) {
      config = existing.rows[0];
      if (config.published) {
        throw new AppError('DSA configuration is already published and cannot be changed', 400);
      }

      const upd = await client.query(
        `UPDATE dsa_round_configs
         SET enabled = $2,
             num_questions = $3,
             difficulty = $4,
             time_limit_minutes = $5,
             updated_at = CURRENT_TIMESTAMP
         WHERE job_id = $1
         RETURNING *`,
        [job_id, !!enabled, num_questions, diff, time_limit_minutes]
      );
      config = upd.rows[0];

      await client.query('DELETE FROM dsa_round_config_problems WHERE config_id = $1', [config.id]);
    } else {
      const ins = await client.query(
        `INSERT INTO dsa_round_configs (job_id, enabled, num_questions, difficulty, time_limit_minutes, published)
         VALUES ($1,$2,$3,$4,$5,FALSE)
         RETURNING *`,
        [job_id, !!enabled, num_questions, diff, time_limit_minutes]
      );
      config = ins.rows[0];
    }

    for (let i = 0; i < problem_ids.length; i += 1) {
      await client.query(
        `INSERT INTO dsa_round_config_problems (config_id, problem_id, problem_order)
         VALUES ($1,$2,$3)`,
        [config.id, problem_ids[i], i + 1]
      );
    }

    await client.query('COMMIT');
    return await getConfig(userId, { job_id });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const publishConfig = async (userId, body) => {
  const { job_id } = body || {};
  if (!job_id) throw new AppError('job_id is required', 400);

  const recruiterId = await assertRecruiterProfile(userId);
  await assertRecruiterOwnsJob(recruiterId, job_id);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cfgRes = await client.query('SELECT * FROM dsa_round_configs WHERE job_id = $1 FOR UPDATE', [job_id]);
    if (cfgRes.rows.length === 0) throw new AppError('DSA configuration not found', 404);
    const cfg = cfgRes.rows[0];
    if (cfg.published) {
      await client.query('COMMIT');
      return await getConfig(userId, { job_id });
    }

    const problems = await client.query('SELECT COUNT(*)::int AS cnt FROM dsa_round_config_problems WHERE config_id = $1', [cfg.id]);
    if (problems.rows[0].cnt !== Number(cfg.num_questions)) {
      throw new AppError('Configured problems do not match num_questions', 400);
    }

    await client.query(
      `UPDATE dsa_round_configs
       SET published = TRUE,
           published_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [cfg.id]
    );
    await client.query('COMMIT');

    return await getConfig(userId, { job_id });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const computeAttemptScore = async (attemptId) => {
  const subs = await pool.query(
    `SELECT score
     FROM dsa_round_submissions
     WHERE attempt_id = $1 AND is_final = TRUE`,
    [attemptId]
  );

  if (subs.rows.length === 0) return 0;

  // Score definition: overall score for attempt = average of per-question scores.
  const scores = subs.rows.map((r) => Number(r.score) || 0);
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round(sum / scores.length);
};

const ensureNotExpired = async (attempt) => {
  if (!attempt) return;
  if (attempt.status !== 'IN_PROGRESS') return;

  // Redis TTL is the authoritative timer. If it's gone, the attempt is expired.
  await ensureRedisConnected();
  const keys = redisKeys(attempt.id);
  const redisStatus = await redis.get(keys.status);
  if (!redisStatus) {
    await pool.query(
      `UPDATE dsa_round_attempts
       SET status = 'EXPIRED', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'IN_PROGRESS'`,
      [attempt.id]
    );
    return;
  }

  const endsAt = new Date(attempt.ends_at).getTime();
  if (Number.isFinite(endsAt) && Date.now() > endsAt) {
    // Mark expired. Auto-submit is handled by the client calling submit OR by getStatus.
    await pool.query(
      `UPDATE dsa_round_attempts
       SET status = 'EXPIRED', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'IN_PROGRESS'`,
      [attempt.id]
    );
  }
};

export const startRound = async (userId, body) => {
  const { job_id } = body || {};
  if (!job_id) throw new AppError('job_id is required', 400);

  const candidateId = await assertCandidateProfile(userId);
  await assertAssignedToJob(job_id, candidateId);

  const win = await pool.query(
    'SELECT selection_lock_from, selection_lock_until FROM jobs WHERE id = $1',
    [job_id]
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

  // Pipeline gating (no-gap): if Aptitude is configured as the first round, DSA is locked until Aptitude is completed.
  try {
    const pipeline = await pool.query('SELECT pipeline_first_round FROM jobs WHERE id = $1', [job_id]);
    const first = pipeline.rows[0]?.pipeline_first_round || 'APTITUDE';
    if (first === 'APTITUDE') {
      const aptAttempt = await pool.query(
        `SELECT status
         FROM candidate_aptitude_attempts
         WHERE job_id = $1 AND candidate_id = $2
         LIMIT 1`,
        [job_id, candidateId]
      );
      const st = aptAttempt.rows[0]?.status || null;
      const completed = st === 'submitted' || st === 'expired';
      if (!completed) {
        throw new AppError('Complete Aptitude round first to unlock DSA round', 403);
      }
    }
  } catch (err) {
    if (err?.code === '42703') {
      throw new AppError('Pipeline is not initialized. Please run initDb.js to migrate schema.', 500);
    }
    throw err;
  }

  const config = await ensureAutoPublishedConfig(job_id);

  const existing = await getActiveAttempt(job_id, candidateId);
  if (existing) {
    await ensureNotExpired(existing);
    if (existing.status === 'IN_PROGRESS') {
      const problems = await getProblemsByIds(existing.problem_ids || []);
      const submittedProblemIds = await getSubmittedProblemIds(existing.id);
      const totalProblems = Array.isArray(existing.problem_ids) ? existing.problem_ids.length : 0;

      const problemsForClient = [];
      for (const p of problems) {
        const publicTests = await getPublicTestCasesForProblem(p.id);
        problemsForClient.push({
          id: p.id,
          dataset_id: p.dataset_id,
          title: p.title,
          difficulty: p.difficulty,
          problem_statement: p.problem_statement,
          constraints: p.constraints,
          boilerplate_cpp: p.boilerplate_cpp,
          time_limit_ms: p.time_limit_ms,
          memory_limit_mb: p.memory_limit_mb,
          problem_order: p.problem_order,
          public_test_cases: publicTests,
          language: { id: CPP_LANGUAGE_ID, name: 'C++ (GNU++17)' },
        });
      }

      return {
        attempt_id: existing.id,
        job_id,
        status: existing.status,
        started_at: existing.started_at,
        ends_at: existing.ends_at,
        server_time: nowIso(),
        submitted_problem_ids: submittedProblemIds,
        remaining: Math.max(0, totalProblems - submittedProblemIds.length),
        problems: problemsForClient,
      };
    }
    if (existing.status === 'SUBMITTED') {
      throw new AppError('You have already completed this DSA round', 400);
    }
  }

  const endsAt = new Date(Date.now() + Number(config.time_limit_minutes) * 60_000);

  const settings = await getJobDsaSettings(job_id);
  const problemIds = await pickRandomProblemsForAttempt({
    jobId: job_id,
    difficulty: settings.difficulty,
    limit: settings.num_questions,
  });

  // Idempotent attempt creation: handle double calls safely and allow restarting expired attempts.
  // Unique constraint: (job_id, candidate_id)
  const upsertAttempt = await pool.query(
    `INSERT INTO dsa_round_attempts (job_id, config_id, candidate_id, status, ends_at, problem_ids)
     VALUES ($1,$2,$3,'IN_PROGRESS',$4,$5)
     ON CONFLICT (job_id, candidate_id)
     DO UPDATE SET
       config_id = EXCLUDED.config_id,
       ends_at = CASE
         WHEN dsa_round_attempts.status = 'SUBMITTED' THEN dsa_round_attempts.ends_at
         ELSE EXCLUDED.ends_at
       END,
       problem_ids = CASE
         WHEN dsa_round_attempts.status = 'SUBMITTED' THEN dsa_round_attempts.problem_ids
         ELSE EXCLUDED.problem_ids
       END,
       status = CASE
         WHEN dsa_round_attempts.status = 'SUBMITTED' THEN 'SUBMITTED'
         ELSE 'IN_PROGRESS'
       END,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [job_id, config.id, candidateId, endsAt.toISOString(), problemIds]
  );

  const attempt = upsertAttempt.rows[0];

  if (attempt.status === 'SUBMITTED') {
    throw new AppError('You have already completed this DSA round', 400);
  }

  if (attempt.status === 'IN_PROGRESS' && existing && existing.status === 'IN_PROGRESS') {
    return await getStatus(userId, { job_id });
  }

  await ensureRedisConnected();
  const keys = redisKeys(attempt.id);
  await redis.set(keys.status, 'IN_PROGRESS');
  await redis.set(keys.expiry, new Date(attempt.ends_at).toISOString());
  // Use TTL so Redis is authoritative on timing.
  const ttlSeconds = Math.max(1, Math.ceil((endsAt.getTime() - Date.now()) / 1000));
  await redis.expire(keys.status, ttlSeconds);
  await redis.expire(keys.expiry, ttlSeconds);

  const problems = await getProblemsByIds(problemIds);

  const problemsForClient = [];
  for (const p of problems) {
    const publicTests = await getPublicTestCasesForProblem(p.id);
    problemsForClient.push({
      id: p.id,
      dataset_id: p.dataset_id,
      title: p.title,
      difficulty: p.difficulty,
      problem_statement: p.problem_statement,
      constraints: p.constraints,
      boilerplate_cpp: p.boilerplate_cpp,
      time_limit_ms: p.time_limit_ms,
      memory_limit_mb: p.memory_limit_mb,
      problem_order: p.problem_order,
      public_test_cases: publicTests,
      language: { id: CPP_LANGUAGE_ID, name: 'C++ (GNU++17)' },
    });
  }

  return {
    attempt_id: attempt.id,
    job_id,
    status: attempt.status,
    started_at: attempt.started_at,
    ends_at: attempt.ends_at,
    server_time: nowIso(),
    submitted_problem_ids: [],
    remaining: Array.isArray(attempt.problem_ids) ? attempt.problem_ids.length : 0,
    problems: problemsForClient,
  };
};

export const getStatus = async (userId, query) => {
  const jobId = query?.job_id;
  if (!jobId) throw new AppError('job_id is required', 400);

  const candidateId = await assertCandidateProfile(userId);
  await assertAssignedToJob(jobId, candidateId);

  const attempt = await getActiveAttempt(jobId, candidateId);
  if (!attempt) throw new AppError('No DSA attempt found. Start the round first.', 404);

  await ensureNotExpired(attempt);

  const auto = await autoSubmitIfExpired(userId, candidateId, attempt);
  if (auto) {
    const res = await pool.query('SELECT * FROM dsa_round_attempts WHERE id = $1', [attempt.id]);
    const submittedAttempt = res.rows[0] || attempt;

    const submittedProblemIds = await getSubmittedProblemIds(submittedAttempt.id);
    const totalProblems = Array.isArray(submittedAttempt.problem_ids) ? submittedAttempt.problem_ids.length : 0;
    return {
      attempt_id: submittedAttempt.id,
      job_id: submittedAttempt.job_id,
      status: submittedAttempt.status,
      redis_status: 'SUBMITTED',
      started_at: submittedAttempt.started_at,
      ends_at: submittedAttempt.ends_at,
      expiry: submittedAttempt.ends_at,
      server_time: nowIso(),
      submitted_problem_ids: submittedProblemIds,
      remaining: Math.max(0, totalProblems - submittedProblemIds.length),
    };
  }

  // Re-fetch in case ensureNotExpired flipped state.
  const refreshedAttemptRes = await pool.query('SELECT * FROM dsa_round_attempts WHERE id = $1', [attempt.id]);
  const refreshedAttempt = refreshedAttemptRes.rows[0] || attempt;

  await ensureRedisConnected();
  const keys = redisKeys(refreshedAttempt.id);
  const [redisStatus, expiry] = await redis.mGet([keys.status, keys.expiry]);

  const submittedProblemIds = await getSubmittedProblemIds(refreshedAttempt.id);
  const totalProblems = Array.isArray(refreshedAttempt.problem_ids) ? refreshedAttempt.problem_ids.length : 0;

  return {
    attempt_id: refreshedAttempt.id,
    job_id: refreshedAttempt.job_id,
    status: refreshedAttempt.status,
    redis_status: redisStatus,
    started_at: refreshedAttempt.started_at,
    ends_at: refreshedAttempt.ends_at,
    expiry: expiry || refreshedAttempt.ends_at,
    server_time: nowIso(),
    submitted_problem_ids: submittedProblemIds,
    remaining: Math.max(0, totalProblems - submittedProblemIds.length),
  };
};

export const runCode = async (userId, body) => {
  const { job_id, attempt_id, problem_id, source_code, stdin } = body || {};
  if (!job_id || !attempt_id || !problem_id) throw new AppError('job_id, attempt_id, problem_id are required', 400);

  validateCodePayload(source_code, stdin);

  const candidateId = await assertCandidateProfile(userId);
  await assertAssignedToJob(job_id, candidateId);

  const attemptRes = await pool.query(
    `SELECT * FROM dsa_round_attempts WHERE id = $1 AND job_id = $2 AND candidate_id = $3`,
    [attempt_id, job_id, candidateId]
  );
  if (attemptRes.rows.length === 0) throw new AppError('Attempt not found', 404);
  const attempt = attemptRes.rows[0];

  await ensureNotExpired(attempt);
  if (attempt.status !== 'IN_PROGRESS') throw new AppError('Round is not in progress', 400);

  await rateLimit(`rl:dsa:run:${candidateId}`, 120, 60);

  const pid = String(problem_id);
  const allowed = new Set((attempt.problem_ids || []).map((v) => String(v)));
  if (allowed.size > 0 && !allowed.has(pid)) throw new AppError('Problem is not part of this round', 400);

  await assertProblemNotFinalSubmitted({ attemptId: attempt.id, problemId: pid });

  const publicTests = await getPublicTestCasesForProblem(pid);
  if (publicTests.length === 0) {
    const runRes = await judge0.run({ language_id: CPP_LANGUAGE_ID, source_code, stdin: stdin || '' });
    return {
      results: [
        {
          test_order: 1,
          status: runRes.status || 'Executed',
          passed: null,
          stdout: runRes.stdout || '',
          stderr: runRes.stderr || '',
          compile_output: runRes.compile_output || '',
          time: runRes.time || null,
          memory: runRes.memory || null,
        },
      ],
    };
  }

  await pool.query(
    `INSERT INTO dsa_round_run_logs (attempt_id, problem_id) VALUES ($1, $2)`,
    [attempt.id, pid]
  );

  const results = [];
  for (const tc of publicTests) {
    const runRes = await judge0.run({
      language_id: CPP_LANGUAGE_ID,
      source_code,
      stdin: tc.input,
    });

    const expected = normalizeOutput(tc.expected_output);
    const actual = normalizeOutput(runRes.stdout);

    const compileFailed = !!runRes.compile_output;
    const runtimeFailed = !!runRes.stderr && !compileFailed;
    const judgeAccepted = runRes.status === 'Accepted';

    let status = runRes.status;
    let passed = false;

    if (compileFailed) {
      status = 'Compilation Error';
      passed = false;
    } else if (runtimeFailed && !judgeAccepted) {
      status = runRes.status || 'Runtime Error';
      passed = false;
    } else if (judgeAccepted) {
      passed = actual === expected;
      status = passed ? 'Accepted' : 'Wrong Answer';
    } else {
      passed = false;
    }

    results.push({
      test_order: tc.test_order,
      status,
      passed,
      stdout: runRes.stdout || '',
      stderr: runRes.stderr || '',
      compile_output: runRes.compile_output || '',
      time: runRes.time || null,
      memory: runRes.memory || null,
    });
  }

  return { results };
};

export const saveDraft = async (userId, body) => {
  const { job_id, attempt_id, problem_id, source_code } = body || {};
  if (!job_id || !attempt_id || !problem_id) throw new AppError('job_id, attempt_id, problem_id are required', 400);

  validateCodePayload(source_code, '');

  const candidateId = await assertCandidateProfile(userId);
  await assertAssignedToJob(job_id, candidateId);

  const attemptRes = await pool.query(
    `SELECT * FROM dsa_round_attempts WHERE id = $1 AND job_id = $2 AND candidate_id = $3`,
    [attempt_id, job_id, candidateId]
  );
  if (attemptRes.rows.length === 0) throw new AppError('Attempt not found', 404);
  const attempt = attemptRes.rows[0];

  await ensureNotExpired(attempt);
  if (attempt.status !== 'IN_PROGRESS') throw new AppError('Round is not in progress', 400);

  const pid = String(problem_id);
  const allowed = new Set((attempt.problem_ids || []).map((v) => String(v)));
  if (allowed.size > 0 && !allowed.has(pid)) throw new AppError('Problem is not part of this round', 400);

  await assertProblemNotFinalSubmitted({ attemptId: attempt.id, problemId: pid });

  await ensureRedisConnected();
  const keys = redisKeys(attempt.id);
  await redis.hSet(keys.drafts, pid, source_code);

  return { saved: true };
};

export const submit = async (userId, body) => {
  const { job_id, attempt_id, solutions, is_auto, anti_cheat_events } = body || {};

  if (!job_id || !attempt_id) throw new AppError('job_id and attempt_id are required', 400);
  if (!Array.isArray(solutions) || solutions.length === 0) throw new AppError('solutions must be a non-empty array', 400);

  const candidateId = await assertCandidateProfile(userId);
  await assertAssignedToJob(job_id, candidateId);

  await rateLimit(`rl:dsa:submit:${candidateId}`, 10, 60);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const attemptRes = await client.query(
      `SELECT * FROM dsa_round_attempts WHERE id = $1 AND job_id = $2 AND candidate_id = $3 FOR UPDATE`,
      [attempt_id, job_id, candidateId]
    );
    if (attemptRes.rows.length === 0) throw new AppError('Attempt not found', 404);

    const attempt = attemptRes.rows[0];

    if (attempt.status === 'SUBMITTED') throw new AppError('Final submission already made', 400);

    // If time is over, we still accept submission (manual or auto) but record auto flag.
    const ended = Date.now() > new Date(attempt.ends_at).getTime();

    const allowedProblemIds = new Set((attempt.problem_ids || []).map((v) => String(v)));
    const alreadySubmitted = new Set((await getSubmittedProblemIds(attempt.id, client)).map((v) => String(v)));

    for (const s of solutions) {
      if (!s || !s.problem_id || !s.source_code) {
        throw new AppError('Each solution must have problem_id and source_code', 400);
      }
      const pid = String(s.problem_id);
      if (!allowedProblemIds.has(pid)) {
        throw new AppError('One or more problems are not part of this round', 400);
      }

      if (alreadySubmitted.has(pid)) {
        throw new AppError('Problem already submitted', 400);
      }
      validateCodePayload(s.source_code, '');

      // Evaluate hidden test cases when available. If not configured, accept submission without scoring.
      const allTests = await getAllTestCasesForProblem(pid);
      const hidden = allTests.filter((t) => t.is_hidden);
      const totalHidden = hidden.length;

      let passedHidden = 0;
      let score = 0;
      if (totalHidden > 0) {
        for (const tc of hidden) {
          const runRes = await judge0.run({
            language_id: CPP_LANGUAGE_ID,
            source_code: s.source_code,
            stdin: tc.input,
          });

          const expected = normalizeOutput(tc.expected_output);
          const actual = normalizeOutput(runRes.stdout);
          const compileFailed = !!runRes.compile_output;
          const runtimeFailed = !!runRes.stderr && !compileFailed;
          const judgeAccepted = runRes.status === 'Accepted';

          const passed = !compileFailed && !runtimeFailed && judgeAccepted && actual === expected;
          if (passed) passedHidden += 1;
        }

        score = Math.round((passedHidden / totalHidden) * 100);
      }

      await client.query(
        `INSERT INTO dsa_round_submissions (
            attempt_id, problem_id, language_id, source_code, is_final, is_auto, score, passed_hidden, total_hidden
          ) VALUES ($1,$2,$3,$4,TRUE,$5,$6,$7,$8)
          ON CONFLICT (attempt_id, problem_id, is_final)
          DO UPDATE SET
            source_code = EXCLUDED.source_code,
            is_auto = EXCLUDED.is_auto,
            score = EXCLUDED.score,
            passed_hidden = EXCLUDED.passed_hidden,
            total_hidden = EXCLUDED.total_hidden,
            created_at = CURRENT_TIMESTAMP`,
        [attempt.id, pid, CPP_LANGUAGE_ID, s.source_code, !!(is_auto || ended), score, passedHidden, totalHidden]
      );
    }

    if (Array.isArray(anti_cheat_events) && anti_cheat_events.length > 0) {
      for (const e of anti_cheat_events) {
        if (!e || typeof e.event_type !== 'string') continue;
        await client.query(
          `INSERT INTO dsa_round_anti_cheat_events (attempt_id, event_type) VALUES ($1, $2)`,
          [attempt.id, e.event_type]
        );
      }
    }

    const submittedProblemIds = await getSubmittedProblemIds(attempt.id, client);
    const totalProblems = Array.isArray(attempt.problem_ids) ? attempt.problem_ids.length : 0;
    const allDone = totalProblems > 0 && submittedProblemIds.length >= totalProblems;

    if (allDone) {
      const finalScore = await computeAttemptScore(attempt.id);
      const timeTakenSeconds = Math.max(0, Math.round((Date.now() - new Date(attempt.started_at).getTime()) / 1000));

      await client.query(
        `UPDATE dsa_round_attempts
         SET status = 'SUBMITTED',
             submitted_at = CURRENT_TIMESTAMP,
             time_taken_seconds = $2,
             final_score = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [attempt.id, timeTakenSeconds, finalScore]
      );

      await client.query('COMMIT');

      await ensureRedisConnected();
      const keys = redisKeys(attempt.id);
      await redis.set(keys.status, 'SUBMITTED');

      return {
        attempt_id: attempt.id,
        status: 'SUBMITTED',
        final_score: finalScore,
        submitted_problem_ids: submittedProblemIds,
      };
    }

    await client.query('COMMIT');

    return {
      attempt_id: attempt.id,
      status: 'IN_PROGRESS',
      submitted_problem_ids: submittedProblemIds,
      remaining: Math.max(0, totalProblems - submittedProblemIds.length),
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const getResult = async (userId, query) => {
  const jobId = query?.job_id;
  if (!jobId) throw new AppError('job_id is required', 400);

  const candidateId = await assertCandidateProfile(userId);
  await assertAssignedToJob(jobId, candidateId);

  const attempt = await getActiveAttempt(jobId, candidateId);
  if (!attempt) throw new AppError('No DSA attempt found', 404);

  if (attempt.status !== 'SUBMITTED') throw new AppError('Round not submitted yet', 400);

  const subs = await pool.query(
    `SELECT problem_id, score, passed_hidden, total_hidden, created_at
     FROM dsa_round_submissions
     WHERE attempt_id = $1 AND is_final = TRUE
     ORDER BY created_at ASC`,
    [attempt.id]
  );

  const runCount = await pool.query('SELECT COUNT(*)::int AS cnt FROM dsa_round_run_logs WHERE attempt_id = $1', [attempt.id]);

  const antiCheatAgg = await pool.query(
    `SELECT event_type, COUNT(*)::int AS count
     FROM dsa_round_anti_cheat_events
     WHERE attempt_id = $1
     GROUP BY event_type`,
    [attempt.id]
  );

  return {
    attempt_id: attempt.id,
    job_id: attempt.job_id,
    status: attempt.status,
    started_at: attempt.started_at,
    ends_at: attempt.ends_at,
    submitted_at: attempt.submitted_at,
    time_taken_seconds: attempt.time_taken_seconds,
    final_score: attempt.final_score,
    per_problem: subs.rows,
    run_attempts: runCount.rows[0].cnt,
    anti_cheat: antiCheatAgg.rows,
  };
};
