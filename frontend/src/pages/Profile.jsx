import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Briefcase, MapPin, Code2, Building2, Save, LogOut, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateCandidateProfile } from '../services/candidateService';
import { updateRecruiterProfile } from '../services/recruiterService';

const Profile = () => {
    const { user, profile, fetchProfile, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (profile) {
            const data = { ...profile };
            // Convert arrays to strings for editing
            if (user?.role === 'CANDIDATE') {
                ['primary_skills', 'secondary_skills', 'preferred_roles', 'preferred_locations'].forEach(field => {
                    if (Array.isArray(data[field])) {
                        data[field] = data[field].join(', ');
                    }
                });
            }
            setFormData(data);
        }
    }, [profile, user?.role]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (user?.role === 'CANDIDATE') {
                const payload = {
                    ...formData,
                    primary_skills: typeof formData.primary_skills === 'string' ? formData.primary_skills.split(',').map(s => s.trim()) : formData.primary_skills,
                    secondary_skills: typeof formData.secondary_skills === 'string' ? formData.secondary_skills.split(',').map(s => s.trim()) : formData.secondary_skills,
                    preferred_roles: typeof formData.preferred_roles === 'string' ? formData.preferred_roles.split(',').map(s => s.trim()) : formData.preferred_roles,
                    preferred_locations: typeof formData.preferred_locations === 'string' ? formData.preferred_locations.split(',').map(s => s.trim()) : formData.preferred_locations
                };
                await updateCandidateProfile(payload);
            } else {
                await updateRecruiterProfile(formData);
            }
            await fetchProfile(user?.role);
            toast.success('Profile updated successfully');
            setIsEditing(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (!profile) return <div className="p-8 text-center text-slate-400">Loading profile...</div>;

    const initials = profile.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
        : user?.email?.charAt(0).toUpperCase();

    return (
        <div className="max-w-xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -ml-32 -mb-32"></div>

                <div className="p-10 relative z-10">
                    <div className="flex flex-col items-center mb-12">
                        <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-xl shadow-blue-500/20 mb-6">
                            <div className="h-full w-full rounded-[1.4rem] bg-slate-900 flex items-center justify-center text-3xl font-bold text-white uppercase">
                                {initials}
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-white">{profile.full_name}</h1>
                        <p className="text-sm text-slate-500 font-medium uppercase tracking-[0.2em] mt-1">{user?.role}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Name Field */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name || ''}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 disabled:opacity-50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="flex items-center gap-3 px-4 py-3.5 bg-slate-900/30 border border-slate-800/50 rounded-2xl text-slate-400">
                                <Mail size={18} className="text-slate-500" />
                                <span className="font-medium">{profile?.email}</span>
                                <div className="ml-auto">
                                    <span className="text-[9px] font-bold text-green-500/50 uppercase tracking-tighter bg-green-500/5 px-1.5 py-0.5 rounded border border-green-500/10">Verified Account</span>
                                </div>
                            </div>
                        </div>

                        {/* Role Field */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{user?.role === 'CANDIDATE' ? 'Preferred Job Title' : 'Role in Company'}</label>
                            <div className="relative group">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                                <input
                                    type="text"
                                    name={user?.role === 'CANDIDATE' ? 'preferred_roles' : 'job_title'}
                                    value={(user?.role === 'CANDIDATE' ? formData.preferred_roles : formData.job_title) || ''}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    placeholder={user?.role === 'CANDIDATE' ? "e.g. Software Engineer" : "e.g. Head of Talent"}
                                    className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 disabled:opacity-50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        {user?.role === 'CANDIDATE' && (
                            <>
                                {/* Primary Skills */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Primary Technical Skills (Comma separated)</label>
                                    <div className="relative group">
                                        <Code2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                                        <input
                                            type="text"
                                            name="primary_skills"
                                            value={formData.primary_skills || ''}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            placeholder="e.g. React, Node.js, Python"
                                            className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 disabled:opacity-50 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Secondary Skills */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Secondary / Soft Skills</label>
                                    <div className="relative group">
                                        <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                                        <input
                                            type="text"
                                            name="secondary_skills"
                                            value={formData.secondary_skills || ''}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            placeholder="e.g. Project Management, AWS, SQL"
                                            className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 disabled:opacity-50 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex gap-4 pt-6">
                            {!isEditing ? (
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all border border-slate-700/50 shadow-lg"
                                >
                                    Edit Profile
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 bg-slate-800/50 hover:bg-slate-800 text-slate-400 font-bold py-4 rounded-2xl transition-all border border-slate-700/30"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                Save Settings
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </form>

                    <div className="mt-12 flex justify-center">
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 text-slate-500 hover:text-red-400 transition-colors text-sm font-medium"
                        >
                            <LogOut size={16} />
                            Sign out securely
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
