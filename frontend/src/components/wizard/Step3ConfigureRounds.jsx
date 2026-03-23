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
        <div className="space-y-8">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-xl font-bold text-foreground font-heading">Configure Interview Experience</h3>
                    <p className="text-muted-foreground text-sm mt-1">Set parameters for each selected round to ensure a fair assessment flow.</p>
                </div>
            </div>

            <div className="space-y-6">
                {selectedRounds.map((round, index) => (
                    <RoundConfigCard
                        key={round.id}
                        round={round}
                        index={index}
                        onUpdate={handleUpdateRound}
                    />
                ))}
            </div>

            <div className="pt-8 flex justify-between border-t border-border">
                <button
                    onClick={onBack}
                    className="px-8 py-3 rounded-lg font-semibold border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-all capitalize"
                >
                    Back to Selection
                </button>
                <button
                    onClick={handleContinue}
                    disabled={!isAllConfigured()}
                    className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 capitalize ${
                        isAllConfigured()
                        ? 'gradient-primary text-white shadow-lg hover:opacity-90'
                        : 'bg-accent text-muted-foreground cursor-not-allowed border border-border'
                        }`}
                >
                    Review & Publish
                </button>
            </div>
        </div>
    );
};

export default Step3ConfigureRounds;
