import api from './api';

// Recruiter
export const upsertCodingProblem = async (roundId, payload) => {
  const response = await api.post(`/api/coding/round/${roundId}/problem`, payload);
  return response.data;
};

export const getCodingProblemForRecruiter = async (roundId) => {
  const response = await api.get(`/api/coding/round/${roundId}/problem`);
  return response.data;
};

export const listCodingSubmissions = async (roundId) => {
  const response = await api.get(`/api/coding/round/${roundId}/submissions`);
  return response.data;
};

// Candidate
export const getCodingProblemForCandidate = async (roundId) => {
  const response = await api.get(`/api/coding/round/${roundId}`);
  return response.data;
};

export const runCoding = async (roundId, source_code, stdin) => {
  const response = await api.post(`/api/coding/round/${roundId}/run`, { source_code, stdin });
  return response.data;
};

export const submitCoding = async (roundId, source_code) => {
  const response = await api.post(`/api/coding/round/${roundId}/submit`, { source_code });
  return response.data;
};

export const getSubmission = async (submissionId) => {
  const response = await api.get(`/api/coding/submission/${submissionId}`);
  return response.data;
};
