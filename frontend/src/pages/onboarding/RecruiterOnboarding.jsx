import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { onboardRecruiter } from '../../services/recruiterService';
import InputGroup from '../../components/ui/InputGroup';

const RecruiterOnboarding = () => {
    const { fetchProfile, logout } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await onboardRecruiter({ full_name: formData.full_name });
            await fetchProfile('RECRUITER');
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to complete onboarding');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
            <div className="max-w-xl w-full space-y-8 glass-card p-8 md:p-10 relative">
                {/* Decorative blob */}
                <div className="absolute bottom-0 left-0 -ml-4 -mb-4 w-32 h-32 bg-primary rounded-full blur-3xl opacity-20 animate-pulse"></div>

                <div className="text-center relative z-10">
                    <h2 className="text-3xl font-bold font-heading gradient-text">
                        Complete Your Profile
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Add your name to start creating job postings.
                    </p>
                </div>

                <form className="mt-8 space-y-6 relative z-10" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded relative text-sm text-center" role="alert">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <InputGroup 
                            label="Your Full Name" 
                            name="full_name" 
                            placeholder="Jane Smith" 
                            required 
                            value={formData.full_name} 
                            onChange={handleChange} 
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white gradient-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-all duration-200 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : 'Complete Setup'}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-6">
                    <button
                        onClick={handleLogout}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 underline decoration-border hover:decoration-foreground"
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecruiterOnboarding;
