import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import ScoreBreakdown from './ScoreBreakdown';

const ResumeScoreCard = ({ candidate, index }) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Rank #{index + 1}</p>
            <h3 className="text-xl font-semibold text-white mt-1">{candidate.name}</h3>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Final Score</p>
            <p className="text-3xl font-bold text-emerald-400">{candidate.final_score.toFixed(1)}</p>
          </div>
        </div>

        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400"
            style={{ width: `${Math.min(100, Math.max(0, candidate.final_score))}%` }}
          />
        </div>

        <ScoreBreakdown breakdown={candidate.score_breakdown} />

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold mb-2">
              <CheckCircle2 size={16} />
              Strengths
            </div>
            <ul className="space-y-1 text-slate-300">
              {(candidate.strengths || []).length === 0 ? (
                <li className="text-slate-500">No strengths noted yet.</li>
              ) : (
                candidate.strengths.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400">✔</span>
                    <span>{item}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 text-amber-300 font-semibold mb-2">
              <AlertTriangle size={16} />
              Gaps
            </div>
            <ul className="space-y-1 text-slate-300">
              {(candidate.gaps || []).length === 0 ? (
                <li className="text-slate-500">No gaps noted yet.</li>
              ) : (
                candidate.gaps.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-300">⚠</span>
                    <span>{item}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeScoreCard;
