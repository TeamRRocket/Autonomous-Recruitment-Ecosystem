import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultDatasetPath = path.resolve(__dirname, '../../../datasets/leetcode_dataset.csv');

const getArgValue = (key) => {
  const idx = process.argv.findIndex((a) => a === key);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
};

const DATASET_PATH = getArgValue('--dataset') || process.env.DSA_DATASET_PATH || defaultDatasetPath;

const normalizeDifficulty = (value) => {
  const v = (value || '').toString().trim().toLowerCase();
  if (['easy', 'medium', 'hard'].includes(v)) return v;
  return 'easy';
};

const normalizeDifficultyFromCsv = (value) => {
  const v = (value || '').toString().trim().toLowerCase();
  if (v === 'easy') return 'easy';
  if (v === 'medium') return 'medium';
  if (v === 'hard') return 'hard';
  return 'easy';
};

// Minimal CSV parser that supports quoted fields containing commas/newlines.
const parseCsv = (raw) => {
  const rows = [];
  let current = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];

    if (ch === '"') {
      const next = raw[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === ',' && !inQuotes) {
      row.push(current);
      current = '';
      continue;
    }

    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && raw[i + 1] === '\n') i += 1;
      row.push(current);
      current = '';
      if (row.length > 1) rows.push(row);
      row = [];
      continue;
    }

    current += ch;
  }

  row.push(current);
  if (row.length > 1) rows.push(row);
  return rows;
};

const readDataset = () => {
  if (!fs.existsSync(DATASET_PATH)) {
    throw new Error(`Dataset not found at: ${DATASET_PATH}`);
  }

  const raw = fs.readFileSync(DATASET_PATH, 'utf8');
  const rows = parseCsv(raw);
  if (!rows.length) return [];

  const header = rows[0].map((h) => (h || '').toString().trim());
  const idxId = header.findIndex((h) => h.toLowerCase() === 'id');
  const idxTitle = header.findIndex((h) => h.toLowerCase() === 'title');
  const idxDesc = header.findIndex((h) => h.toLowerCase() === 'description');
  const idxDiff = header.findIndex((h) => h.toLowerCase() === 'difficulty');

  if (idxId === -1 || idxTitle === -1 || idxDesc === -1 || idxDiff === -1) {
    throw new Error('Unexpected CSV header. Expected columns: id,title,description,difficulty');
  }

  const problems = [];
  for (let i = 1; i < rows.length; i += 1) {
    const r = rows[i];
    const datasetId = (r[idxId] || '').toString().trim();
    const title = (r[idxTitle] || '').toString().trim();
    const statement = (r[idxDesc] || '').toString().trim();
    const difficulty = normalizeDifficultyFromCsv(r[idxDiff]);
    if (!datasetId || !title || !statement) continue;
    problems.push({ dataset_id: datasetId, title, difficulty, problem_statement: statement });
  }

  return problems;
};

const seed = async () => {
  const problems = readDataset();
  const client = await pool.connect();

  try {
    console.log(`Seeding DSA dataset from ${DATASET_PATH}`);
    console.log(`Problems found: ${problems.length}`);

    await client.query('BEGIN');

    for (const p of problems) {
      if (!p.dataset_id || !p.title || !p.problem_statement) {
        throw new Error(`Invalid problem entry (missing dataset_id/title/problem_statement): ${JSON.stringify(p).slice(0, 200)}`);
      }

      const difficulty = normalizeDifficulty(p.difficulty);
      const constraints = null;
      const timeLimitMs = 1000;
      const memoryLimitMb = 256;

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
          p.dataset_id,
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

      // No testcases in this dataset. Keep any existing testcases intact.
      void problemId;
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
