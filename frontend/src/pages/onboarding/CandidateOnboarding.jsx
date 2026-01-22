import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { createCandidateProfile } from '../../services/candidateService';
import Stepper from '../../components/ui/Stepper';
import InputGroup from '../../components/ui/InputGroup';
import toast from 'react-hot-toast';

const CandidateOnboarding = () => {
    const { fetchProfile, logout } = useAuth();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

    const steps = ['Basic Info', 'Experience & Skills', 'Preferences'];

    const [formData, setFormData] = useState({
        full_name: '',
        years_of_experience: 0,
        primary_skills: '',
        secondary_skills: '',
        preferred_roles: '',
        preferred_locations: '',
        resume_url: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNext = (e) => {
        e.preventDefault();
        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    };

    const handleBack = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                primary_skills: typeof formData.primary_skills === 'string' ? formData.primary_skills.split(',').map(s => s.trim()) : formData.primary_skills,
                secondary_skills: typeof formData.secondary_skills === 'string' ? formData.secondary_skills.split(',').map(s => s.trim()) : formData.secondary_skills,
                preferred_roles: typeof formData.preferred_roles === 'string' ? formData.preferred_roles.split(',').map(s => s.trim()) : formData.preferred_roles,
                preferred_locations: typeof formData.preferred_locations === 'string' ? formData.preferred_locations.split(',').map(s => s.trim()) : formData.preferred_locations
            };

            await createCandidateProfile(payload);
            await fetchProfile('CANDIDATE');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save profile');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl w-full space-y-8 glass-panel p-8 relative">
                <div className="text-center">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                        Candidate Profile
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">Step {currentStep + 1} of {steps.length}</p>
                </div>

                <Stepper steps={steps} currentStep={currentStep} />

                <form className="mt-8 space-y-6" onSubmit={currentStep === steps.length - 1 ? handleSubmit : handleNext}>

                    {currentStep === 0 && (
                        <div className="space-y-6 animate-fadeIn">
                            <InputGroup label="Full Name" name="full_name" placeholder="John Doe" required value={formData.full_name} onChange={handleChange} />
                            <InputGroup label="Years of Experience" name="years_of_experience" type="number" placeholder="5" required value={formData.years_of_experience} onChange={handleChange} />
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div className="space-y-6 animate-fadeIn">
                            <InputGroup label="Primary Skills (comma separated)" name="primary_skills" placeholder="React, Node.js, Python" required value={formData.primary_skills} onChange={handleChange} />
                            <InputGroup label="Secondary Skills" name="secondary_skills" placeholder="Docker, AWS, Git" value={formData.secondary_skills} onChange={handleChange} />
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-6 animate-fadeIn">
                            <InputGroup label="Preferred Roles" name="preferred_roles" placeholder="Senior Developer, Tech Lead" value={formData.preferred_roles} onChange={handleChange} />
                            <InputGroup label="Preferred Locations" name="preferred_locations" placeholder="Remote, New York" value={formData.preferred_locations} onChange={handleChange} />
                            <InputGroup label="Resume URL (PDF)" name="resume_url" placeholder="https://..." value={formData.resume_url} onChange={handleChange} />
                        </div>
                    )}

                    <div className="pt-6 flex justify-between gap-4">
                        {currentStep > 0 ? (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="w-full px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                Back
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                Logout
                            </button>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg shadow-blue-500/20 transition-all font-semibold"
                        >
                            {loading ? 'Saving...' : currentStep === steps.length - 1 ? 'Complete Profile' : 'Next Step'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CandidateOnboarding;
