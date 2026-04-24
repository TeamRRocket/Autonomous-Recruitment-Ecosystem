import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Briefcase, MapPin, Code2, Building2, Save, LogOut, Target, Edit2, X } from 'lucide-react';
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
                    primary_skills: typeof formData.primary_skills === 'string' ? formData.primary_skills.split(',').map(s => s.trim()).filter(Boolean) : formData.primary_skills,
                    secondary_skills: typeof formData.secondary_skills === 'string' ? formData.secondary_skills.split(',').map(s => s.trim()).filter(Boolean) : formData.secondary_skills,
                    preferred_roles: typeof formData.preferred_roles === 'string' ? formData.preferred_roles.split(',').map(s => s.trim()).filter(Boolean) : formData.preferred_roles,
                    preferred_locations: typeof formData.preferred_locations === 'string' ? formData.preferred_locations.split(',').map(s => s.trim()).filter(Boolean) : formData.preferred_locations
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

    if (!profile) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    const initials = profile.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : user?.email?.charAt(0).toUpperCase();

    // Helper to render tags from comma-separated string or array
    const renderTags = (data) => {
        if (!data) return null;
        const list = Array.isArray(data) ? data : String(data).split(',').map(s => s.trim());
        if (list.length === 0 || (list.length === 1 && !list[0])) return <span className="text-muted-foreground text-sm">Not specified</span>;
        
        return (
            <div className="flex flex-wrap gap-2">
                {list.map((tag, i) => (
                    <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary/10 border border-border/20 text-foreground/80 hover:bg-secondary/20 transition-colors cursor-default">
                        {tag}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 animate-fade-in space-y-6">
            <h1 className="text-3xl font-bold text-white font-heading">Profile</h1>

            {/* Identity Card */}
            <div className="bg-secondary/5 border border-border/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 backdrop-blur-sm">
                <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-blue-900/20">
                        {initials}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">{profile.full_name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2.5 py-0.5 rounded-full bg-secondary/20 border border-border/20 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                {user?.role}
                            </span>
                            {profile.verified && (
                                <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
                                    Verified
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {!isEditing ? (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/20 hover:bg-white/5 text-sm font-medium text-foreground transition-all"
                    >
                        <Edit2 size={14} />
                        Edit Profile
                    </button>
                ) : (
                   <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsEditing(false)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-xs font-medium text-muted-foreground transition-all"
                        >
                            <X size={14} />
                            Cancel
                        </button>
                        <button 
                            onClick={handleSubmit} 
                            disabled={loading}
                             className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-medium shadow-lg shadow-primary/20 transition-all"
                        >
                             {loading ? <div className="animate-spin h-3 w-3 border-2 border-white/30 border-t-white rounded-full"></div> : <Save size={14} />}
                             Save Changes
                        </button>
                   </div>
                )}
            </div>

            {/* Details Card */}
            <div className="bg-secondary/5 border border-border/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    {/* Basic Info Group */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Email */}
                             <div className="space-y-2">
                                <label className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">Email Address</label>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        disabled
                                        value={profile.email}
                                        className="w-full bg-secondary/10 border border-border/20 rounded-lg px-3 py-2.5 text-foreground/50 text-sm cursor-not-allowed"
                                    />
                                ) : (
                                    <p className="text-sm font-medium text-foreground tracking-wide font-mono">{profile.email}</p>
                                )}
                            </div>

                            {/* Full Name (Editable) */}
                            {isEditing && (
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">Full Name</label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name || ''}
                                        onChange={handleInputChange}
                                        className="w-full bg-black/20 border border-border/20 rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                                    />
                                </div>
                            )}

                             {/* Role/Title */}
                             <div className="space-y-2">
                                <label className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                    {user?.role === 'CANDIDATE' ? 'Preferred Role' : 'Role in Company'}
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name={user?.role === 'CANDIDATE' ? 'preferred_roles' : 'job_title'} 
                                        value={user?.role === 'CANDIDATE' ? (formData.preferred_roles || '') : (formData.job_title || '')}
                                        onChange={handleInputChange}
                                        placeholder={user?.role === 'CANDIDATE' ? "Frontend Developer, Backend Engineer" : "Head of Talent"}
                                        className="w-full bg-black/20 border border-border/20 rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                                    />
                                ) : (
                                    user?.role === 'CANDIDATE' ? (
                                        renderTags(profile.preferred_roles)
                                    ) : (
                                        <p className="text-sm font-medium text-foreground">{profile.job_title || 'Not specified'}</p>
                                    )
                                )}
                            </div>
                        </div>

                        {user?.role === 'CANDIDATE' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                     <label className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">Years of Experience</label>
                                      {isEditing ? (
                                        <input
                                            type="number"
                                            name="experience_years"
                                            value={formData.experience_years || ''}
                                            onChange={handleInputChange}
                                            className="w-full bg-black/20 border border-border/20 rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        />
                                    ) : (
                                        <p className="text-sm font-medium text-foreground">{profile.experience_years ? `${profile.experience_years} Years` : 'Not specified'}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                     <label className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">Preferred Locations</label>
                                      {isEditing ? (
                                        <input
                                            type="text"
                                            name="preferred_locations"
                                            value={formData.preferred_locations || ''}
                                            onChange={handleInputChange}
                                            placeholder="Remote, San Francisco, London"
                                            className="w-full bg-black/20 border border-border/20 rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        />
                                    ) : (
                                         renderTags(profile.preferred_locations)
                                    )}
                                </div>
                             </div>
                        )}
                    </div>

                    {/* Skills Section (Candidate Only) */}
                    {user?.role === 'CANDIDATE' && (
                        <div className="space-y-6 pt-6 border-t border-border/10">
                             <div className="space-y-3">
                                <label className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">Primary Skills</label>
                                {isEditing ? (
                                    <div className="relative">
                                        <Code2 className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
                                        <input
                                            type="text"
                                            name="primary_skills"
                                            value={formData.primary_skills || ''}
                                            onChange={handleInputChange}
                                            placeholder="React, TypeScript, Node.js..."
                                            className="w-full bg-black/20 border border-border/20 rounded-lg pl-10 pr-3 py-2.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        />
                                    </div>
                                ) : (
                                    renderTags(profile.primary_skills)
                                )}
                            </div>

                             <div className="space-y-3">
                                <label className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">Secondary Skills</label>
                                {isEditing ? (
                                    <div className="relative">
                                        <Target className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
                                        <input
                                            type="text"
                                            name="secondary_skills"
                                            value={formData.secondary_skills || ''}
                                            onChange={handleInputChange}
                                            placeholder="Docker, AWS, SQL..."
                                            className="w-full bg-black/20 border border-border/20 rounded-lg pl-10 pr-3 py-2.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        />
                                    </div>
                                ) : (
                                    renderTags(profile.secondary_skills)
                                )}
                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* Logout Button */}
            <button 
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors font-medium text-sm group"
            >
                <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
                Sign Out
            </button>
        </div>
    );
};

export default Profile;