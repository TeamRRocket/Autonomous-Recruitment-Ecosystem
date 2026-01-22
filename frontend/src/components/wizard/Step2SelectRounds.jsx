import React, { useState } from 'react';
import { ChevronUp, ChevronDown, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AVAILABLE_ROUNDS = [
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
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <CheckCircle2 className="text-blue-500" size={20} />
                    Available Rounds
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {AVAILABLE_ROUNDS.map(round => {
                        const isSelected = selectedRounds.some(r => r.id === round.id);
                        return (
                            <button
                                key={round.id}
                                onClick={() => toggleRound(round)}
                                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 text-left ${isSelected
                                    ? 'bg-blue-600/10 border-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.1)]'
                                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm uppercase tracking-wide opacity-50 mb-1">{round.type}</span>
                                    <span className="font-semibold">{round.name}</span>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-600'
                                    }`}>
                                    {isSelected && <CheckCircle2 size={16} />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {selectedRounds.length > 0 && (
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Round Order Strategy</h3>
                    <div className="space-y-3">
                        {selectedRounds.map((round, index) => (
                            <div
                                key={round.id}
                                className="flex items-center gap-4 bg-slate-900/50 border border-slate-700 p-4 rounded-xl group hover:border-blue-500/50 transition-colors"
                            >
                                <div className="flex flex-col items-center justify-center w-8 text-slate-500 font-bold">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-white">{round.name}</p>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest">{round.type}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => moveRound(index, 'up')}
                                        disabled={index === 0}
                                        className={`p-2 rounded-lg transition-colors ${index === 0 ? 'text-slate-700' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                                            }`}
                                    >
                                        <ChevronUp size={20} />
                                    </button>
                                    <button
                                        onClick={() => moveRound(index, 'down')}
                                        disabled={index === selectedRounds.length - 1}
                                        className={`p-2 rounded-lg transition-colors ${index === selectedRounds.length - 1 ? 'text-slate-700' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
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
                    className="px-8 py-3 rounded-lg font-semibold border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                >
                    Back to Details
                </button>
                <button
                    onClick={handleContinue}
                    disabled={selectedRounds.length === 0}
                    className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${selectedRounds.length > 0
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                >
                    Configure Rounds Details
                </button>
            </div>
        </div>
    );
};

export default Step2SelectRounds;
