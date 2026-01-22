import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-xl max-w-sm w-full text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Email Verification</h2>
                <p className={`text-lg ${error ? 'text-red-400' : 'text-green-400'}`}>
                    {status}
                </p>
                {error && (
                    <button
                        onClick={() => navigate('/login')}
                        className="mt-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                        Return to Login
                    </button>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
