import api from './api';

export const startAptitudeRound = async (jobId) => {
  const response = await api.post('/api/aptitude/start', { jobId });
  return response.data;
};

export const submitAptitudeRound = async ({ attemptId, answers }) => {
  const response = await api.post('/api/aptitude/submit', { attemptId, answers });
  return response.data;
};

export const getAptitudeStatus = async (jobId) => {
  const response = await api.get('/api/aptitude/status', { params: { jobId } });
  return response.data;
};
