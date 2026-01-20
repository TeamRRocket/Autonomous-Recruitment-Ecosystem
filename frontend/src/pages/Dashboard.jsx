import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
    const { user, logout } = useAuth();

    return (
        <div className="auth-container" style={{ alignItems: 'flex-start', padding: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2>HireFlow AI <span style={{ fontSize: '0.8em', opacity: 0.7 }}>Beta</span></h2>
                    <button onClick={logout} className="btn-primary" style={{ background: 'var(--error)' }}>
                        Logout
                    </button>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px' }}>
                    <h3 style={{ marginTop: 0 }}>Identity Verified</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>You have successfully authenticated via Phase 1 security protocols.</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <strong style={{ color: 'var(--accent-primary)' }}>User ID:</strong>
                        <span>{user?.id}</span>

                        <strong style={{ color: 'var(--accent-primary)' }}>Email:</strong>
                        <span>{user?.em || user?.email}</span>

                        <strong style={{ color: 'var(--accent-primary)' }}>Role:</strong>
                        <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            background: user?.role === 'RECRUITER' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                            color: user?.role === 'RECRUITER' ? 'var(--accent-primary)' : 'var(--success)',
                            borderRadius: '4px',
                            fontSize: '0.9em'
                        }}>
                            {user?.role}
                        </span>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    Phase 1 Complete: Auth & RBAC Active.
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
