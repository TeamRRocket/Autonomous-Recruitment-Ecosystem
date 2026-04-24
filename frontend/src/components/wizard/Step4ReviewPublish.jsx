import React from 'react';
import { MapPin, Briefcase, Calendar, CheckCircle2, Clock, BarChart3, ListChecks, Edit2 } from 'lucide-react';

const Step4ReviewPublish = ({ formData, selectedRounds, onBack, onPublish, isPublishing }) => {
    const totalDuration = selectedRounds.reduce((acc, r) => acc + (parseInt(r.duration_minutes) || 0), 0);

    return (
        <div className="space-y-4 animate-fade-in text-foreground pb-4">
            {/* Header Alert */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-3">
                <CheckCircle2 size={16} className="text-primary mt-0.5" />
                <div>
                    <h3 className="text-sm font-semibold text-foreground font-heading uppercase tracking-wide">Final Review</h3>
                    <p className="text-muted-foreground text-xs mt-0.5 opacity-80">Double-check details. Publishing makes this job visible immediately.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column: Job & Rounds */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Job Details Card */}
                    <section className="bg-secondary/5 border border-border/20 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3 border-b border-border/20 pb-2">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Briefcase size={14} /> Job Details
                            </h4>
                            <button onClick={() => onBack(1)} className="text-primary hover:text-primary/80 transition-colors">
                                <Edit2 size={12} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <h2 className="text-lg font-bold text-foreground leading-tight">{formData.title}</h2>
                                <p className="text-primary text-xs font-medium uppercase tracking-wide mt-0.5">{formData.department}</p>
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1 bg-secondary/10 px-2 py-1 rounded border border-border/10">
                                    <MapPin size={12} /> {formData.location}
                                </span>
                                <span className="flex items-center gap-1 bg-secondary/10 px-2 py-1 rounded border border-border/10">
                                    <Briefcase size={12} /> {formData.type}
                                </span>
                                <span className="flex items-center gap-1 bg-secondary/10 px-2 py-1 rounded border border-border/10">
                                    <BarChart3 size={12} /> {formData.experience_level}
                                </span>
                                <span className="flex items-center gap-1 bg-secondary/10 px-2 py-1 rounded border border-border/10">
                                    <Calendar size={12} /> {formData.expires_at}
                                </span>
                            </div>

                            <div className="pt-2 border-t border-border/10 space-y-2">
                                <div>
                                    <h5 className="text-xs font-bold text-foreground mb-1">Description</h5>
                                    <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3 hover:line-clamp-none transition-all cursor-default">{formData.description}</p>
                                </div>
                                
                                {formData.responsibilities?.length > 0 && (
                                    <div>
                                        <h5 className="text-xs font-bold text-foreground mb-1">Skills</h5>
                                        <div className="flex flex-wrap gap-1.5">
                                            {formData.responsibilities.map((resp, i) => (
                                                <span key={i} className="text-[10px] bg-primary/5 text-primary border border-primary/10 px-1.5 py-0.5 rounded font-medium">
                                                    {resp}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Interview Flow Card */}
                    <section className="bg-secondary/5 border border-border/20 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3 border-b border-border/20 pb-2">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Clock size={14} /> Workflow ({selectedRounds.length} Rounds)
                            </h4>
                            <button onClick={() => onBack(3)} className="text-primary hover:text-primary/80 transition-colors">
                                <Edit2 size={12} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {selectedRounds.map((round, i) => (
                                <div key={round.id} className="flex items-center gap-3 bg-secondary/5 p-2.5 rounded border border-border/10">
                                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] border border-primary/20 shrink-0">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h5 className="text-xs font-bold text-foreground truncate">{round.round_name || round.name}</h5>
                                            <span className="text-[10px] text-muted-foreground bg-secondary/20 px-1.5 rounded">{round.duration_minutes}m</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">{round.type}</span>
                                            <span className="text-[9px] text-muted-foreground/60">•</span>
                                            <span className="text-[9px] text-muted-foreground">Pass: {round.passing_score}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Column: Actions */}
                <div className="space-y-3">
                    <div className="bg-secondary/5 border border-border/20 rounded-lg p-4 sticky top-4">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                             Summary
                        </h4>
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Rounds</span>
                                <span className="text-foreground font-medium">{selectedRounds.length}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Duration</span>
                                <span className="text-foreground font-medium">{totalDuration} mins</span>
                            </div>
                            <div className="flex justify-between text-xs items-center">
                                <span className="text-muted-foreground">Status</span>
                                <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/20 font-bold uppercase tracking-wider">Draft</span>
                            </div>
                        </div>

                        <button
                            onClick={onPublish}
                            disabled={isPublishing}
                            className={`w-full py-2.5 rounded-md font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
                                isPublishing
                                    ? 'bg-accent text-muted-foreground cursor-not-allowed'
                                    : 'bg-primary hover:bg-primary/90 text-white'
                                }`}
                        >
                            {isPublishing ? (
                                <>
                                    <Clock size={14} className="animate-spin" />
                                    Publishing...
                                </>
                            ) : (
                                <>
                                    Publish Job Now
                                    <CheckCircle2 size={14} />
                                </>
                            )}
                        </button>
                    </div>

                    <button
                        onClick={() => onBack(3)}
                        disabled={isPublishing}
                        className="w-full py-2.5 rounded-md font-semibold text-xs text-muted-foreground hover:bg-secondary/10 hover:text-foreground transition-all border border-border/20"
                    >
                        Back to Configurations
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Step4ReviewPublish;
