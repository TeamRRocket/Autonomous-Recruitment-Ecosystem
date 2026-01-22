import React from 'react';
import InputGroup from '../ui/InputGroup';

const RoundConfigCard = ({ round, index, onUpdate }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onUpdate(round.id, { [name]: value });
    };

    return (
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
            <div className="bg-slate-800/60 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                        {index + 1}
                    </div>
                    <div>
                        <input
                            type="text"
                            name="round_name"
                            value={round.round_name || round.name}
                            onChange={handleChange}
                            className="bg-transparent border-none text-white font-bold focus:ring-0 p-0 text-lg w-full"
                            placeholder="Round Name"
                        />
                        <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">{round.type}</p>
                    </div>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InputGroup
                    label="Duration (mins)"
                    name="duration_minutes"
                    type="number"
                    required
                    value={round.duration_minutes || ''}
                    onChange={handleChange}
                    placeholder="e.g. 60"
                />

                {(round.type === 'MCQ' || round.type === 'CODING') && (
                    <InputGroup
                        label="No. of Questions"
                        name="num_questions"
                        type="number"
                        required
                        value={round.num_questions || ''}
                        onChange={handleChange}
                        placeholder="e.g. 20"
                    />
                )}

                <InputGroup
                    label="Difficulty"
                    name="difficulty_level"
                    options={['EASY', 'MEDIUM', 'HARD']}
                    required
                    value={round.difficulty_level || 'MEDIUM'}
                    onChange={handleChange}
                />

                <InputGroup
                    label="Passing Score (%)"
                    name="passing_score"
                    type="number"
                    required
                    value={round.passing_score || 60}
                    onChange={handleChange}
                    placeholder="e.g. 70"
                />
            </div>
        </div>
    );
};

export default RoundConfigCard;
