import api from './api';

export const listDsaBankProblems = async ({ difficulty, limit, offset } = {}) => {
  const params = {};
  if (difficulty) params.difficulty = difficulty;
  if (limit != null) params.limit = limit;
  if (offset != null) params.offset = offset;
  const response = await api.get('/api/dsa/bank', { params });
  return response.data;
};

export const upsertDsaConfig = async (payload) => {
  const response = await api.post('/api/dsa/config', payload);
  return response.data;
};

export const publishDsaConfig = async (job_id) => {
  const response = await api.post('/api/dsa/publish', { job_id });
  return response.data;
};

export const getDsaConfig = async (job_id) => {
  const response = await api.get('/api/dsa/config', { params: { job_id } });
  return response.data;
};

// Candidate
export const startDsaRound = async (job_id) => {
  const response = await api.post('/api/dsa/start', { job_id });
  return response.data;
};

export const getDsaStatus = async (job_id) => {
  const response = await api.get('/api/dsa/status', { params: { job_id } });
  return response.data;
};

export const runDsa = async ({ job_id, attempt_id, problem_id, source_code, stdin }) => {
  const response = await api.post('/api/dsa/run', { job_id, attempt_id, problem_id, source_code, stdin });
  return response.data;
};

export const saveDsaDraft = async ({ job_id, attempt_id, problem_id, source_code }) => {
  const response = await api.post('/api/dsa/save', { job_id, attempt_id, problem_id, source_code });
  return response.data;
};

export const submitDsa = async ({ job_id, attempt_id, solutions, anti_cheat_events }) => {
  const response = await api.post('/api/dsa/submit', { job_id, attempt_id, solutions, anti_cheat_events });
  return response.data;
};

export const getDsaResult = async (job_id) => {
  const response = await api.get('/api/dsa/result', { params: { job_id } });
  return response.data;
};
