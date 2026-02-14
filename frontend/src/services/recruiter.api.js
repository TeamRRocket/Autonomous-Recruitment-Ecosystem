import api from './api';

export const rankCandidates = async (jobId) => {
  const response = await api.post(`/api/recruiter/job/${jobId}/rank-candidates`);
  return response.data;
};

export const selectTopCandidates = async (jobId, payload) => {
  const response = await api.post(`/api/jobs/${jobId}/select-top`, payload);
  return response.data;
};
