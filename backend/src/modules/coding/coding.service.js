import { pool } from '../../config/db.js';
import AppError from '../../utils/AppError.js';
import * as judge0 from './judge0.service.js';

const CPP_LANGUAGE_ID = 54; // GNU C++17 on Judge0 CE

const assertCodingRound = async (roundId) => {
  const roundRes = await pool.query('SELECT * FROM interview_rounds WHERE id = $1', [roundId]);
  if (roundRes.rows.length === 0) {
    throw new AppError('Round not found', 404);
  }
  if (roundRes.rows[0].round_type !== 'CODING') {
    throw new AppError('Round is not a CODING round', 400);
  }
  return roundRes.rows[0];
};

const getCandidateIdByUserId = async (userId) => {
  const result = await pool.query('SELECT id FROM candidate_profiles WHERE user_id = $1', [userId]);
  if (result.rows.length === 0) {
    throw new AppError('Candidate profile not found', 404);
  }
  return result.rows[0].id;
};

export const upsertProblem = async (roundId, recruiterUserId, payload) => {
  const round = await assertCodingRound(roundId);

  const recruiterRes = await pool.query('SELECT id FROM recruiters WHERE user_id = $1', [recruiterUserId]);
  if (recruiterRes.rows.length === 0) {
    throw new AppError('Recruiter profile not found', 404);
  }

  const jobRes = await pool.query('SELECT recruiter_id FROM jobs WHERE id = $1', [round.job_id]);
  if (jobRes.rows.length === 0) {
    throw new AppError('Job not found', 404);
  }
  if (jobRes.rows[0].recruiter_id !== recruiterRes.rows[0].id) {
    throw new AppError('Access denied', 403);
  }

  const {
    title,
    statement,
    constraints,
    input_format,
    output_format,
    sample_input,
    sample_output,
    time_limit_seconds,
    memory_limit_mb,
    test_cases,
  } = payload;

  if (!title || !statement) {
    throw new AppError('title and statement are required', 400);
  }

  if (!Array.isArray(test_cases) || test_cases.length === 0) {
    throw new AppError('At least one test case is required', 400);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT id FROM coding_problems WHERE round_id = $1', [roundId]);
    let problemId;
    if (existing.rows.length > 0) {
      problemId = existing.rows[0].id;
      await client.query(
        `UPDATE coding_problems
         SET title = $2,
             statement = $3,
             constraints = $4,
             input_format = $5,
             output_format = $6,
             sample_input = $7,
             sample_output = $8,
             time_limit_seconds = $9,
             memory_limit_mb = $10,
             updated_at = CURRENT_TIMESTAMP
         WHERE round_id = $1`,
        [
          roundId,
          title,
          statement,
          constraints || null,
          input_format || null,
          output_format || null,
          sample_input || null,
          sample_output || null,
          time_limit_seconds || 2,
          memory_limit_mb || 256,
        ]
      );

      await client.query('DELETE FROM coding_test_cases WHERE problem_id = $1', [problemId]);
    } else {
      const insert = await client.query(
        `INSERT INTO coding_problems (
           round_id, title, statement, constraints, input_format, output_format,
           sample_input, sample_output, time_limit_seconds, memory_limit_mb
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING id`,
        [
          roundId,
          title,
          statement,
          constraints || null,
          input_format || null,
          output_format || null,
          sample_input || null,
          sample_output || null,
          time_limit_seconds || 2,
          memory_limit_mb || 256,
        ]
      );
      problemId = insert.rows[0].id;
    }

    for (const tc of test_cases) {
      if (!tc || typeof tc.input !== 'string' || typeof tc.expected_output !== 'string') {
        throw new AppError('Each test case must have input and expected_output strings', 400);
      }
      await client.query(
        `INSERT INTO coding_test_cases (problem_id, input, expected_output, is_sample)
         VALUES ($1, $2, $3, $4)`,
        [problemId, tc.input, tc.expected_output, !!tc.is_sample]
      );
    }

    await client.query('COMMIT');

    return await getProblemForRecruiter(roundId, recruiterUserId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getProblemForRecruiter = async (roundId, recruiterUserId) => {
  const round = await assertCodingRound(roundId);

  const recruiterRes = await pool.query('SELECT id FROM recruiters WHERE user_id = $1', [recruiterUserId]);
  if (recruiterRes.rows.length === 0) {
    throw new AppError('Recruiter profile not found', 404);
  }

  const jobRes = await pool.query('SELECT recruiter_id FROM jobs WHERE id = $1', [round.job_id]);
  if (jobRes.rows.length === 0) {
    throw new AppError('Job not found', 404);
  }
  if (jobRes.rows[0].recruiter_id !== recruiterRes.rows[0].id) {
    throw new AppError('Access denied', 403);
  }

  const problemRes = await pool.query('SELECT * FROM coding_problems WHERE round_id = $1', [roundId]);
  if (problemRes.rows.length === 0) {
    throw new AppError('Coding problem not found for this round', 404);
  }

  const problem = problemRes.rows[0];
  const tcs = await pool.query(
    'SELECT id, input, expected_output, is_sample, created_at FROM coding_test_cases WHERE problem_id = $1 ORDER BY created_at ASC',
    [problem.id]
  );

  return { ...problem, test_cases: tcs.rows };
};

export const getProblemForCandidate = async (roundId) => {
  await assertCodingRound(roundId);

  const problemRes = await pool.query('SELECT * FROM coding_problems WHERE round_id = $1', [roundId]);
  if (problemRes.rows.length === 0) {
    throw new AppError('Coding problem not found for this round', 404);
  }

  const problem = problemRes.rows[0];
  const samples = await pool.query(
    'SELECT id, input, expected_output, is_sample FROM coding_test_cases WHERE problem_id = $1 AND is_sample = TRUE ORDER BY created_at ASC',
    [problem.id]
  );

  // Candidate only sees sample tests + statement
  return {
    id: problem.id,
    round_id: problem.round_id,
    title: problem.title,
    statement: problem.statement,
    constraints: problem.constraints,
    input_format: problem.input_format,
    output_format: problem.output_format,
    sample_input: problem.sample_input,
    sample_output: problem.sample_output,
    time_limit_seconds: problem.time_limit_seconds,
    memory_limit_mb: problem.memory_limit_mb,
    samples: samples.rows,
    language: { id: CPP_LANGUAGE_ID, name: 'C++ (GNU++17)' },
  };
};

export const runCode = async (roundId, userId, sourceCode, stdin) => {
  await assertCodingRound(roundId);
  await getCandidateIdByUserId(userId);

  if (!sourceCode) {
    throw new AppError('source_code is required', 400);
  }

  const stdinValue = (stdin ?? '').toString();
  if (stdinValue.trim()) {
    const result = await judge0.run({
      language_id: CPP_LANGUAGE_ID,
      source_code: sourceCode,
      stdin: stdinValue,
    });
    return result;
  }

  const problemRes = await pool.query('SELECT id, time_limit_seconds, memory_limit_mb FROM coding_problems WHERE round_id = $1', [roundId]);
  if (problemRes.rows.length === 0) {
    throw new AppError('Coding problem not found for this round', 404);
  }
  const problem = problemRes.rows[0];

  const samplesRes = await pool.query(
    'SELECT input, expected_output FROM coding_test_cases WHERE problem_id = $1 AND is_sample = TRUE ORDER BY created_at ASC',
    [problem.id]
  );

  if (samplesRes.rows.length === 0) {
    const result = await judge0.run({
      language_id: CPP_LANGUAGE_ID,
      source_code: sourceCode,
      stdin: '',
    });
    return result;
  }

  const results = await evaluateAgainstTestCases({
    sourceCode,
    testCases: samplesRes.rows,
    timeLimitSeconds: problem.time_limit_seconds || 2,
    memoryLimitMb: problem.memory_limit_mb || 256,
  });

  return { results };
};

const evaluateAgainstTestCases = async ({ sourceCode, testCases, timeLimitSeconds, memoryLimitMb }) => {
  const normalizeOutput = (v) => (v ?? '').toString().replace(/\r\n/g, '\n').trimEnd();

  const results = [];
  for (const tc of testCases) {
    const runRes = await judge0.run({
      language_id: CPP_LANGUAGE_ID,
      source_code: sourceCode,
      stdin: tc.input,
      cpu_time_limit: timeLimitSeconds,
      memory_limit: memoryLimitMb,
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
      status,
      passed,
      stdout: runRes.stdout || '',
      stderr: runRes.stderr || '',
      compile_output: runRes.compile_output || '',
      time: runRes.time || null,
      memory: runRes.memory || null,
    });
  }

  return results;
};

export const submitCode = async (roundId, userId, sourceCode) => {
  await assertCodingRound(roundId);
  const candidateId = await getCandidateIdByUserId(userId);

  if (!sourceCode) {
    throw new AppError('source_code is required', 400);
  }

  const problemRes = await pool.query('SELECT * FROM coding_problems WHERE round_id = $1', [roundId]);
  if (problemRes.rows.length === 0) {
    throw new AppError('Coding problem not found for this round', 404);
  }
  const problem = problemRes.rows[0];

  const testsRes = await pool.query(
    'SELECT input, expected_output FROM coding_test_cases WHERE problem_id = $1 ORDER BY created_at ASC',
    [problem.id]
  );
  const testCases = testsRes.rows;

  const submissionInsert = await pool.query(
    `INSERT INTO coding_submissions (problem_id, candidate_id, language_id, source_code, status)
     VALUES ($1, $2, $3, $4, 'RUNNING')
     RETURNING *`,
    [problem.id, candidateId, CPP_LANGUAGE_ID, sourceCode]
  );

  const submission = submissionInsert.rows[0];

  const results = await evaluateAgainstTestCases({
    sourceCode,
    testCases,
    timeLimitSeconds: problem.time_limit_seconds || 2,
    memoryLimitMb: problem.memory_limit_mb || 256,
  });

  const passedTests = results.filter((r) => r.passed).length;
  const totalTests = results.length;
  const overallStatus = passedTests === totalTests ? 'ACCEPTED' : 'FAILED';

  const worst = results.find((r) => !r.passed) || results[0];

  await pool.query(
    `UPDATE coding_submissions
     SET status = $2,
         total_tests = $3,
         passed_tests = $4,
         stdout = $5,
         stderr = $6,
         compile_output = $7,
         time = $8,
         memory = $9
     WHERE id = $1`,
    [
      submission.id,
      overallStatus,
      totalTests,
      passedTests,
      worst?.stdout || null,
      worst?.stderr || null,
      worst?.compile_output || null,
      worst?.time || null,
      worst?.memory || null,
    ]
  );

  return await getSubmission(submission.id, userId, true);
};

export const getSubmission = async (submissionId, userId, allowCandidate = false) => {
  const subRes = await pool.query('SELECT * FROM coding_submissions WHERE id = $1', [submissionId]);
  if (subRes.rows.length === 0) {
    throw new AppError('Submission not found', 404);
  }

  const submission = subRes.rows[0];

  if (allowCandidate) {
    const candidateId = await getCandidateIdByUserId(userId);
    if (submission.candidate_id !== candidateId) {
      throw new AppError('Access denied', 403);
    }
  }

  return submission;
};

export const listSubmissionsForRound = async (roundId, recruiterUserId) => {
  const round = await assertCodingRound(roundId);

  const recruiterRes = await pool.query('SELECT id FROM recruiters WHERE user_id = $1', [recruiterUserId]);
  if (recruiterRes.rows.length === 0) {
    throw new AppError('Recruiter profile not found', 404);
  }

  const jobRes = await pool.query('SELECT recruiter_id FROM jobs WHERE id = $1', [round.job_id]);
  if (jobRes.rows.length === 0) {
    throw new AppError('Job not found', 404);
  }
  if (jobRes.rows[0].recruiter_id !== recruiterRes.rows[0].id) {
    throw new AppError('Access denied', 403);
  }

  const problemRes = await pool.query('SELECT id FROM coding_problems WHERE round_id = $1', [roundId]);
  if (problemRes.rows.length === 0) {
    throw new AppError('Coding problem not found for this round', 404);
  }

  const subs = await pool.query(
    `SELECT cs.*, cp.full_name as candidate_name
     FROM coding_submissions cs
     JOIN candidate_profiles cp ON cs.candidate_id = cp.id
     WHERE cs.problem_id = $1
     ORDER BY cs.created_at DESC`,
    [problemRes.rows[0].id]
  );

  return subs.rows;
};
