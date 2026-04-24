import React from 'react';
import InputGroup from '../ui/InputGroup';

const isTechnicalRound = (round) =>
    String(round?.type || '').toUpperCase() === 'INTERVIEW' &&
    /technical/i.test(String(round?.round_name || round?.name || ''));

const RoundConfigCard = ({ round, index, onUpdate }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onUpdate(round.id, { [name]: value });
    };

    return (
        <div className="bg-secondary/5 border border-border/20 rounded-lg overflow-hidden group hover:border-primary/30 transition-all duration-300">
            <div className="bg-secondary/10 px-4 py-3 border-b border-border/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs ring-1 ring-primary/20">
                        {index + 1}
                    </div>
                    <div>
                        <input
                            type="text"
                            name="round_name"
                            value={round.round_name || round.name}
                            onChange={handleChange}
                            className="bg-transparent border-none text-foreground font-semibold focus:ring-0 p-0 text-sm w-full placeholder:text-muted-foreground/50"
                            placeholder="Round Name"
                        />
                        <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase mt-0.5 opacity-70">{round.type}</p>
                    </div>
                </div>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Duration (mins)</label>
                    <input
                        type="number"
                        name="duration_minutes"
                        value={round.duration_minutes || ''}
                        onChange={handleChange}
                        className="w-full bg-secondary/5 border border-border/20 rounded-md px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-primary/50 outline-none text-foreground"
                        placeholder="e.g. 60"
                        required
                    />
                </div>

                {(round.type === 'MCQ' || round.type === 'CODING' || isTechnicalRound(round)) && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                            {isTechnicalRound(round) ? 'Questions' : 'Question Count'}
                        </label>
                        <input
                            type="number"
                            name="num_questions"
                            value={round.num_questions || ''}
                            onChange={handleChange}
                             className="w-full bg-secondary/5 border border-border/20 rounded-md px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-primary/50 outline-none text-foreground"
                            placeholder="e.g. 20"
                            required
                        />
                    </div>
                )}

                <div className="space-y-1">
                     <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Difficulty</label>
                    <div className="relative">
                        <select
                            name="difficulty_level"
                            value={round.difficulty_level || 'MEDIUM'}
                            onChange={handleChange}
                             className="w-full bg-secondary/5 border border-border/20 rounded-md px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-primary/50 outline-none appearance-none text-foreground"
                        >
                            <option value="EASY">Easy</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HARD">Hard</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-1">
                     <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Pass Score (%)</label>
                    <input
                        type="number"
                        name="passing_score"
                        value={round.passing_score || 60}
                        onChange={handleChange}
                         className="w-full bg-secondary/5 border border-border/20 rounded-md px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-primary/50 outline-none text-foreground"
                        placeholder="e.g. 70"
                        required
                    />
                </div>
            </div>
        </div>
    );
};

export default RoundConfigCard;
