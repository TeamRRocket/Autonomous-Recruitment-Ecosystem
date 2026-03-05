import axios from 'axios';
import AppError from '../../utils/AppError.js';

// Public Judge0 CE
const JUDGE0_BASE_URL = 'https://ce.judge0.com';

// Polling configuration
const POLL_INTERVAL_MS = 650; // Time between polls
const BATCH_POLL_INTERVAL_MS = 800; // Time between batch polls
const POLL_TIMEOUT_MS = 60000; // Maximum time to wait for results

const api = axios.create({
  baseURL: JUDGE0_BASE_URL,
  timeout: 60000,
});

const decode = (value) => {
  if (!value) return '';
  try {
    return Buffer.from(value, 'base64').toString('utf8');
  } catch {
    return value;
  }
};

export const run = async ({ language_id, source_code, stdin }) => {
  let token;
  try {
    const create = await api.post(
      '/submissions?base64_encoded=true&wait=false',
      {
        language_id,
        source_code: Buffer.from(source_code || '').toString('base64'),
        stdin: Buffer.from(stdin || '').toString('base64'),
      },
      { timeout: 15000 }
    );

    token = create.data?.token;
    if (!token) {
      throw new AppError('Judge0 did not return a submission token', 502);
    }
  } catch (err) {
    const message =
      err.code === 'ECONNABORTED'
        ? 'Unable to reach Judge0 right now. Please try again later.'
        : err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND'
          ? 'Unable to reach Judge0 right now. Please try again later.'
          : err.response?.data?.error || err.message || 'Judge0 request failed';
    throw new AppError(message, 502);
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    try {
      const res = await api.get(
        `/submissions/${encodeURIComponent(token)}?base64_encoded=true`,
        { timeout: 10000 }
      );
      const data = res.data;

      const statusId = data.status?.id;
      if (statusId && ![1, 2].includes(statusId)) {
        return {
          status: data.status?.description || 'Unknown',
          stdout: decode(data.stdout),
          stderr: decode(data.stderr),
          compile_output: decode(data.compile_output),
          time: data.time || null,
          memory: data.memory || null,
        };
      }
    } catch (err) {
      // If a single poll request times out, retry until overall deadline is reached.
      if (err.code === 'ECONNABORTED') {
        // noop
      } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        throw new AppError('Unable to reach Judge0 right now. Please try again later.', 502);
      } else {
        const message = err.response?.data?.error || err.message || 'Judge0 poll failed';
        throw new AppError(message, 502);
      }
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new AppError('Judge0 timed out while waiting for results. Please try again.', 504);
};

export const submitBatch = async (submissions) => {
  try {
    const payload = {
      submissions: submissions.map((s) => ({
        language_id: s.language_id,
        source_code: Buffer.from(s.source_code || '').toString('base64'),
        stdin: Buffer.from(s.stdin || '').toString('base64'),
        expected_output: Buffer.from(s.expected_output || '').toString('base64'),
        cpu_time_limit: s.cpu_time_limit,
        memory_limit: s.memory_limit,
      })),
    };

    const response = await api.post('/submissions/batch?base64_encoded=true', payload);
    return response.data;
  } catch (err) {
    const message =
      err.code === 'ECONNABORTED'
        ? 'Judge0 timed out while submitting your code. Please try again.'
        : err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND'
          ? 'Unable to reach Judge0 right now. Please try again later.'
          : err.response?.data?.error || err.message || 'Judge0 batch submit failed';
    throw new AppError(message, 502);
  }
};

export const pollBatch = async (tokens) => {
  const joined = tokens.join(',');
  const startedAt = Date.now();

  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    try {
      const res = await api.get(`/submissions/batch?tokens=${encodeURIComponent(joined)}&base64_encoded=true`);
      const subs = res.data.submissions || [];

      const done = subs.every((s) => {
        const id = s.status?.id;
        return id && ![1, 2].includes(id);
      });

      if (done) {
        return subs.map((s) => ({
          ...s,
          stdout: decode(s.stdout),
          stderr: decode(s.stderr),
          compile_output: decode(s.compile_output),
          expected_output: decode(s.expected_output),
        }));
      }

      await new Promise((r) => setTimeout(r, BATCH_POLL_INTERVAL_MS));
    } catch (err) {
      const message =
        err.code === 'ECONNABORTED'
          ? 'Judge0 timed out while waiting for results. Please try again.'
          : err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND'
            ? 'Unable to reach Judge0 right now. Please try again later.'
            : err.response?.data?.error || err.message || 'Judge0 poll failed';
      throw new AppError(message, 502);
    }
  }

  throw new AppError('Judge0 timed out while waiting for results. Please try again.', 504);
};
