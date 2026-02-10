import api from './api';

export const getJobScores = async (jobId) => {
  const response = await api.get(`/api/jobs/${jobId}/scores`);
  return response.data;
};
