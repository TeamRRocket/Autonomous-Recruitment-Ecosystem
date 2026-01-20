import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000', // Backend URL
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the JWT token to headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 (Unauthorized) globally if needed?
        // For now just pass it through
        return Promise.reject(error);
    }
);

export default api;
