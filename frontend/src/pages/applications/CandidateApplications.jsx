import React, { useState, useEffect } from 'react';
import { getMyApplications } from '../../services/applicationService';
import {
    Search,
    FileText,
    Play,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CandidateApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const navigate = useNavigate();

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

    const canStartRounds = (app) => {
        if ((app?.stage || '').toString().toLowerCase() !== 'shortlisted') return false;
        if (!app?.next_round) return false;

        const next = (app?.next_round || '').toString().toUpperCase();
        // Check generic submitted status
        if (next === 'APTITUDE' && ['submitted', 'expired'].includes((app?.aptitude_attempt_status || '').toLowerCase())) return false;
        if (['DSA', 'CODING'].includes(next) && ['submitted', 'expired'].includes((app?.dsa_attempt_status || '').toLowerCase())) return false;
        if (['TECHNICAL', 'INTERVIEW'].includes(next) && ['submitted', 'expired'].includes((app?.technical_attempt_status || '').toLowerCase())) return false;

        const fromRaw = app?.selection_lock_from;
        const untilRaw = app?.selection_lock_until;
        if (!fromRaw || !untilRaw) return true;

        const from = new Date(fromRaw);
        const until = new Date(untilRaw);
        if (Number.isNaN(from.getTime()) || Number.isNaN(until.getTime())) return true;

        const now = new Date();
        return now >= from && now <= until;
    };

    const handleStartRound = (app) => {
        const next = (app?.next_round || '').toString().toUpperCase();
        if (!next) return;

        let path = '';
        if (next === 'APTITUDE') path = `/aptitude/round/${app.job_id}`;
        else if (next === 'DSA' || next === 'CODING') path = `/dsa/round/${app.job_id}`;
        else if (next === 'TECHNICAL' || next === 'INTERVIEW') path = `/technical/interview/${app.job_id}`;
        else {
            toast.error(`Unknown round: ${next}`);
            return;
        }

        try {
            if (document?.documentElement?.requestFullscreen) {
                document.documentElement.requestFullscreen();
            }
        } catch {}
        navigate(path);
    };

    const filteredApplications = applications.filter(app => {
        const matchesSearch = app.job_title?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (filterStatus === 'ALL') return matchesSearch;
        if (filterStatus === 'PENDING') return matchesSearch && ['applied', 'under_review', 'resume_screening'].includes(app.status?.toLowerCase());
        if (filterStatus === 'SHORTLISTED') return matchesSearch && ['shortlisted', 'interview_scheduled'].includes(app.status?.toLowerCase());
        if (filterStatus === 'REJECTED') return matchesSearch && app.status?.toLowerCase() === 'rejected';
        
        return matchesSearch;
    });

    const getStatusBadge = (status) => {
        const s = status?.toUpperCase();
        if (['SHORTLISTED', 'INTERVIEW_SCHEDULED'].includes(s)) {
            return <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">Shortlisted</span>;
        }
        if (s === 'REJECTED') {
            return <span className="px-2.5 py-1 rounded bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider border border-red-500/20">Rejected</span>;
        }
        return <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">Pending</span>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white font-heading">Applications</h1>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                        type="text"
                        placeholder="Search applications..."
                        className="w-full bg-secondary/5 border border-border/20 rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex gap-2">
                    {['ALL', 'PENDING', 'SHORTLISTED', 'REJECTED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all capitalize border ${
                                filterStatus === status
                                    ? 'bg-primary text-white border-primary shadow-sm'
                                    : 'bg-secondary/5 text-muted-foreground border-border/20 hover:bg-secondary/10 hover:text-foreground'
                            }`}
                        >
                            {status.toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Applications List */}
            <div className="space-y-3">
                {filteredApplications.map((app) => (
                    <div
                        key={app.id}
                        className="bg-secondary/5 border border-border/20 rounded-lg p-5 flex flex-col md:flex-row items-center justify-between gap-4 group hover:border-primary/30 hover:bg-secondary/10 transition-all"
                    >
                        {/* Left: Info */}
                        <div className="flex-1 w-full">
                            <h3 className="text-base font-bold text-white mb-1 group-hover:text-primary transition-colors">{app.job_title}</h3>
                            <p className="text-xs text-muted-foreground mb-4">
                                TechCorp • Applied {new Date(app.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => window.open(`http://localhost:3000/uploads/resumes/${app.resume_file_path}`, '_blank')}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border/20 bg-secondary/10 text-xs font-medium text-foreground hover:bg-secondary/20 transition-colors"
                                >
                                    <FileText size={14} />
                                    View Resume
                                </button>

                                {canStartRounds(app) && (
                                    <button
                                        onClick={() => handleStartRound(app)}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        <Play size={12} fill="currentColor" />
                                        Start {app.next_round} Round
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Right: Status */}
                        <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-1 w-full md:w-auto justify-between md:justify-end">
                            {getStatusBadge(app.status)}
                            
                            {app.status === 'SHORTLISTED' && app.next_round && (
                                <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1.5 mt-1">
                                    Next: <span className="text-foreground uppercase">{app.next_round}</span>
                                </p>
                            )}
                        </div>
                    </div>
                ))}

                {filteredApplications.length === 0 && (
                    <div className="text-center py-16 bg-secondary/5 rounded-lg border border-border/20 border-dashed">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary/10 mb-3 text-muted-foreground">
                            <Search size={20} />
                        </div>
                        <h3 className="text-sm font-bold text-white mb-1">No applications found</h3>
                        <p className="text-xs text-muted-foreground">Try adjusting your filters or search terms.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CandidateApplications;
