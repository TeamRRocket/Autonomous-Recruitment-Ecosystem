import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (role) => {
        try {
            let data;
            if (role === 'CANDIDATE') {
                const { getCandidateProfile } = await import('../services/candidateService');
                const res = await getCandidateProfile();
                data = res.data;
            } else if (role === 'RECRUITER') {
                const { getRecruiterProfile } = await import('../services/recruiterService');
                const res = await getRecruiterProfile();
                data = res.data;
            }
            setProfile(data);
        } catch (error) {
            console.log('Profile not found or error fetching profile:', error);
            setProfile(null);
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    if (decoded.exp * 1000 < Date.now()) {
                        logout();
                    } else {
                        setUser(decoded);
                        await fetchProfile(decoded.role);
                    }
                } catch (error) {
                    console.error("Invalid token", error);
                    logout();
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, data } = response.data;
            localStorage.setItem('token', token);
            const decoded = jwtDecode(token);
            setUser(decoded);
            await fetchProfile(decoded.role);
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
            const decoded = jwtDecode(token);
            setUser(decoded);
            await fetchProfile(decoded.role);
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
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, profile, setProfile, fetchProfile, login, signup, verifyEmail, googleLogin, setPassword, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
