import React from 'react';
import { MapPin, Briefcase, Calendar, CheckCircle2, Clock, BarChart3, ListChecks } from 'lucide-react';

const Step4ReviewPublish = ({ formData, selectedRounds, onBack, onPublish, isPublishing }) => {
    return (
        <div className="space-y-8 pb-12">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex items-start gap-4">
                <div className="bg-primary p-2 rounded-lg text-white">
                    <CheckCircle2 size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-foreground font-heading">Review & Finalize</h3>
                    <p className="text-muted-foreground mt-1">Please double-check all details before publishing. Once published, the job will be visible to potential candidates immediately.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Job Basic Info */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="glass-card p-8">
                        <div className="flex justify-between items-start mb-6">
                            <h4 className="text-lg font-bold text-foreground font-heading uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Briefcase size={18} /> Basic Information
                            </h4>
                            <button onClick={() => onBack(1)} className="text-primary text-sm font-semibold hover:underline">Edit Details</button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h2 className="text-3xl font-extrabold text-foreground">{formData.title}</h2>
                                <p className="text-primary font-medium mt-1 uppercase tracking-widest text-sm">{formData.department}</p>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent rounded-lg text-foreground text-sm border border-border">
                                    <MapPin size={16} className="text-primary" /> {formData.location}
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent rounded-lg text-foreground text-sm border border-border">
                                    <Briefcase size={16} className="text-primary" /> {formData.type}
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent rounded-lg text-foreground text-sm border border-border">
                                    <BarChart3 size={16} className="text-primary" /> {formData.experience_level}
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent rounded-lg text-foreground text-sm border border-border">
                                    <Calendar size={16} className="text-primary" /> Ends {formData.expires_at}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border space-y-4">
                                <div>
                                    <h5 className="font-bold text-foreground mb-2 flex items-center gap-2">
                                        <ListChecks size={18} className="text-muted-foreground" /> Role Overview
                                    </h5>
                                    <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-wrap">{formData.description}</p>
                                </div>

                                <div>
                                    <h5 className="font-bold text-foreground mb-3 flex items-center gap-2">
                                        <ListChecks size={18} className="text-muted-foreground" /> Core Responsibilities
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {formData.responsibilities.map((resp, i) => (
                                            <div key={i} className="flex items-start gap-2 text-foreground text-sm bg-accent p-3 rounded-xl border border-border">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                                {resp}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Interview Flow */}
                    <section className="glass-card p-8">
                        <div className="flex justify-between items-start mb-6">
                            <h4 className="text-lg font-bold text-foreground font-heading uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Clock size={18} /> Assessment Flow
                            </h4>
                            <button onClick={() => onBack(3)} className="text-primary text-sm font-semibold hover:underline">Edit Flow</button>
                        </div>

                        <div className="space-y-4 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-border hidden md:block" />

                            {selectedRounds.map((round, i) => (
                                <div key={round.id} className="relative flex items-center gap-6 bg-accent p-5 rounded-2xl border border-border group hover:border-primary/30 transition-all duration-300">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-extrabold text-sm border border-primary/30 shrink-0 z-10">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                        <div className="md:col-span-2">
                                            <h5 className="font-bold text-foreground">{round.round_name || round.name}</h5>
                                            <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mt-0.5">{round.type} ASSESSMENT</p>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Duration</span>
                                            <span className="text-foreground font-semibold text-sm">{round.duration_minutes}m</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Criteria</span>
                                            <span className="text-foreground font-semibold text-sm">{round.passing_score || round.passing_criteria?.score || 60}% Passing</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Column: Actions */}
                <div className="space-y-6">
                    <div className="glass-card p-6 sticky top-24">
                        <h4 className="text-foreground font-bold mb-4 flex items-center gap-2">
                            <BarChart3 size={18} className="text-primary" /> Summary
                        </h4>
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Rounds</span>
                                <span className="text-foreground font-bold">{selectedRounds.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Duration</span>
                                <span className="text-foreground font-bold">
                                    {selectedRounds.reduce((acc, r) => acc + (parseInt(r.duration_minutes) || 0), 0)} mins
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Initial Status</span>
                                <span className="status-draft">DRAFT</span>
                            </div>
                        </div>

                        <button
                            onClick={onPublish}
                            disabled={isPublishing}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-xl ${
                                isPublishing
                                    ? 'bg-accent text-muted-foreground cursor-not-allowed'
                                    : 'gradient-primary text-white hover:opacity-90 active:scale-[0.98]'
                                }`}
                        >
                            {isPublishing ? (
                                <>
                                    <Clock size={20} className="animate-spin" />
                                    Publishing...
                                </>
                            ) : (
                                <>
                                    Publish Job Now
                                    <CheckCircle2 size={20} />
                                </>
                            )}
                        </button>

                        <p className="text-[10px] text-center text-muted-foreground mt-4 leading-relaxed">
                            By clicking Publish, you agree to make this job visible to all registered candidates on our platform.
                        </p>
                    </div>

                    <button
                        onClick={() => onBack(3)}
                        disabled={isPublishing}
                        className="w-full py-3 rounded-xl font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-all border border-border"
                    >
                        Back to Configurations
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Step4ReviewPublish;
