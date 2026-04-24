import React, { useState } from 'react';
import { ChevronUp, ChevronDown, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AVAILABLE_ROUNDS = [
    { id: 'aptitude', name: 'Aptitude Round', type: 'MCQ' },
    { id: 'dsa', name: 'DSA Round', type: 'CODING' },
    { id: 'tech1', name: 'Technical Round - 1', type: 'INTERVIEW' }
];

const isTechnicalRound = (round) =>
    String(round?.type || '').toUpperCase() === 'INTERVIEW' &&
    /technical/i.test(String(round?.name || ''));

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
                num_questions: (round.type === 'MCQ' || round.type === 'CODING' || isTechnicalRound(round)) ? 10 : null
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
        <div className="space-y-4 animate-fade-in text-foreground">
            {/* Available Rounds Selection */}
            <div className="bg-secondary/5 border border-border/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-foreground font-heading mb-3 flex items-center gap-2 uppercase tracking-wide">
                    <CheckCircle2 className="text-primary" size={16} />
                    Select Rounds
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {AVAILABLE_ROUNDS.map(round => {
                        const isSelected = selectedRounds.some(r => r.id === round.id);
                        return (
                            <button
                                key={round.id}
                                onClick={() => toggleRound(round)}
                                className={`flex items-center justify-between p-3 rounded-md border transition-all duration-200 text-left group
                                    ${isSelected 
                                        ? 'bg-primary/10 border-primary shadow-sm' 
                                        : 'bg-secondary/5 border-border/20 hover:border-primary/30 hover:bg-secondary/10'
                                    }`}
                            >
                                <div className="flex flex-col">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isSelected ? 'text-primary/80' : 'text-muted-foreground/60'}`}>
                                        {round.type}
                                    </span>
                                    <span className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground/80'}`}>
                                        {round.name}
                                    </span>
                                </div>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                    isSelected ? 'bg-primary border-primary text-white' : 'border-border/40 group-hover:border-primary/50'
                                    }`}>
                                    {isSelected && <CheckCircle2 size={12} />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected Rounds Ordering */}
            {selectedRounds.length > 0 && (
                <div className="bg-secondary/5 border border-border/20 rounded-lg p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-foreground font-heading uppercase tracking-wide">Round Sequence</h3>
                    <div className="space-y-2">
                        {selectedRounds.sort((a,b) => a.order - b.order).map((round, index) => (
                            <div
                                key={round.id}
                                className="flex items-center justify-between bg-secondary/5 border border-border/20 p-3 rounded-md group hover:border-primary/30 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                                        {index + 1}
                                    </span>
                                    <div>
                                        <p className="font-medium text-sm text-foreground">{round.name}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{round.type}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={() => moveRound(index, 'up')}
                                        disabled={index === 0}
                                        className="p-1 text-muted-foreground hover:text-primary disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                                    >
                                        <ChevronUp size={16} />
                                    </button>
                                    <button 
                                        onClick={() => moveRound(index, 'down')}
                                        disabled={index === selectedRounds.length - 1}
                                        className="p-1 text-muted-foreground hover:text-primary disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                                    >
                                        <ChevronDown size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Action Button - Mimicking Step 1 */}
            <div className="pt-2">
                <button
                    onClick={handleContinue}
                     className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-md transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-primary/20 text-sm"
                >
                    Confirm Rounds & Configure
                </button>
            </div>
        </div>
    );
};

export default Step2SelectRounds;
