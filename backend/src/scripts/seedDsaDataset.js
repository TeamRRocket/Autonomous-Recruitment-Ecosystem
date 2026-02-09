import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATASET_PATH = path.resolve(__dirname, './dsa_dataset.json');

const normalizeDifficulty = (value) => {
  const v = (value || '').toString().trim().toLowerCase();
  if (['easy', 'medium', 'hard'].includes(v)) return v;
  return 'easy';
};

const readDataset = () => {
  const raw = fs.readFileSync(DATASET_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  if (!parsed || !Array.isArray(parsed.problems)) {
    throw new Error('Invalid dataset format: expected { problems: [...] }');
  }
  return parsed.problems;
};

const seed = async () => {
  const problems = readDataset();
  const client = await pool.connect();

  try {
    console.log(`Seeding DSA dataset from ${DATASET_PATH}`);
    console.log(`Problems found: ${problems.length}`);

    await client.query('BEGIN');

    for (const p of problems) {
      if (!p.id || !p.title || !p.problem_statement) {
        throw new Error(`Invalid problem entry (missing id/title/problem_statement): ${JSON.stringify(p).slice(0, 200)}`);
      }

      const difficulty = normalizeDifficulty(p.difficulty);
      const constraints = Array.isArray(p.constraints) ? p.constraints : null;
      const timeLimitMs = Number.isFinite(p.time_limit_ms) ? p.time_limit_ms : 1000;
      const memoryLimitMb = Number.isFinite(p.memory_limit_mb) ? p.memory_limit_mb : 256;

      const upsert = await client.query(
        `INSERT INTO dsa_bank_problems (
            dataset_id, title, difficulty, problem_statement, constraints, boilerplate_cpp,
            time_limit_ms, memory_limit_mb
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
          ON CONFLICT (dataset_id)
          DO UPDATE SET
            title = EXCLUDED.title,
            difficulty = EXCLUDED.difficulty,
            problem_statement = EXCLUDED.problem_statement,
            constraints = EXCLUDED.constraints,
            boilerplate_cpp = EXCLUDED.boilerplate_cpp,
            time_limit_ms = EXCLUDED.time_limit_ms,
            memory_limit_mb = EXCLUDED.memory_limit_mb,
            updated_at = CURRENT_TIMESTAMP
          RETURNING id`,
        [
          p.id,
          p.title,
          difficulty,
          p.problem_statement,
          constraints ? JSON.stringify(constraints) : null,
          p.boilerplate_cpp || null,
          timeLimitMs,
          memoryLimitMb,
        ]
      );

      const problemId = upsert.rows[0].id;

      await client.query('DELETE FROM dsa_bank_test_cases WHERE problem_id = $1', [problemId]);

      const tcs = Array.isArray(p.test_cases) ? p.test_cases : [];
      for (let i = 0; i < tcs.length; i += 1) {
        const tc = tcs[i];
        if (!tc || typeof tc.input !== 'string' || typeof tc.expected_output !== 'string') continue;

        await client.query(
          `INSERT INTO dsa_bank_test_cases (
              problem_id, test_order, input, expected_output, is_hidden
            ) VALUES ($1,$2,$3,$4,$5)`,
          [problemId, i + 1, tc.input, tc.expected_output, !!tc.is_hidden]
        );
      }
    }

    await client.query('COMMIT');

    const countProblems = await client.query('SELECT COUNT(*)::int AS cnt FROM dsa_bank_problems');
    const countCases = await client.query('SELECT COUNT(*)::int AS cnt FROM dsa_bank_test_cases');

    console.log(`Seed complete. dsa_bank_problems=${countProblems.rows[0].cnt}, dsa_bank_test_cases=${countCases.rows[0].cnt}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
