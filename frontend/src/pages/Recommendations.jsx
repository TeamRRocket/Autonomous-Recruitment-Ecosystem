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
                    <div className="h-10 w-64 bg-accent rounded-xl" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-64 glass-card" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black font-heading gradient-text tracking-tight flex items-center gap-4">
                        <Sparkles className="text-primary" size={36} />
                        AI Recommendations
                    </h1>
                    <p className="text-muted-foreground mt-3 text-lg font-medium">
                        Personalized matches based on your unique skill set and profile.
                    </p>
                </div>

            </div>

            {recommendations.length === 0 ? (
                <div className="py-24 text-center glass-card border-dashed">
                    <div className="w-20 h-20 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-border">
                        <Target size={40} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold font-heading text-foreground mb-2 tracking-tight">No recommendations yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto font-medium">
                        Update your profile with more skills to get personalized job matches.
                    </p>
                    <Link
                        to="/profile"
                        className="mt-8 inline-flex items-center px-6 py-3 gradient-primary hover:opacity-90 text-white rounded-2xl font-bold transition-all shadow-lg"
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
                            className="group relative glass-card rounded-3xl p-8 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 flex flex-col animate-slide-up"
                        >
                            <div className="absolute top-8 right-8">
                                <div className="flex flex-col items-end gap-1">
                                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Match Score</div>
                                    <div className={`text-2xl font-black font-heading px-4 py-1 rounded-2xl border ${job.match_score > 0
                                        ? 'text-primary bg-primary/10 border-primary/20'
                                        : 'text-muted-foreground bg-accent border-border'
                                        }`}>
                                        {job.match_score}%
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8">
                                <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20 group-hover:gradient-primary group-hover:text-white transition-all duration-500">
                                    <Briefcase size={22} />
                                </div>
                                <h3 className="text-2xl font-bold font-heading text-foreground group-hover:text-primary transition-colors leading-tight mb-2">
                                    {job.job_title}
                                </h3>
                                <div className="flex items-center gap-2 text-muted-foreground font-bold text-[10px] uppercase tracking-wider">
                                    <Building2 size={14} />
                                    Autonomous Ecosystem
                                </div>
                            </div>

                            <div className="space-y-4 mb-8 flex-1">
                                <div className="p-5 bg-accent rounded-3xl border border-border group-hover:border-primary/20 transition-all">
                                    <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Sparkles size={12} />
                                        AI Insights
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium leading-relaxed italic">
                                        "{job.reason}"
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-border mt-auto">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                                    <Clock size={14} />
                                    Updated Today
                                </div>
                                <div className="text-primary group-hover:translate-x-1 transition-transform">
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
