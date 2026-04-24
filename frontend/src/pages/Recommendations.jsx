import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Target, Building2 } from 'lucide-react';
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

    const getMatchColor = (score) => {
        if (score >= 80) return 'text-emerald-500';
        if (score >= 60) return 'text-amber-500';
        return 'text-red-500';
    };

    const getProgressBarColor = (score) => {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 60) return 'bg-amber-500';
        return 'bg-red-500';
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col gap-6 animate-pulse">
                    <div className="h-8 w-64 bg-secondary/20 rounded-lg" />
                    <div className="flex flex-col gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-secondary/10 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="text-primary fill-primary/20" size={24} />
                    AI Recommendations
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Jobs matched to your profile using AI analysis
                </p>
            </div>

            {recommendations.length === 0 ? (
                <div className="py-24 text-center bg-secondary/5 rounded-2xl border border-dashed border-border/40">
                    <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target size={32} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">No recommendations yet</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                        Update your profile with more skills to get personalized job matches.
                    </p>
                    <Link
                        to="/profile"
                        className="inline-flex items-center px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-primary/20"
                    >
                        Update Profile
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {recommendations.map((job) => (
                        <div
                            key={job.job_id}
                            className="bg-card hover:bg-card/80 border border-border/40 rounded-xl p-6 transition-all duration-300 group"
                        >
                            {/* Header Section */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                        {job.job_title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Building2 size={14} className="text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">
                                            {job.company || "Autonomous Ecosystem"}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-2xl font-bold ${getMatchColor(job.match_score)}`}>
                                        {job.match_score}%
                                    </div>
                                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                        Match
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-secondary/30 h-1.5 rounded-full mb-6 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressBarColor(job.match_score)}`}
                                    style={{ width: `${job.match_score}%` }}
                                />
                            </div>

                            {/* Included Insight Box */}
                            <div className="bg-secondary/10 rounded-lg p-4 mb-6 border border-border/10">
                                <div className="flex gap-3 items-start">
                                    <Sparkles className="w-4 h-4 text-primary mt-1 shrink-0" />
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {job.reason}
                                    </p>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div>
                                <Link
                                    to={`/jobs/${job.job_id}`}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/20 hover:bg-secondary/30 text-foreground text-sm font-medium rounded-lg transition-colors group-hover:translate-x-1"
                                >
                                    View Job <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Recommendations;
