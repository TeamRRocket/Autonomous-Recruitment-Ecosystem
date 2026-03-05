import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const { verifyEmail } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState('Verifying...');
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus('Invalid verification link.');
            setError(true);
            return;
        }

        const verify = async () => {
            try {
                await verifyEmail(token);
                setStatus('Email verified successfully! Redirecting...');
                setTimeout(() => navigate('/login'), 2000);
            } catch (err) {
                setStatus(err.toString());
                setError(true);
            }
        };

        verify();
    }, [token, verifyEmail, navigate]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="glass-card p-8 max-w-sm w-full text-center animate-fade-in">
                <h2 className="text-2xl font-bold font-heading gradient-text mb-4">Email Verification</h2>
                <p className={`text-lg ${error ? 'text-destructive' : 'text-success'}`}>
                    {status}
                </p>
                {error && (
                    <button
                        onClick={() => navigate('/login')}
                        className="mt-6 px-4 py-2 bg-accent hover:bg-accent/80 text-accent-foreground rounded-lg transition-colors"
                    >
                        Return to Login
                    </button>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
