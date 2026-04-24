import React from 'react';
import RoundConfigCard from './RoundConfigCard';
import toast from 'react-hot-toast';

const isTechnicalRound = (round) =>
    String(round?.type || '').toUpperCase() === 'INTERVIEW' &&
    /technical/i.test(String(round?.round_name || round?.name || ''));

const Step3ConfigureRounds = ({ selectedRounds, setSelectedRounds, onNext, onBack }) => {
    const handleUpdateRound = (roundId, updates) => {
        setSelectedRounds(prev => prev.map(r =>
            r.id === roundId ? { ...r, ...updates, round_name: updates.round_name || r.round_name || r.name } : r
        ));
    };

    const isAllConfigured = () => {
        return selectedRounds.every(round => {
            const duration = parseInt(round.duration_minutes);
            const hasBasic = duration > 0 && round.difficulty_level;

            if (round.type === 'MCQ' || round.type === 'CODING' || isTechnicalRound(round)) {
                const questions = parseInt(round.num_questions);
                return hasBasic && questions > 0;
            }
            return hasBasic;
        });
    };

    const handleContinue = () => {
        if (!isAllConfigured()) {
            toast.error('Please complete configuration for all rounds');
            return;
        }
        onNext();
    };

    return (
        <div className="space-y-4 animate-fade-in text-foreground">
            <div className="flex items-center justify-between mb-1">
                <div>
                     <h3 className="text-sm font-semibold text-foreground font-heading uppercase tracking-wide">Configure Rounds</h3>
                     <p className="text-muted-foreground text-xs mt-0.5 opacity-80">Set duration, difficulty, and passing criteria.</p>
                </div>
            </div>

            <div className="space-y-3">
                {selectedRounds.map((round, index) => (
                    <RoundConfigCard
                        key={round.id}
                        round={round}
                        index={index}
                        onUpdate={handleUpdateRound}
                    />
                ))}
            </div>

            <div className="pt-2 flex justify-between border-t border-border/20 mt-4">
                <button
                    onClick={onBack}
                     className="px-4 py-2.5 rounded-md font-medium border border-border/30 text-muted-foreground hover:bg-secondary/10 hover:text-foreground transition-all capitalize text-sm"
                >
                    Back to Selection
                </button>
                <button
                    onClick={handleContinue}
                    disabled={!isAllConfigured()}
                    className={`px-6 py-2.5 rounded-md font-semibold transition-all duration-200 capitalize text-sm ${
                        isAllConfigured()
                        ? 'bg-primary hover:bg-primary/90 text-white shadow-md'
                        : 'bg-secondary/10 text-muted-foreground cursor-not-allowed border border-border/20'
                        }`}
                >
                    Review & Publish
                </button>
            </div>
        </div>
    );
};

export default Step3ConfigureRounds;
