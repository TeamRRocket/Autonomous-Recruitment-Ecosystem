import React, { useEffect, useState } from 'react';
import { getPublishedJobs } from '../../services/jobService';
import { getMyApplications } from '../../services/applicationService';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Briefcase, Clock, Calendar, MapPin, Building2, ExternalLink } from 'lucide-react';

const CandidateDashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, interviews: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/jobs?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [jobsRes, appsRes] = await Promise.all([
                    getPublishedJobs(),
                    getMyApplications()
                ]);

                // Process Jobs
                setJobs(jobsRes.data || []);

                // Process Stats
                const apps = appsRes.data || [];
                const total = apps.length;
                const pending = apps.filter(a => ['applied', 'under_review', 'resume_screening'].includes(a.status?.toLowerCase())).length;
                const interviews = apps.filter(a => ['interview_scheduled', 'technical_interview', 'hr_interview'].includes(a.status?.toLowerCase())).length;
                
                setStats({ total, pending, interviews });
            } catch (error) {
                console.error('Failed to load dashboard', error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 animate-fade-in space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <h1 className="text-xl font-bold text-white font-heading">Dashboard</h1>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                     <button
                        onClick={logout}
                        className="w-full sm:w-auto px-3 py-1.5 rounded-md border border-border/20 text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors text-xs font-semibold uppercase tracking-wider"
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                <input
                    type="text"
                    placeholder="Search for jobs..."
                    className="w-full bg-secondary/5 border border-border/20 rounded-lg py-2 pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </form>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-secondary/5 border border-border/20 rounded-lg p-4 hover:bg-secondary/10 transition-colors group">
                    <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-primary/10 rounded-md text-primary group-hover:bg-primary/20 transition-colors">
                            <Briefcase size={16} />
                        </div>
                        {stats.total > 0 && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">+1 this week</span>}
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Applications</span>
                        <h3 className="text-2xl font-bold text-white font-heading">{stats.total}</h3>
                    </div>
                </div>

                <div className="bg-secondary/5 border border-border/20 rounded-lg p-4 hover:bg-secondary/10 transition-colors group">
                    <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-orange-500/10 rounded-md text-orange-500 group-hover:bg-orange-500/20 transition-colors">
                            <Clock size={16} />
                        </div>
                    </div>
                    <div className="space-y-0.5">
                         <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pending Reviews</span>
                        <h3 className="text-2xl font-bold text-white font-heading">{stats.pending}</h3>
                    </div>
                </div>

                <div className="bg-secondary/5 border border-border/20 rounded-lg p-4 hover:bg-secondary/10 transition-colors group">
                    <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-md text-blue-500 group-hover:bg-blue-500/20 transition-colors">
                            <Calendar size={16} />
                        </div>
                         {stats.interviews > 0 && <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-full">{stats.interviews} upcoming</span>}
                    </div>
                    <div className="space-y-0.5">
                         <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Interviews Scheduled</span>
                        <h3 className="text-2xl font-bold text-white font-heading">{stats.interviews}</h3>
                    </div>
                </div>
            </div>

            {/* Recent Jobs Header */}
            <div className="flex items-center justify-between pt-2">
                <h2 className="text-sm font-bold text-white font-heading uppercase tracking-wide">Recent Jobs</h2>
            </div>
            
            {/* Recent Jobs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {jobs.slice(0, 4).map(job => (
                    <div key={job.id} className="bg-secondary/5 border border-border/20 rounded-lg p-4 hover:border-primary/30 hover:bg-secondary/10 transition-all group flex flex-col justify-between h-full">
                        <div className="space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors">{job.title}</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                         <Building2 size={12} className="text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground font-medium">{job.company || 'Tech Company'}</p>
                                    </div>
                                </div>
                                <span className="px-2 py-0.5 rounded bg-secondary/20 text-[10px] font-bold text-muted-foreground border border-border/20 uppercase tracking-wide">
                                    {job.type || 'Full-time'}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground font-medium">
                                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                                    <MapPin size={10} />
                                    {job.location || 'Remote'}
                                </div>
                                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                                    <Clock size={10} />
                                    {job.created_at ? timeAgo(job.created_at) : 'Recently'}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 mt-1">
                             <Link 
                                to={`/jobs/${job.id}`} 
                                className="inline-flex items-center justify-center w-full px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition-all border border-border/20 hover:border-border/40 group-hover:shadow-md"
                            >
                                View Details
                            </Link>
                        </div>
                    </div>
                ))}

                {jobs.length === 0 && (
                     <div className="col-span-full py-12 text-center rounded-lg bg-secondary/5 border border-border/20 border-dashed">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary/10 mb-3 text-muted-foreground">
                            <Search size={20} />
                        </div>
                        <h3 className="text-sm font-semibold text-white mb-1">No jobs available</h3>
                        <p className="text-muted-foreground text-xs max-w-sm mx-auto">
                            We couldn't find any open positions.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CandidateDashboard;
