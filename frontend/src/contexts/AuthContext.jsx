import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Ideally fetch full user profile here, but for now use decoded token
                // Or store user details in localStorage too (less secure for details but okay for name)
                // Let's assume we decode role and id from token.
                // If the token is expired, jwtDecode might throw or returning expired.
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    setUser(decoded);
                }
            } catch (error) {
                console.error("Invalid token", error);
                logout();
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, data } = response.data;
            localStorage.setItem('token', token);
            setUser(jwtDecode(token)); // Or use data.user
            return data;
        } catch (error) {
            throw error.response?.data?.message || 'Login failed';
        }
    };

    const signup = async (email, password, role) => {
        try {
            const response = await api.post('/auth/signup', { email, password, role });
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || 'Signup failed';
        }
    };

    const verifyEmail = async (token) => {
        try {
            const response = await api.get(`/auth/verify-email?token=${token}`);
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || 'Verification failed';
        }
    };

    const googleLogin = async (idToken, role) => {
        try {
            const response = await api.post('/auth/google', { idToken, role });
            const { token, data } = response.data;
            localStorage.setItem('token', token);
            setUser(jwtDecode(token));
            return data;
        } catch (error) {
            throw error.response?.data?.message || 'Google Login failed';
        }
    };

    const setPassword = async (password) => {
        try {
            const response = await api.post('/auth/set-password', { password });
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || 'Failed to set password';
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, verifyEmail, googleLogin, setPassword, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
