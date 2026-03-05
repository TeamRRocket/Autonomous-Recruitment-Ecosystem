import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import ScoreBreakdown from './ScoreBreakdown';

const ResumeScoreCard = ({ candidate, index }) => {
  const score = Number(
    candidate?.final_score ??
      candidate?.total_score ??
      candidate?.resume_score ??
      0
  );

  const displayRank = candidate?.rank ?? index + 1;
  const breakdown = candidate?.score_breakdown ?? candidate?.resume_score_breakdown;
  const strengths = candidate?.strengths ?? [];
  const gaps = candidate?.gaps ?? [];

  return (
    <div className="glass-card p-6 shadow-xl animate-slide-up">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Rank #{displayRank}</p>
            <h3 className="text-xl font-semibold text-foreground font-heading mt-1">{candidate?.name || 'Candidate'}</h3>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Final Score</p>
            <p className="text-3xl font-bold text-success">{score.toFixed(1)}</p>
          </div>
        </div>

        <div className="w-full h-2 rounded-full bg-accent overflow-hidden">
          <div
            className="h-full gradient-primary"
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>

        <ScoreBreakdown breakdown={breakdown} />

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl border border-success/20 bg-success/5 p-4">
            <div className="flex items-center gap-2 text-success font-semibold mb-2">
              <CheckCircle2 size={16} />
              Strengths
            </div>
            <ul className="space-y-1 text-foreground">
              {strengths.length === 0 ? (
                <li className="text-muted-foreground">No strengths noted yet.</li>
              ) : (
                strengths.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-success">✔</span>
                    <span>{item}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
            <div className="flex items-center gap-2 text-warning font-semibold mb-2">
              <AlertTriangle size={16} />
              Gaps
            </div>
            <ul className="space-y-1 text-foreground">
              {gaps.length === 0 ? (
                <li className="text-muted-foreground">No gaps noted yet.</li>
              ) : (
                gaps.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-warning">⚠</span>
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
