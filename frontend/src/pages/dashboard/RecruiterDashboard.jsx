import React, { useEffect, useState } from 'react';
import { getMyJobs, updateJob, deleteJob } from '../../services/jobService';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Plus, Eye, Edit2, Trash2, Users, Archive, LayoutDashboard } from 'lucide-react';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, subtext }) => (
    <div className="bg-card border border-border/40 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="mt-2 text-3xl font-bold text-foreground">{value}</div>
        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
    </div>
);

const RecruiterDashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const { logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const res = await getMyJobs();
            setJobs(res.data || []);
        } catch (error) {
            console.error('Failed to fetch my jobs', error);
            toast.error(error.response?.data?.message || 'Failed to load jobs');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (jobId, newStatus) => {
        try {
            // Optimistic update first
            setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
            
            await updateJob(jobId, { status: newStatus });
            toast.success(`Job marked as ${newStatus}`);
        } catch (error) {
            console.error('Failed to update status', error);
            toast.error(error.response?.data?.message || 'Failed to update job status');
            // Revert on error
            fetchJobs();
        }
    };

    const handleDeleteJob = async (jobId, jobTitle) => {
        if (!window.confirm(`Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await deleteJob(jobId);
            toast.success('Job deleted successfully');
            setJobs(jobs.filter(j => j.id !== jobId));
        } catch (error) {
            console.error('Failed to delete job', error);
            toast.error(error.response?.data?.message || 'Failed to delete job');
        }
    };

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.location?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Stats Calculations
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(j => j.status === 'PUBLISHED').length;
    const totalApplications = jobs.reduce((sum, job) => sum + parseInt(job.application_count || 0, 10), 0);
    const draftJobs = jobs.filter(j => j.status === 'DRAFT').length;

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-muted-foreground animate-pulse">Loading dashboard...</div>
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto py-8 px-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <h1 className="text-2xl font-bold font-heading text-foreground">Dashboard</h1>
                <div className="flex items-center gap-3">
                    <Link
                        to="/jobs/new"
                        className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-primary/20"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Post New Job
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard title="Total Jobs" value={totalJobs} />
                <StatCard title="Active Jobs" value={activeJobs} />
                <StatCard title="Total Applications" value={totalApplications} />
                <StatCard title="Draft Jobs" value={draftJobs} />
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search jobs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-card/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['ALL', 'DRAFT', 'PUBLISHED', 'CLOSED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                                statusFilter === status
                                    ? 'bg-primary text-white'
                                    : 'bg-card border border-border hover:bg-secondary/50 text-muted-foreground'
                            }`}
                        >
                            {status.charAt(0) + status.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Jobs List / Table */}
            <div className="bg-card border border-border/40 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-secondary/20 border-b border-border">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-muted-foreground">Job Title</th>
                                <th className="px-6 py-4 font-semibold text-muted-foreground">Location</th>
                                <th className="px-6 py-4 font-semibold text-muted-foreground">Type</th>
                                <th className="px-6 py-4 font-semibold text-muted-foreground">Posted</th>
                                <th className="px-6 py-4 font-semibold text-muted-foreground">Status</th>
                                <th className="px-6 py-4 font-semibold text-muted-foreground">Apps</th>
                                <th className="px-6 py-4 font-semibold text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredJobs.length > 0 ? (
                                filteredJobs.map((job) => (
                                    <tr key={job.id} className="hover:bg-secondary/5 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-foreground">{job.title}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{job.location || 'Remote'}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{job.type || 'Full-time'}</td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {new Date(job.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                job.status === 'PUBLISHED'
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                    : job.status === 'DRAFT'
                                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                    : 'bg-secondary/50 text-muted-foreground border-border'
                                            }`}>
                                                {job.status.charAt(0) + job.status.slice(1).toLowerCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-foreground font-medium">
                                            {job.application_count || 0}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/jobs/${job.id}`}
                                                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/20 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                                {job.status !== 'CLOSED' && (
                                                    <Link
                                                        to={`/jobs/${job.id}/edit`}
                                                        className="p-1.5 text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                                                        title="Edit Job"
                                                    >
                                                        <Edit2 size={16} />
                                                    </Link>
                                                )}
                                                <Link
                                                    to={`/recruiter/applications?job=${job.id}`}
                                                    className="p-1.5 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                    title="View Applicants"
                                                >
                                                    <Users size={16} />
                                                </Link>
                                                {job.status === 'PUBLISHED' && (
                                                     <button
                                                        onClick={() => handleStatusChange(job.id, 'CLOSED')}
                                                        className="p-1.5 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                                                        title="Close Job"
                                                    >
                                                        <Archive size={16} />
                                                    </button>
                                                )}
                                                {(job.status === 'DRAFT' || job.status === 'CLOSED') && (
                                                    <button
                                                        onClick={() => handleDeleteJob(job.id, job.title)}
                                                        className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Delete Job"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <LayoutDashboard size={40} className="mb-2 opacity-20" />
                                            <p>No jobs found.</p>
                                            <p className="text-xs">Try adjusting your filters or post a new job.</p>
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

export default RecruiterDashboard;
