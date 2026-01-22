import api from './api';

export const applyToJob = async (jobId, resumeFile) => {
    const formData = new FormData();
    formData.append('jobId', jobId);
    if (resumeFile) {
        formData.append('resume', resumeFile);
    }

    const response = await api.post('/api/applications', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getMyApplications = async () => {
    const response = await api.get('/api/applications/my-applications');
    return response.data;
};

export const getRecruiterApplications = async () => {
    const response = await api.get('/api/applications/recruiter');
    return response.data;
};

export const getApplicationsByJob = async (jobId) => {
    const response = await api.get(`/api/applications/job/${jobId}`);
    return response.data;
};

export const getApplicationById = async (applicationId) => {
    const response = await api.get(`/api/applications/${applicationId}`);
    return response.data;
};

export const updateApplicationStatus = async (applicationId, status) => {
    const response = await api.patch(`/api/applications/${applicationId}/status`, { status });
    return response.data;
};

export const checkApplication = async (jobId) => {
    const response = await api.get(`/api/applications/check?jobId=${jobId}`);
    return response.data;
};
