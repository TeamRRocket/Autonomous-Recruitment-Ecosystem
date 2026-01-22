import api from './api';

// Recruiter
export const createJob = async (jobData) => {
    const response = await api.post('/api/jobs', jobData);
    return response.data;
};

export const updateJob = async (jobId, jobData) => {
    const response = await api.patch(`/api/jobs/${jobId}`, jobData);
    return response.data;
};

export const getMyJobs = async () => {
    const response = await api.get('/api/jobs/recruiter/my-jobs');
    return response.data;
};

// Candidate & Public (Authenticated)
export const getPublishedJobs = async () => {
    const response = await api.get('/api/jobs/published');
    return response.data;
};

export const getJobById = async (id) => {
    const response = await api.get(`/api/jobs/${id}`);
    return response.data;
};

export const searchJobs = async (query) => {
    const response = await api.get(`/api/jobs/search?q=${encodeURIComponent(query)}`);
    return response.data;
};

export const deleteJob = async (jobId) => {
    const response = await api.delete(`/api/jobs/${jobId}`);
    return response.data;
};

export const publishJob = async (id) => {
    const response = await api.post(`/api/jobs/${id}/publish`);
    return response.data;
};

export const getJobOverview = async (id) => {
    const response = await api.get(`/api/jobs/${id}/overview`);
    return response.data;
};
