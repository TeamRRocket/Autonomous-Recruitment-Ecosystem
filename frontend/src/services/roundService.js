import api from './api';

/**
 * Save rounds for a job
 * @param {string} jobId 
 * @param {Array} rounds 
 */
export const saveRounds = async (jobId, rounds) => {
    const response = await api.post(`/api/rounds/${jobId}/rounds`, { rounds });
    return response.data;
};

/**
 * Get rounds for a job
 * @param {string} jobId 
 */
export const getRounds = async (jobId) => {
    const response = await api.get(`/api/rounds/${jobId}/rounds`);
    return response.data;
};

/**
 * Update a specific round
 * @param {string} jobId 
 * @param {string} roundId 
 * @param {Object} data 
 */
export const updateRound = async (jobId, roundId, data) => {
    const response = await api.put(`/api/rounds/${jobId}/rounds/${roundId}`, data);
    return response.data;
};

/**
 * Delete a specific round
 * @param {string} jobId 
 * @param {string} roundId 
 */
export const deleteRound = async (jobId, roundId) => {
    const response = await api.delete(`/api/rounds/${jobId}/rounds/${roundId}`);
    return response.data;
};
