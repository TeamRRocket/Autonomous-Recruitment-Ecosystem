import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const technical = {
  /**
   * Start a technical interview round
   */
  start: async (jobId) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/api/technical/start`,
      { jobId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  /**
   * Submit an answer to a question
   */
  submitAnswer: async (attemptId, questionId, answer) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/api/technical/submit-answer`,
      { attemptId, questionId, answer },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  /**
   * Submit the complete interview
   */
  submit: async (attemptId) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/api/technical/submit`,
      { attemptId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  /**
   * Get interview status
   */
  getStatus: async (jobId) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_URL}/api/technical/status`,
      {
        params: { jobId },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  }
};

export default technical;
