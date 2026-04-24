import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Proctoring Service
 * API calls for proctoring session management
 */
class ProctoringService {
    /**
     * Start a new proctoring session
     */
    async startSession(jobId, roundType, attemptId, existingSessionId = null) {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/proctoring/start`,
                {
                    jobId,
                    roundType,
                    attemptId,
                    existingSessionId
                },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            return response.data.data.session;
        } catch (error) {
            console.error('Failed to start proctoring session:', error);
            throw error;
        }
    }

    /**
     * End a proctoring session
     */
    async endSession(sessionId) {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/proctoring/end`,
                { sessionId },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            return response.data.data.session;
        } catch (error) {
            console.error('Failed to end proctoring session:', error);
            throw error;
        }
    }

    /**
     * Get session summary
     */
    async getSessionSummary(sessionId) {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/proctoring/session/${sessionId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            return response.data.data;
        } catch (error) {
            console.error('Failed to get session summary:', error);
            throw error;
        }
    }
}

export default new ProctoringService();
