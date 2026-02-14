import axios from 'axios';
import AppError from '../utils/AppError.js';

const AI_SERVICE_URL = 'http://localhost:8000/ai/resume/score';

export const scoreResume = async (payload) => {
  const config = {
    timeout: 60000,
  };

  try {
    const response = await axios.post(AI_SERVICE_URL, payload, config);
    return response.data;
  } catch (error) {
    try {
      const retryResponse = await axios.post(AI_SERVICE_URL, payload, config);
      return retryResponse.data;
    } catch (retryError) {
      const message = retryError.response?.data?.detail || retryError.message || 'AI service unavailable';
      throw new AppError(message, 502);
    }
  }
};
