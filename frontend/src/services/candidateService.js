import api from './api';

export const createCandidateProfile = async (profileData) => {
    const response = await api.post('/api/candidates/profile', profileData);
    return response.data;
};

export const getCandidateProfile = async () => {
    const response = await api.get('/api/candidates/profile');
    return response.data;
};

export const updateCandidateProfile = async (profileData) => {
    const response = await api.put('/api/candidates/profile', profileData);
    return response.data;
};
