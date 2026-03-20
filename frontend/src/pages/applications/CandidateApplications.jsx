import React, { useState, useEffect } from 'react';
import { getMyApplications } from '../../services/applicationService';
import {
    Search,
    Filter,
    Calendar,
    Briefcase,
    MapPin,
    ArrowRight,
    Loader2,
    FileText,
    ExternalLink
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CandidateApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const navigate = useNavigate();

    const canStartRounds = (app) => {
        if ((app?.stage || '').toString().toLowerCase() !== 'shortlisted') return false;
        if (!app?.next_round) return false;

        const next = (app?.next_round || '').toString().toUpperCase();
        if (next === 'APTITUDE') {
            const st = (app?.aptitude_attempt_status || '').toString().toLowerCase();
            if (st === 'submitted' || st === 'expired') return false;
        }

        if (next === 'DSA' || next === 'CODING') {
            const st = (app?.dsa_attempt_status || '').toString().toLowerCase();
            if (st === 'submitted' || st === 'expired') return false;
        }

        if (next === 'TECHNICAL' || next === 'INTERVIEW') {
            const st = (app?.technical_attempt_status || '').toString().toUpperCase();
            if (st === 'SUBMITTED' || st === 'EXPIRED') return false;
        }

        const fromRaw = app?.selection_lock_from;
        const untilRaw = app?.selection_lock_until;
        if (!fromRaw || !untilRaw) return true;

        const from = new Date(fromRaw);
        const until = new Date(untilRaw);
        if (Number.isNaN(from.getTime()) || Number.isNaN(until.getTime())) return true;

        const now = new Date();
        return now >= from && now <= until;
    };

    const getRoundWindow = (app) => {
        const fromRaw = app?.selection_lock_from;
        const untilRaw = app?.selection_lock_until;
        if (!fromRaw || !untilRaw) return null;
        const from = new Date(fromRaw);
        const until = new Date(untilRaw);
        if (Number.isNaN(from.getTime()) || Number.isNaN(until.getTime())) return null;
        return { from, until };
    };

    const handleStartRound = (app) => {
        const window = getRoundWindow(app);
        if (window) {
            const now = new Date();
            if (now < window.from) {
                toast.error(`Round will be active from ${window.from.toLocaleString()}`);
                return;
            }
            if (now > window.until) {
                toast.error('Interview window has ended');
                return;
            }
        }

        const next = (app?.next_round || '').toString().toUpperCase();

        if (!next) {
            toast.error('Next round is not assigned yet');
            return;
        }

        if (next === 'APTITUDE') {
            try {
                if (document?.documentElement?.requestFullscreen) {
                    document.documentElement.requestFullscreen();
                }
            } catch {
                // ignore
            }
            navigate(`/aptitude/round/${app.job_id}`);
            return;
        }

        if (next === 'DSA' || next === 'CODING') {
            try {
                if (document?.documentElement?.requestFullscreen) {
                    document.documentElement.requestFullscreen();
                }
            } catch {
                // ignore
            }

            navigate(`/dsa/round/${app.job_id}`);
            return;
        }

        if (next === 'TECHNICAL' || next === 'INTERVIEW') {
            navigate(`/technical/interview/${app.job_id}`);
            return;
        }

        toast.error(`Unknown next round: ${next}`);
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const res = await getMyApplications();
            setApplications(res.data);
        } catch (err) {
            toast.error('Failed to fetch your applications');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'status-pending';
            case 'REVIEWING': return 'bg-primary/10 text-primary border-primary/20';
            case 'SHORTLISTED': return 'status-shortlisted';
            case 'REJECTED': return 'status-rejected';
            default: return 'bg-muted/10 text-muted-foreground border-border';
        }
    };

    const filteredApplications = applications.filter(app => {
        const matchesSearch =
            app.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.location?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' || app.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary mb-4" size={40} />
                <p className="text-muted-foreground animate-pulse">Loading your applications...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold font-heading gradient-text tracking-tight">My Applications</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Tracks your journey with {applications.length} active application{applications.length !== 1 ? 's' : ''}.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="relative group flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by job title or location..."
                            className="w-full bg-input border border-border rounded-lg py-2.5 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center space-x-2 glass-card px-3 py-1">
                        <Filter size={16} className="text-muted-foreground" />
                        <select
                            className="bg-transparent border-none text-foreground focus:outline-none focus:ring-0 text-sm py-1.5 cursor-pointer"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="REVIEWING">Reviewing</option>
                            <option value="SHORTLISTED">Shortlisted</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            {filteredApplications.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {filteredApplications.map((app) => (
                        <div
                            key={app.id}
                            className="glass-card hover:border-primary/30 rounded-2xl p-5 transition-all duration-300 group relative overflow-hidden animate-slide-up"
                        >
                            {/* Status Accent Bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${app.status === 'SHORTLISTED' ? 'bg-success' :
                                    app.status === 'REJECTED' ? 'bg-destructive' :
                                        app.status === 'REVIEWING' ? 'bg-primary' : 'bg-warning'
                                }`} />

                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                                                {app.job_title}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-4 mt-2">
                                                <div className="flex items-center text-slate-400 text-sm">
                                                    <MapPin size={14} className="mr-1.5 text-primary/70" />
                                                    {app.location || 'Remote'}
                                                </div>
                                                <div className="flex items-center text-slate-400 text-sm">
                                                    <Calendar size={14} className="mr-1.5 text-primary/70" />
                                                    Applied on {new Date(app.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>

                                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold border tracking-wider uppercase ${getStatusColor(app.status)}`}>
                                            {app.status}
                                        </span>
                                    </div>

                                    {app.status === 'SHORTLISTED' && (
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2 mt-2">
                                            <p className="text-emerald-400 text-sm flex items-center">
                                                <span className="mr-2">🎉</span> Great news! You've been shortlisted for this role. Keep an eye on your email for next steps.
                                            </p>
                                        </div>
                                    )}

                                    {canStartRounds(app) && (
                                        <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 mt-3">
                                            <p className="text-cyan-200 text-sm">Next Round: <span className="font-semibold">{String(app.next_round).toUpperCase()}</span></p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 self-end lg:self-center">
                                    {canStartRounds(app) && (
                                        <button
                                            onClick={() => handleStartRound(app)}
                                            className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-semibold transition-all border border-primary/30"
                                        >
                                            Start Round
                                            <ArrowRight size={16} className="ml-2" />
                                        </button>
                                    )}
                                    {!canStartRounds(app) && (app?.stage || '').toString().toLowerCase() === 'shortlisted' && (app?.next_round || '').toString().toUpperCase() === 'APTITUDE' && ['submitted', 'expired'].includes((app?.aptitude_attempt_status || '').toString().toLowerCase()) && (
                                        <div className="inline-flex items-center px-4 py-2 bg-slate-800/60 text-slate-200 rounded-xl text-sm font-semibold border border-slate-700">
                                            Already attempted
                                        </div>
                                    )}
                                    {!canStartRounds(app) && (app?.stage || '').toString().toLowerCase() === 'shortlisted' && ['DSA', 'CODING'].includes((app?.next_round || '').toString().toUpperCase()) && ['submitted', 'expired'].includes((app?.dsa_attempt_status || '').toString().toLowerCase()) && (
                                        <div className="inline-flex items-center px-4 py-2 bg-slate-800/60 text-slate-200 rounded-xl text-sm font-semibold border border-slate-700">
                                            Already attempted
                                        </div>
                                    )}
                                    {!canStartRounds(app) && (app?.stage || '').toString().toLowerCase() === 'shortlisted' && ['TECHNICAL', 'INTERVIEW'].includes((app?.next_round || '').toString().toUpperCase()) && ['SUBMITTED', 'EXPIRED'].includes((app?.technical_attempt_status || '').toString().toUpperCase()) && (
                                        <div className="inline-flex items-center px-4 py-2 bg-slate-800/60 text-slate-200 rounded-xl text-sm font-semibold border border-slate-700">
                                            Already attempted
                                        </div>
                                    )}
                                    <Link
                                        to={`/jobs/${app.job_id}`}
                                        className="inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-all border border-slate-700 hover:border-slate-600 group/btn"
                                    >
                                        View Job
                                        <ArrowRight size={16} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>

                                    <button
                                        className="p-2 bg-slate-800/50 hover:bg-primary/10 text-slate-400 hover:text-primary rounded-xl border border-slate-800 hover:border-primary/20 transition-all"
                                        title="View Submitted Resume"
                                        onClick={() => window.open(`http://localhost:3000/uploads/resumes/${app.resume_file_path}`, '_blank')}
                                    >
                                        <FileText size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center bg-slate-900/20 rounded-3xl border border-slate-800/50 border-dashed">
                    <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-slate-800/50 mb-4 text-slate-600">
                        <Briefcase size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">No applications found</h3>
                    <p className="text-slate-400 max-w-md mx-auto">
                        {searchTerm || filterStatus !== 'ALL'
                            ? "Try adjusting your filters to find what you're looking for."
                            : "You haven't applied to any jobs yet. Your future career starts with the first application!"}
                    </p>
                    {!(searchTerm || filterStatus !== 'ALL') && (
                        <Link
                            to="/jobs"
                            className="mt-8 inline-flex items-center px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-2xl font-semibold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
                        >
                            Browse Opportunities
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};

export default CandidateApplications;
