import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const SetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { setPassword: setAuthPassword, logout } = useAuth();
    const navigate = useNavigate();

    const validate = () => {
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return false;
        }
        if (password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return false;
        }
        if (!/\d/.test(password)) {
            toast.error("Password must contain at least one number");
            return false;
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            toast.error("Password must contain at least one special character");
            return false;
        }
        if (!/[A-Z]/.test(password)) {
            toast.error("Password must contain at least one capital letter");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            await setAuthPassword(password);
            logout();
            toast.success('Password set successfully! Please login.');
            navigate('/login');
        } catch (error) {
            toast.error(String(error));
        }
    };

    const requirements = [
        { label: 'At least 8 characters', met: password.length >= 8 },
        { label: 'One number', met: /\d/.test(password) },
        { label: 'One special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
        { label: 'One capital letter', met: /[A-Z]/.test(password) },
    ];

    return (
        <div className="auth-container">
            <div className="auth-card glass-panel">
                <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.8rem' }}>Set Password</h2>
                <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                    Create a password to login with email next time.
                </p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>New Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Confirm Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Password Requirements:</p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            {requirements.map((req, index) => (
                                <li key={index} style={{
                                    fontSize: '0.8rem',
                                    color: req.met ? '#10b981' : 'var(--text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    transition: 'color 0.2s'
                                }}>
                                    {req.met ? '✓' : '○'} {req.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                        Set Password
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SetPassword;
