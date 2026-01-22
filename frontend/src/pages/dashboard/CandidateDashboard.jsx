import React, { useEffect, useState } from 'react';
import { getPublishedJobs } from '../../services/jobService';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Search } from 'lucide-react';

const CandidateDashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/jobs/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await getPublishedJobs();
                setJobs(res.data);
            } catch (error) {
                console.error('Failed to fetch jobs', error);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-400">Loading opportunities...</div>;

    return (
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 px-4 sm:px-0 gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Latest Opportunities</h1>
                    <p className="text-slate-400 mt-1">Found {jobs.length} jobs matching your profile</p>
                </div>

                <div className="flex flex-1 max-w-xl self-center md:self-auto w-full md:w-auto items-center gap-4">
                    <form onSubmit={handleSearch} className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search jobs by title, skills, or company..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all shadow-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>
                    <button
                        onClick={() => { logout(); }}
                        className="px-4 py-2 border border-slate-700 bg-slate-900 text-slate-300 rounded-xl hover:bg-slate-800 transition-all text-sm font-medium whitespace-nowrap shadow-md"
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-4 sm:px-0">
                {jobs.map(job => (
                    <div key={job.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500/50 transition-all duration-300 group flex flex-col h-full">
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors mb-2">{job.title}</h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${job.type === 'Full-time' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    }`}>
                                    {job.type}
                                </span>
                            </div>


                            <div className="mt-auto space-y-3">
                                <div className="flex items-center text-sm text-slate-400">
                                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {job.location}
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-900/50 px-6 py-4 border-t border-slate-700/50">
                            <Link to={`/jobs/${job.id}`} className="block w-full text-center text-blue-400 font-medium hover:text-blue-300 transition-colors">
                                View Details &rarr;
                            </Link>
                        </div>
                    </div>
                ))}

                {jobs.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
                        No jobs found at the moment. Check back later!
                    </div>
                )}
            </div>
        </div>
    );
};

export default CandidateDashboard;
