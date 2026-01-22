import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RequireProfile = ({ children }) => {
    const { user, profile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!profile) {
        // Redirect to appropriate onboarding page based on role
        if (user.role === 'CANDIDATE') {
            return <Navigate to="/onboarding/candidate" replace />;
        } else if (user.role === 'RECRUITER') {
            return <Navigate to="/onboarding/recruiter" replace />;
        }
    }

    return children;
};

export default RequireProfile;
