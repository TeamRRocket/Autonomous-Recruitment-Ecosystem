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

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading opportunities...</div>;

    return (
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 px-4 sm:px-0 gap-6">
                <div>
                    <h1 className="text-3xl font-bold font-heading gradient-text tracking-tight">Latest Opportunities</h1>
                    <p className="text-muted-foreground mt-1">Found {jobs.length} jobs matching your profile</p>
                </div>

                <div className="flex flex-1 max-w-xl self-center md:self-auto w-full md:w-auto items-center gap-4">
                    <form onSubmit={handleSearch} className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search jobs by title, skills, or company..."
                            className="w-full bg-input border border-border rounded-lg py-2.5 pl-10 pr-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>
                    <button
                        onClick={() => { logout(); }}
                        className="px-4 py-2 border border-border bg-accent text-accent-foreground rounded-lg hover:bg-accent/80 transition-all text-sm font-medium whitespace-nowrap"
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-4 sm:px-0">
                {jobs.map(job => (
                    <div key={job.id} className="glass-card overflow-hidden hover:shadow-xl hover:border-primary/50 transition-all duration-300 group flex flex-col h-full animate-slide-up">
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-bold font-heading text-foreground group-hover:text-primary transition-colors mb-2">{job.title}</h3>
                                <span className={`${
                                    job.type === 'Full-time' 
                                        ? 'status-published' 
                                        : 'status-pending'
                                }`}>
                                    {job.type}
                                </span>
                            </div>

                            <div className="mt-auto space-y-3">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {job.location}
                                </div>
                            </div>
                        </div>
                        <div className="bg-accent/50 px-6 py-4 border-t border-border">
                            <Link to={`/jobs/${job.id}`} className="block w-full text-center text-primary font-medium hover:text-primary/80 transition-colors">
                                View Details &rarr;
                            </Link>
                        </div>
                    </div>
                ))}

                {jobs.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground glass-card border-dashed">
                        No jobs found at the moment. Check back later!
                    </div>
                )}
            </div>
        </div>
    );
};

export default CandidateDashboard;
