import React from 'react';

const ScoreBreakdown = ({ breakdown }) => {
  if (!breakdown) {
    return null;
  }

  const entries = [
    { label: 'Skills', value: breakdown.skills },
    { label: 'Experience', value: breakdown.experience },
    { label: 'Projects', value: breakdown.projects },
    { label: 'Education', value: breakdown.education },
    { label: 'Soft Skills', value: breakdown.soft_skills },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
      {entries.map((entry) => (
        <div key={entry.label} className="flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2">
          <span className="text-slate-400">{entry.label}</span>
          <span className="font-semibold text-slate-100">{Number(entry.value || 0).toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
};

export default ScoreBreakdown;
