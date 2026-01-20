import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const { verifyEmail } = useAuth();
    const [status, setStatus] = useState('verifying'); // verifying, success, error

    useEffect(() => {
        if (!token) {
            setStatus('error');
            return;
        }
        verifyEmail(token)
            .then(() => {
                setStatus('success');
                toast.success('Email verified successfully!');
            })
            .catch((err) => {
                console.error(err);
                setStatus('error');
                toast.error('Verification failed. Token may be invalid or expired.');
            });
    }, [token]);

    return (
        <div className="auth-container">
            <div className="auth-card glass-panel" style={{ textAlign: 'center' }}>
                {status === 'verifying' && <h2>Verifying...</h2>}
                {status === 'success' && (
                    <>
                        <h2 style={{ color: 'var(--success)' }}>Email Verified!</h2>
                        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
                            Your account is now active.
                        </p>
                        <div style={{ marginTop: '2rem' }}>
                            <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                                Proceed to Login
                            </Link>
                        </div>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <h2 style={{ color: 'var(--error)' }}>Verification Failed</h2>
                        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
                            The link may be broken or expired.
                        </p>
                        <div style={{ marginTop: '2rem' }}>
                            <Link to="/signup" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                                Back to Signup
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
