import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultDatasetPath = path.resolve(__dirname, '../../../datasets/clean_general_aptitude_dataset.csv');

const getArgValue = (key) => {
  const idx = process.argv.findIndex((a) => a === key);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
};

const DATASET_PATH =
  getArgValue('--dataset') ||
  process.env.APTITUDE_DATASET_PATH ||
  defaultDatasetPath;

const safeTrim = (v) => (v == null ? '' : v.toString()).trim();

const normalizeCorrect = (value) => {
  const v = safeTrim(value).toUpperCase();
  if (['A', 'B', 'C', 'D'].includes(v)) return v;
  return null;
};

const difficultyForRow = (idx, total) => {
  // Dataset does not include difficulty. Assign deterministic buckets.
  const ratio = total > 0 ? idx / total : 0;
  if (ratio < 0.34) return 'easy';
  if (ratio < 0.67) return 'medium';
  return 'hard';
};

const parseCsv = (raw) => {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length <= 1) return [];

  const header = lines[0].split(';').map((h) => h.trim().toLowerCase());
  const expected = ['question', 'option a', 'option b', 'option c', 'option d', 'answer'];
  for (const col of expected) {
    if (!header.includes(col)) {
      throw new Error(`Unexpected CSV header. Missing column: ${col}`);
    }
  }

  const idxQuestion = header.indexOf('question');
  const idxA = header.indexOf('option a');
  const idxB = header.indexOf('option b');
  const idxC = header.indexOf('option c');
  const idxD = header.indexOf('option d');
  const idxAns = header.indexOf('answer');

  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const parts = lines[i].split(';');
    if (parts.length < header.length) continue;

    const questionText = safeTrim(parts[idxQuestion]);
    const optionA = safeTrim(parts[idxA]);
    const optionB = safeTrim(parts[idxB]);
    const optionC = safeTrim(parts[idxC]);
    const optionD = safeTrim(parts[idxD]);
    const correct = normalizeCorrect(parts[idxAns]);

    if (!questionText || !optionA || !optionB || !optionC || !optionD || !correct) continue;

    rows.push({
      question_text: questionText,
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      option_d: optionD,
      correct_option: correct,
    });
  }

  return rows;
};

const seed = async () => {
  if (!fs.existsSync(DATASET_PATH)) {
    throw new Error(`Dataset not found at: ${DATASET_PATH}`);
  }

  const raw = fs.readFileSync(DATASET_PATH, 'utf8');
  const parsed = parseCsv(raw);

  console.log(`Seeding Aptitude dataset from ${DATASET_PATH}`);
  console.log(`Rows parsed: ${parsed.length}`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Avoid duplicates by hashing question_text + options.
    // (No unique constraint exists; we'll do a simple existence check.)
    const total = parsed.length;
    let inserted = 0;

    for (let i = 0; i < parsed.length; i += 1) {
      const r = parsed[i];
      const difficulty = difficultyForRow(i, total);

      const exists = await client.query(
        `SELECT 1
         FROM aptitude_questions
         WHERE question_text = $1
           AND option_a = $2
           AND option_b = $3
           AND option_c = $4
           AND option_d = $5
         LIMIT 1`,
        [r.question_text, r.option_a, r.option_b, r.option_c, r.option_d]
      );

      if (exists.rows.length > 0) continue;

      await client.query(
        `INSERT INTO aptitude_questions (
            question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, topic
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [r.question_text, r.option_a, r.option_b, r.option_c, r.option_d, r.correct_option, difficulty, null]
      );
      inserted += 1;
    }

    await client.query('COMMIT');

    const cnt = await pool.query('SELECT COUNT(*)::int AS cnt FROM aptitude_questions');
    console.log(`Seed complete. inserted=${inserted}, aptitude_questions=${cnt.rows[0].cnt}`);
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
