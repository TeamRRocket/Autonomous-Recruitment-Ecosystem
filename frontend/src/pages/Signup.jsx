import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('CANDIDATE');
    const { signup, googleLogin } = useAuth();
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            await googleLogin(credentialResponse.credential, role);
            toast.success('Signed up successfully!');
            navigate('/set-password');
        } catch (error) {
            toast.error(String(error));
        }
    };

    const handleGoogleError = () => {
        toast.error('Google Signup Failed');
    };

    return (
        <div className="auth-container">
            <div className="auth-card glass-panel">
                <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '2rem' }}>Create Account</h2>
                <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                    Join HireFlow AI to get started.
                </p>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>I am a...</label>
                    <select
                        className="input-field"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    >
                        <option value="CANDIDATE">Candidate</option>
                        <option value="RECRUITER">Recruiter</option>
                    </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="filled_blue"
                        size="large"
                        text="signup_with"
                        width="280"
                    />
                </div>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Login</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
