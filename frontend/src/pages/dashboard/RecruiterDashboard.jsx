import React, { useEffect, useState } from 'react';
import { getMyJobs, updateJob, deleteJob } from '../../services/jobService';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const RecruiterDashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
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
            await updateJob(jobId, { status: newStatus });
            toast.success(`Job marked as ${newStatus}`);
            fetchJobs();
        } catch (error) {
            console.error('Failed to update status', error);
            toast.error(error.response?.data?.message || 'Failed to update job status');
        }
    };

    const handleDeleteJob = async (jobId, jobTitle) => {
        if (!window.confirm(`Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await deleteJob(jobId);
            toast.success('Job deleted successfully');
            fetchJobs();
        } catch (error) {
            console.error('Failed to delete job', error);
            toast.error(error.response?.data?.message || 'Failed to delete job');
        }
    };

    const filteredJobs = jobs.filter(job =>
        job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-slate-400">Loading dashboard...</div>;

    return (
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 px-4 sm:px-0 gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">My Jobs</h1>
                    <p className="text-slate-400 mt-1">Manage your active and draft job postings</p>
                </div>

                <div className="flex flex-1 max-w-xl self-center md:self-auto w-full md:w-auto items-center gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-all font-bold" size={20} />
                        <input
                            type="text"
                            placeholder="Filter your jobs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all shadow-lg"
                        />
                    </div>

                    <div className="flex gap-3">
                        <Link to="/jobs/new" className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-xl shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform active:scale-95">
                            <Plus className="-ml-1 mr-2 h-5 w-5" />
                            Post Job
                        </Link>
                        <button
                            onClick={() => logout()}
                            className="px-4 py-2 border border-slate-700 bg-slate-900 text-slate-400 rounded-xl hover:text-white hover:bg-slate-800 transition-all text-sm font-medium whitespace-nowrap"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 shadow-xl overflow-hidden sm:rounded-xl mx-4 sm:mx-0">
                <ul className="divide-y divide-slate-700">
                    {filteredJobs.map(job => (
                        <li key={job.id} className="hover:bg-slate-700/30 transition-colors">
                            <div className="px-6 py-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-lg font-bold text-white truncate mb-1">{job.title}</h4>
                                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                                            <span className="flex items-center">
                                                <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {job.location}
                                            </span>
                                            <span>•</span>
                                            <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="ml-4 flex-shrink-0 flex flex-col items-end gap-3">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${job.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                            job.status === 'CLOSED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                            }`}>
                                            {job.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-between items-center border-t border-slate-700/50 pt-4">
                                    <div className="text-sm text-slate-500">
                                        {/* Salary removed */}
                                    </div>
                                    <div className="flex space-x-4 text-sm font-medium">
                                        <Link to={`/jobs/${job.id}`} className="text-indigo-400 hover:text-indigo-300 transition-colors">View</Link>
                                        {job.status !== 'CLOSED' && (
                                            <Link to={`/jobs/${job.id}/edit`} className="text-indigo-400 hover:text-indigo-300 transition-colors">Edit</Link>
                                        )}
                                        {job.status === 'DRAFT' && (
                                            <button onClick={() => handleStatusChange(job.id, 'PUBLISHED')} className="text-green-400 hover:text-green-300 transition-colors">Publish</button>
                                        )}
                                        {job.status === 'PUBLISHED' && (
                                            <button onClick={() => handleStatusChange(job.id, 'CLOSED')} className="text-red-400 hover:text-red-300 transition-colors">Close Job</button>
                                        )}
                                        {job.status === 'CLOSED' && (
                                            <button
                                                onClick={() => handleDeleteJob(job.id, job.title)}
                                                className="text-red-500 hover:text-red-400 transition-colors font-semibold"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                    {filteredJobs.length === 0 && (
                        <li className="px-6 py-12 text-center">
                            <Search className="mx-auto h-12 w-12 text-slate-700" />
                            <h3 className="mt-2 text-sm font-medium text-white">
                                {searchQuery ? `No jobs matching "${searchQuery}"` : 'No jobs found'}
                            </h3>
                            <p className="mt-1 text-sm text-slate-400">
                                {searchQuery ? 'Try adjusting your filter' : 'Get started by creating a new job posting.'}
                            </p>
                            {!searchQuery && (
                                <div className="mt-6">
                                    <Link to="/jobs/new" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                                        Post New Job
                                    </Link>
                                </div>
                            )}
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default RecruiterDashboard;
