import api from './api';

export const onboardRecruiter = async (data) => {
    const response = await api.post('/api/recruiters/onboarding', data);
    return response.data;
};

export const getRecruiterProfile = async () => {
    const response = await api.get('/api/recruiters/profile');
    return response.data;
};

export const updateRecruiterProfile = async (data) => {
    const response = await api.put('/api/recruiters/profile', data);
    return response.data;
};
