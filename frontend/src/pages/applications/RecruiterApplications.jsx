import React, { useState, useEffect } from 'react';
import { getRecruiterApplications, updateApplicationStatus } from '../../services/applicationService';
import {
    Search,
    Filter,
    MoreVertical,
    ExternalLink,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    Users,
    Mail,
    FileText,
    Calendar,
    Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';

const RecruiterApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterJob, setFilterJob] = useState('ALL');

    // Get unique job titles for the filter dropdown
    const uniqueJobs = [...new Set(applications.map(app => app.job_title))].filter(Boolean);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const res = await getRecruiterApplications();
            setApplications(res.data);
        } catch (err) {
            toast.error('Failed to fetch applications');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await updateApplicationStatus(id, newStatus);
            toast.success(`Status updated to ${newStatus}`);
            // Update local state instead of re-fetching for better UX
            setApplications(apps => apps.map(app =>
                app.id === id ? { ...app, status: newStatus } : app
            ));
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'REVIEWING': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'SHORTLISTED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'REJECTED': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    const filteredApplications = applications.filter(app => {
        const matchesSearch =
            app.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.job_title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' || app.status === filterStatus;
        const matchesJob = filterJob === 'ALL' || app.job_title === filterJob;
        return matchesSearch && matchesStatus && matchesJob;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Manage Applications</h1>
                    <p className="text-slate-400">Track and review candidate submissions across all your job openings.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search candidate or job..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Filter size={18} className="text-slate-500" />
                    <select
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all text-sm"
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

                <div className="flex items-center space-x-2">
                    <Briefcase size={18} className="text-slate-500" />
                    <select
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all text-sm"
                        value={filterJob}
                        onChange={(e) => setFilterJob(e.target.value)}
                    >
                        <option value="ALL">All Jobs</option>
                        {uniqueJobs.sort().map(job => (
                            <option key={job} value={job}>{job}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Applications Table */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-800/30">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Candidate</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Job / Role</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Applied Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filteredApplications.length > 0 ? (
                                filteredApplications.map((app) => (
                                    <tr key={app.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-300 mr-3 border border-slate-700">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-white">{app.candidate_name}</div>
                                                    <div className="text-xs text-slate-500 flex items-center mt-0.5">
                                                        <FileText size={12} className="mr-1" />
                                                        {app.years_of_experience || 0} yrs exp
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-slate-300">
                                                <Briefcase size={16} className="mr-2 text-slate-500" />
                                                <span className="text-sm font-medium truncate max-w-[200px]">{app.job_title}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-slate-400 text-sm">
                                                <Calendar size={14} className="mr-2" />
                                                {new Date(app.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(app.status)}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                                                    title="View Resume"
                                                    onClick={() => window.open(`http://localhost:3000/uploads/resumes/${app.resume_file_path}`, '_blank')}
                                                >
                                                    <ExternalLink size={18} />
                                                </button>
                                                <button
                                                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                                                    title="Shortlist"
                                                    onClick={() => handleStatusUpdate(app.id, 'SHORTLISTED')}
                                                >
                                                    <CheckCircle2 size={18} />
                                                </button>
                                                <button
                                                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
                                                    title="Reject"
                                                    onClick={() => handleStatusUpdate(app.id, 'REJECTED')}
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center">
                                            <Users size={48} className="text-slate-700 mb-3" />
                                            <p className="text-lg font-medium text-slate-400">No applications found</p>
                                            <p className="text-sm">Try adjusting your search or filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RecruiterApplications;
