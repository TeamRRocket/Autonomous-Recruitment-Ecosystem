import React, { useState } from 'react';
import { ChevronUp, ChevronDown, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AVAILABLE_ROUNDS = [
    { id: 'resume', name: 'Resume Screening', type: 'INTERVIEW' },
    { id: 'aptitude', name: 'Aptitude Round', type: 'MCQ' },
    { id: 'dsa', name: 'DSA Round', type: 'CODING' },
    { id: 'tech1', name: 'Technical Round – 1', type: 'INTERVIEW' },
    { id: 'tech2', name: 'Technical Round – 2', type: 'INTERVIEW' },
    { id: 'hr', name: 'HR / Behavioral Round', type: 'INTERVIEW' }
];

const Step2SelectRounds = ({ selectedRounds, setSelectedRounds, onNext, onBack }) => {
    // selectedRounds is array of { id, name, type, order }

    const toggleRound = (round) => {
        const exists = selectedRounds.find(r => r.id === round.id);
        if (exists) {
            setSelectedRounds(prev => prev.filter(r => r.id !== round.id).map((r, i) => ({ ...r, order: i + 1 })));
        } else {
            setSelectedRounds(prev => [...prev, {
                ...round,
                order: prev.length + 1,
                duration_minutes: 60,
                difficulty_level: 'MEDIUM',
                passing_score: 60,
                num_questions: (round.type === 'MCQ' || round.type === 'CODING') ? 10 : null
            }]);
        }
    };

    const moveRound = (index, direction) => {
        const newRounds = [...selectedRounds];
        if (direction === 'up' && index > 0) {
            [newRounds[index], newRounds[index - 1]] = [newRounds[index - 1], newRounds[index]];
        } else if (direction === 'down' && index < newRounds.length - 1) {
            [newRounds[index], newRounds[index + 1]] = [newRounds[index + 1], newRounds[index]];
        }

        // Update order property
        setSelectedRounds(newRounds.map((r, i) => ({ ...r, order: i + 1 })));
    };

    const handleContinue = () => {
        if (selectedRounds.length === 0) {
            toast.error('Please select at least one round');
            return;
        }
        onNext();
    };

    return (
        <div className="space-y-8">
            <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-foreground font-heading mb-4 flex items-center gap-2">
                    <CheckCircle2 className="text-primary" size={20} />
                    Available Rounds
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {AVAILABLE_ROUNDS.map(round => {
                        const isSelected = selectedRounds.some(r => r.id === round.id);
                        return (
                            <button
                                key={round.id}
                                onClick={() => toggleRound(round)}
                                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                                    isSelected
                                    ? 'bg-primary/10 border-primary shadow-lg'
                                    : 'bg-accent border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex flex-col">
                                    <span className={`font-bold text-sm uppercase tracking-wide mb-1 ${isSelected ? 'text-primary/70' : 'text-muted-foreground/70'}`}>{round.type}</span>
                                    <span className={`font-semibold ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>{round.name}</span>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    isSelected ? 'bg-primary border-primary text-white' : 'border-border'
                                    }`}>
                                    {isSelected && <CheckCircle2 size={16} />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {selectedRounds.length > 0 && (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-foreground font-heading mb-4">Round Order Strategy</h3>
                    <div className="space-y-3">
                        {selectedRounds.map((round, index) => (
                            <div
                                key={round.id}
                                className="flex items-center gap-4 bg-accent border border-border p-4 rounded-xl group hover:border-primary/50 transition-colors"
                            >
                                <div className="flex flex-col items-center justify-center w-8 text-muted-foreground font-bold">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-foreground">{round.name}</p>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest">{round.type}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => moveRound(index, 'up')}
                                        disabled={index === 0}
                                        className={`p-2 rounded-lg transition-colors ${
                                            index === 0 ? 'text-muted-foreground/30' : 'text-muted-foreground hover:bg-accent/80 hover:text-foreground'
                                            }`}
                                    >
                                        <ChevronUp size={20} />
                                    </button>
                                    <button
                                        onClick={() => moveRound(index, 'down')}
                                        disabled={index === selectedRounds.length - 1}
                                        className={`p-2 rounded-lg transition-colors ${
                                            index === selectedRounds.length - 1 ? 'text-muted-foreground/30' : 'text-muted-foreground hover:bg-accent/80 hover:text-foreground'
                                            }`}
                                    >
                                        <ChevronDown size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="pt-6 flex justify-between">
                <button
                    onClick={onBack}
                    className="px-8 py-3 rounded-lg font-semibold border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
                >
                    Back to Details
                </button>
                <button
                    onClick={handleContinue}
                    disabled={selectedRounds.length === 0}
                    className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
                        selectedRounds.length > 0
                        ? 'gradient-primary text-white shadow-lg hover:opacity-90'
                        : 'bg-accent text-muted-foreground cursor-not-allowed border border-border'
                        }`}
                >
                    Configure Rounds Details
                </button>
            </div>
        </div>
    );
};

export default Step2SelectRounds;
