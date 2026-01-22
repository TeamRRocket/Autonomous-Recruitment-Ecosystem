import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import CandidateDashboard from './dashboard/CandidateDashboard';
import RecruiterDashboard from './dashboard/RecruiterDashboard';

const Dashboard = () => {
    const { user } = useAuth(); // Profile already checked by RequireProfile

    if (user?.role === 'CANDIDATE') {
        return <CandidateDashboard />;
    }

    if (user?.role === 'RECRUITER') {
        return <RecruiterDashboard />;
    }

    return <div>Select a role...</div>;
};

export default Dashboard;
