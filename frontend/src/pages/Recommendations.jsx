import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Target, Briefcase, MapPin, Building2, Clock } from 'lucide-react';
import api from '../services/api';

const Recommendations = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const response = await api.get('/api/jobs/recommendations');
                const rawData = response.data.data || [];
                // Deduplicate by job_id
                const uniqueRecommendations = Array.from(new Map(rawData.map(job => [job.job_id, job])).values());
                setRecommendations(uniqueRecommendations);
            } catch (error) {
                console.error('Failed to fetch recommendations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, []);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col gap-8 animate-pulse">
                    <div className="h-10 w-64 bg-slate-800 rounded-xl" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-64 bg-slate-800/50 rounded-3xl border border-slate-800" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
                        <Sparkles className="text-blue-500" size={36} />
                        AI Recommendations
                    </h1>
                    <p className="text-slate-400 mt-3 text-lg font-medium">
                        Personalized matches based on your unique skill set and profile.
                    </p>
                </div>

            </div>

            {recommendations.length === 0 ? (
                <div className="py-24 text-center bg-slate-900/40 border border-slate-800 border-dashed rounded-[3rem]">
                    <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-800">
                        <Target size={40} className="text-slate-700" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">No recommendations yet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto font-medium">
                        Update your profile with more skills to get personalized job matches.
                    </p>
                    <Link
                        to="/profile"
                        className="mt-8 inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20"
                    >
                        Update Profile
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {recommendations.map((job) => (
                        <Link
                            key={job.job_id}
                            to={`/jobs/${job.job_id}`}
                            className="group relative bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 hover:border-blue-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col"
                        >
                            <div className="absolute top-8 right-8">
                                <div className="flex flex-col items-end gap-1">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Match Score</div>
                                    <div className={`text-2xl font-black px-4 py-1 rounded-2xl border ${job.match_score > 0
                                        ? 'text-blue-400 bg-blue-400/10 border-blue-400/20'
                                        : 'text-slate-500 bg-slate-500/10 border-slate-500/20'
                                        }`}>
                                        {job.match_score}%
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8">
                                <div className="h-12 w-12 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                    <Briefcase size={22} />
                                </div>
                                <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors leading-tight mb-2">
                                    {job.job_title}
                                </h3>
                                <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                                    <Building2 size={14} className="text-slate-700" />
                                    Autonomous Ecosystem
                                </div>
                            </div>

                            <div className="space-y-4 mb-8 flex-1">
                                <div className="p-5 bg-slate-950/50 rounded-3xl border border-slate-800 group-hover:border-blue-500/20 transition-all">
                                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Sparkles size={12} />
                                        AI Insights
                                    </div>
                                    <p className="text-sm text-slate-400 font-medium leading-relaxed italic">
                                        "{job.reason}"
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-800/50 mt-auto">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                    <Clock size={14} />
                                    Updated Today
                                </div>
                                <div className="text-blue-400 group-hover:translate-x-1 transition-transform">
                                    <ArrowRight size={20} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Recommendations;
