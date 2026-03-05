import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
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
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md glass-card p-8 animate-fade-in">
                <h2 className="text-center mb-4 text-3xl font-bold font-heading gradient-text">Set Password</h2>
                <p className="text-center mb-8 text-muted-foreground">
                    Create a password to login with email next time.
                </p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-foreground">New Password</label>
                        <input
                            type="password"
                            className="w-full bg-input border border-border text-foreground rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-foreground">Confirm Password</label>
                        <input
                            type="password"
                            className="w-full bg-input border border-border text-foreground rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">Password Requirements:</p>
                        <ul className="grid grid-cols-2 gap-2">
                            {requirements.map((req, index) => (
                                <li key={index} className={`text-xs flex items-center gap-1 transition-colors ${
                                    req.met ? 'text-success' : 'text-muted-foreground'
                                }`}>
                                    {req.met ? '✓' : '○'} {req.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <button type="submit" className="w-full gradient-primary hover:opacity-90 text-white font-semibold py-2.5 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg mt-6">
                        Set Password
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SetPassword;
