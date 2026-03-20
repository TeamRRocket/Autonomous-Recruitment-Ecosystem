import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getJobOverview, getMyJobs } from '../../services/jobService';
import { getJobScores } from '../../services/jobScoresService';
import { rankCandidates, selectTopCandidates } from '../../services/recruiter.api';
import { getRounds } from '../../services/roundService';

const RecruiterScores = () => {
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState('');

  const [scores, setScores] = useState(null);
  const [loadingScores, setLoadingScores] = useState(false);
  const [rankingData, setRankingData] = useState(null);
  const [ranking, setRanking] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState(null);

  const [selectOpen, setSelectOpen] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [topN, setTopN] = useState(50);
  const [firstRound, setFirstRound] = useState('');
  const [selectableNextRound, setSelectableNextRound] = useState('');
  const [loadingFirstRound, setLoadingFirstRound] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewDay, setInterviewDay] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [selectionLockUntil, setSelectionLockUntil] = useState(null);

  useEffect(() => {
    const loadJobs = async () => {
      setLoadingJobs(true);
      try {
        const res = await getMyJobs();
        setJobs(res.data || []);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load jobs');
      } finally {
        setLoadingJobs(false);
      }
    };

    loadJobs();
  }, []);

  useEffect(() => {
    const loadScores = async () => {
      if (!selectedJobId) {
        setScores(null);
        setRankingData(null);
        setInsightsOpen(false);
        setSelectedInsight(null);
        setFirstRound('');
        setSelectableNextRound('');
        setInterviewDate('');
        setInterviewDay('');
        setTimeFrom('');
        setTimeTo('');
        setSelectionLockUntil(null);
        return;
      }

      setLoadingScores(true);
      try {
        const res = await getJobScores(selectedJobId);
        setScores(res.data);
      } catch (err) {
        setScores(null);
        toast.error(err.response?.data?.message || 'Failed to load scores');
      } finally {
        setLoadingScores(false);
      }
    };

    loadScores();
  }, [selectedJobId]);

  useEffect(() => {
    const loadFirstRound = async () => {
      if (!selectedJobId) {
        setFirstRound('');
        setSelectableNextRound('');
        return;
      }
      setLoadingFirstRound(true);
      try {
        const res = await getJobOverview(selectedJobId);
        // jobService.getJobOverview returns response.data
        // shape: { status: 'success', data: jobWithRounds }
        const job = res?.data;
        setSelectionLockUntil(job?.selection_lock_until || null);
        let rounds = Array.isArray(job?.rounds) ? job.rounds : [];

        // Fallback: rounds are authored/saved via rounds module; if overview doesn't include them, fetch directly.
        if (!rounds.length) {
          try {
            const r = await getRounds(selectedJobId);
            rounds = Array.isArray(r?.data) ? r.data : [];
          } catch {
            // ignore
          }
        }

        const normalized = rounds
          .map((r) => ({
            round_type: String(r?.round_type || '').toUpperCase(),
            round_name: String(r?.round_name || ''),
            round_order: r?.round_order
          }))
          .filter((r) => r.round_type);

        const first = normalized.length > 0 ? normalized[0] : null;
        if (!first) {
          setFirstRound('');
          setSelectableNextRound('');
          return;
        }

        // UI label: map stored round_type to product terms
        // interview_rounds.round_type uses: MCQ/CODING/INTERVIEW
        // We treat MCQ as APTITUDE. For CODING, if name includes DSA we treat as DSA.
        const firstLabel = (() => {
          if (first.round_type === 'MCQ') return 'APTITUDE';
          if (first.round_type === 'CODING') {
            return /dsa/i.test(first.round_name) ? 'DSA' : 'CODING';
          }
          if (first.round_type === 'INTERVIEW') {
            return /technical/i.test(first.round_name) ? 'TECHNICAL' : 'INTERVIEW';
          }
          return first.round_type;
        })();
        setFirstRound(firstLabel);

        // Backend selection + applications.next_round supports APTITUDE/DSA/TECHNICAL/INTERVIEW
        let next = '';
        if (normalized.some((r) => r.round_type === 'MCQ')) next = 'APTITUDE';
        else if (normalized.some((r) => r.round_type === 'CODING')) next = 'DSA';
        else if (normalized.some((r) => r.round_type === 'INTERVIEW' && /technical/i.test(r.round_name))) next = 'TECHNICAL';
        else if (normalized.some((r) => r.round_type === 'INTERVIEW')) next = 'INTERVIEW';
        setSelectableNextRound(next);
      } catch {
        setFirstRound('');
        setSelectableNextRound('');
        setSelectionLockUntil(null);
      } finally {
        setLoadingFirstRound(false);
      }
    };

    loadFirstRound();
  }, [selectedJobId]);

  useEffect(() => {
    if (!interviewDate) {
      setInterviewDay('');
      return;
    }
    const d = new Date(`${interviewDate}T00:00:00`);
    if (Number.isNaN(d.getTime())) {
      setInterviewDay('');
      return;
    }
    setInterviewDay(d.toLocaleDateString(undefined, { weekday: 'long' }));
  }, [interviewDate]);

  const handleRank = async () => {
    if (!selectedJobId) {
      toast.error('Select a job first');
      return;
    }

    setRanking(true);
    try {
      const res = await rankCandidates(selectedJobId);
      setRankingData(res.data);
      toast.success('Candidates ranked');

      // Refresh scores view after ranking (optional but keeps UI in sync)
      try {
        const scoresRes = await getJobScores(selectedJobId);
        setScores(scoresRes.data);
      } catch {
        // ignore
      }
    } catch (err) {
      setRankingData(null);
      toast.error(err.response?.data?.message || 'Ranking failed');
    } finally {
      setRanking(false);
    }
  };

  const candidates = useMemo(() => scores?.candidates || [], [scores]);
  const insightsByCandidateId = useMemo(() => {
    const list = rankingData?.ranked_candidates || [];
    const map = new Map();
    for (const item of list) {
      if (item?.candidate_id) map.set(item.candidate_id, item);
    }
    return map;
  }, [rankingData]);

  const displayCandidates = useMemo(() => {
    if (!candidates.length) return candidates;
    if (!rankingData?.ranked_candidates?.length) return candidates;

    return [...candidates].sort((a, b) => {
      const aRank = insightsByCandidateId.get(a?.candidate?.id)?.rank;
      const bRank = insightsByCandidateId.get(b?.candidate?.id)?.rank;

      const aHasRank = Number.isFinite(aRank);
      const bHasRank = Number.isFinite(bRank);

      if (aHasRank && bHasRank) return aRank - bRank;
      if (aHasRank) return -1;
      if (bHasRank) return 1;
      return 0;
    });
  }, [candidates, insightsByCandidateId, rankingData]);

  const openInsights = (insight) => {
    setSelectedInsight(insight);
    setInsightsOpen(true);
  };

  const closeInsights = () => {
    setInsightsOpen(false);
    setSelectedInsight(null);
  };

  const closeSelect = () => {
    if (selecting) return;
    setSelectOpen(false);
  };

  const isValidAmPmTime = (value) => {
    if (!value) return false;
    return /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i.test(String(value).trim());
  };

  const parseAmPmTo24h = (value) => {
    const v = String(value || '').trim();
    const match = v.match(/^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM)$/i);
    if (!match) return null;
    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const meridiem = String(match[3]).toUpperCase();
    if (meridiem === 'AM') {
      if (hours === 12) hours = 0;
    } else {
      if (hours !== 12) hours += 12;
    }
    return { hours, minutes };
  };

  const isSelectionLocked = useMemo(() => {
    if (!selectionLockUntil) return false;
    const d = new Date(selectionLockUntil);
    if (Number.isNaN(d.getTime())) return false;
    return d > new Date();
  }, [selectionLockUntil]);

  const handleSendSelection = async () => {
    if (!selectedJobId) {
      toast.error('Select a job first');
      return;
    }
    if (!rankingData?.ranked_candidates?.length) {
      toast.error('Please rank candidates first');
      return;
    }
    if (!selectableNextRound) {
      toast.error('This job must include at least one round (APTITUDE, DSA, or TECHNICAL) to proceed');
      return;
    }
    if (!topN || Number.isNaN(Number(topN)) || Number(topN) <= 0) {
      toast.error('Top N must be a positive number');
      return;
    }
    if (!interviewDate || !timeFrom || !timeTo) {
      toast.error('Please fill interview date and time interval');
      return;
    }
    if (!isValidAmPmTime(timeFrom) || !isValidAmPmTime(timeTo)) {
      toast.error('Time must be in hh:mm AM/PM format (e.g., 05:00 PM)');
      return;
    }

    const startParts = parseAmPmTo24h(timeFrom);
    if (!startParts) {
      toast.error('Invalid start time format');
      return;
    }

    const endParts = parseAmPmTo24h(timeTo);
    if (!endParts) {
      toast.error('Invalid end time format');
      return;
    }

    const lockFrom = new Date(`${interviewDate}T00:00:00`);
    lockFrom.setHours(startParts.hours, startParts.minutes, 0, 0);
    if (Number.isNaN(lockFrom.getTime())) {
      toast.error('Invalid interview date');
      return;
    }

    const lockUntil = new Date(`${interviewDate}T00:00:00`);
    lockUntil.setHours(endParts.hours, endParts.minutes, 0, 0);
    if (Number.isNaN(lockUntil.getTime())) {
      toast.error('Invalid interview date');
      return;
    }

    if (lockFrom > lockUntil) {
      toast.error('Start time must be before end time');
      return;
    }

    setSelecting(true);
    try {
      const payload = {
        top_n: Number(topN),
        next_round: selectableNextRound,
        date: `${interviewDate}${interviewDay ? ` (${interviewDay})` : ''}`,
        time: `${timeFrom} to ${timeTo}`,
        duration: '',
        instructions: 'Please join on time. Further details will be shared soon.',
        lock_from: lockFrom.toISOString(),
        lock_until: lockUntil.toISOString()
      };

      await selectTopCandidates(selectedJobId, payload);
      toast.success('Emails sent. Non-selected candidates removed.');

      setSelectionLockUntil(lockUntil.toISOString());

      const scoresRes = await getJobScores(selectedJobId);
      setScores(scoresRes.data);
      setSelectOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send emails');
    } finally {
      setSelecting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Recruiter</p>
          <h1 className="text-3xl font-bold gradient-text font-heading mt-2">Candidate Scores</h1>
          <p className="text-muted-foreground mt-2">View round-wise scores as candidates submit assessments.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <select
            className="bg-input border border-border text-foreground rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring"
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            disabled={loadingJobs}
          >
            <option value="">Select a job</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>

          <button
            onClick={handleRank}
            disabled={!selectedJobId || ranking}
            className="px-5 py-2.5 rounded-xl gradient-primary text-white font-semibold shadow-lg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {ranking ? 'Ranking...' : 'Rank Candidates'}
          </button>

          <button
            onClick={() => {
              if (!rankingData?.ranked_candidates?.length) {
                toast.error('Please rank candidates first');
                return;
              }
              if (isSelectionLocked) {
                toast.error('Selection is locked until the interview window ends');
                return;
              }
              if (interviewDate) {
                const d = new Date(`${interviewDate}T00:00:00`);
                if (!Number.isNaN(d.getTime())) {
                  setInterviewDay(d.toLocaleDateString(undefined, { weekday: 'long' }));
                }
              }
              setSelectOpen(true);
            }}
            disabled={!selectedJobId || selecting || !rankingData?.ranked_candidates?.length || isSelectionLocked}
            className="px-5 py-2.5 rounded-xl bg-success hover:bg-success/90 text-white font-semibold shadow-lg transition-opacity disabled:opacity-50"
          >
            {selecting ? 'Sending...' : 'Select'}
          </button>
        </div>
      </div>

      {loadingScores && (
        <div className="glass-card p-6 text-muted-foreground">Loading scores...</div>
      )}

      {!loadingScores && selectedJobId && candidates.length === 0 && (
        <div className="glass-card p-6 text-muted-foreground">No candidates found for this job yet.</div>
      )}

      {!loadingScores && candidates.length > 0 && (
        <div className="space-y-3">
          {displayCandidates.map((row) => (
            <div key={row.candidate.id} className="glass-card p-5 animate-slide-up">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-foreground font-semibold text-lg font-heading">{row.candidate.name}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">{row.application.status}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-accent border border-border rounded-xl px-3 py-2">
                    <p className="text-xs text-muted-foreground">Resume</p>
                    <p className="text-foreground font-semibold">{row.scores.resume.score ?? '--'}</p>
                  </div>
                  <div className="bg-accent border border-border rounded-xl px-3 py-2">
                    <p className="text-xs text-muted-foreground">Aptitude</p>
                    <p className="text-foreground font-semibold">
                      {row.scores.aptitude.correct != null && row.scores.aptitude.total != null
                        ? `${row.scores.aptitude.correct}/${row.scores.aptitude.total}`
                        : (row.scores.aptitude.score ?? '--')}
                      {row.scores.aptitude.percent != null ? ` (${row.scores.aptitude.percent}%)` : ''}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{row.scores.aptitude.status}</p>
                  </div>
                  <div className="bg-accent border border-border rounded-xl px-3 py-2">
                    <p className="text-xs text-muted-foreground">DSA</p>
                    <p className="text-foreground font-semibold">{row.scores.dsa.score ?? '--'}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{row.scores.dsa.status}</p>
                  </div>
                  <div className="bg-accent border border-border rounded-xl px-3 py-2">
                    <p className="text-xs text-muted-foreground">Coding</p>
                    <p className="text-foreground font-semibold">
                      {row.scores.coding.avg_score_percent ?? '--'}
                      {row.scores.coding.avg_score_percent != null ? '%' : ''}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{(row.scores.coding.rounds || []).length} rounds</p>
                  </div>
                </div>
              </div>

              {/* Proctoring Summary */}
              {row.proctoring && row.proctoring.sessions.length > 0 && (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground uppercase tracking-widest">Proctoring Summary</span>
                      {row.proctoring.overall_risk_level && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            row.proctoring.overall_risk_level === 'Low'
                              ? 'bg-success/20 text-success border border-success/30'
                              : row.proctoring.overall_risk_level === 'Medium'
                                ? 'bg-warning/20 text-warning border border-warning/30'
                                : row.proctoring.overall_risk_level === 'High'
                                  ? 'bg-destructive/20 text-destructive border border-destructive/30'
                                  : 'bg-muted/20 text-muted-foreground border border-muted/30'
                            }`}
                        >
                          {row.proctoring.overall_risk_level} Risk
                        </span>
                      )}
                      {row.proctoring.overall_risk_score != null && (
                        <span className="text-xs text-muted-foreground">
                          Score: <span className="text-foreground font-semibold">{row.proctoring.overall_risk_score}/100</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Overall reason from LLM */}
                  {row.proctoring.overall_reason && (
                    <p className="text-xs text-foreground mb-3 bg-accent border border-border rounded-lg px-3 py-2 leading-relaxed">
                      {row.proctoring.overall_reason}
                    </p>
                  )}

                  {/* Per-session breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {row.proctoring.sessions.map((session) => {
                      const hasEvents = session.total_no_face > 0 || session.total_multiple_face > 0 || session.total_looking_away > 0 || session.total_tab_switch > 0 || session.total_window_blur > 0 || session.total_copy_paste > 0 || session.total_phone_detected > 0;
                      const cheatingDetected = session.risk_level === 'High' || session.total_phone_detected > 0 || session.total_multiple_face > 2;

                      return (
                        <div key={session.session_id} className="bg-accent border border-border rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-foreground uppercase">{session.round_type} Round</span>
                            <div className="flex items-center gap-2">
                              {cheatingDetected ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/20 text-destructive border border-destructive/30">
                                  ⚠ Suspicious
                                </span>
                              ) : hasEvents ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning/20 text-warning border border-warning/30">
                                  Minor Issues
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/20 text-success border border-success/30">
                                  ✓ Clean
                                </span>
                              )}
                              {session.risk_score != null && (
                                <span className="text-[10px] text-muted-foreground">{session.risk_score}/100</span>
                              )}
                            </div>
                          </div>

                          {hasEvents && (
                            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                              {session.total_no_face > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                  <span>No Face</span>
                                  <span className="text-foreground font-medium">{session.total_no_face}</span>
                                </div>
                              )}
                              {session.total_multiple_face > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Multiple Faces</span>
                                  <span className="text-destructive font-medium">{session.total_multiple_face}</span>
                                </div>
                              )}
                              {session.total_looking_away > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Looking Away</span>
                                  <span className="text-foreground font-medium">{session.total_looking_away}</span>
                                </div>
                              )}
                              {session.total_tab_switch > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Tab Switches</span>
                                  <span className="text-warning font-medium">{session.total_tab_switch}</span>
                                </div>
                              )}
                              {session.total_phone_detected > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Phone Detected</span>
                                  <span className="text-destructive font-medium">{session.total_phone_detected}</span>
                                </div>
                              )}
                              {session.total_copy_paste > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Copy/Paste</span>
                                  <span className="text-warning font-medium">{session.total_copy_paste}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {!hasEvents && (
                            <p className="text-[11px] text-muted-foreground">No suspicious activity detected</p>
                          )}

                          {session.llm_reason && (
                            <p className="text-[10px] text-muted-foreground mt-2 italic leading-relaxed">{session.llm_reason}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No Proctoring Data */}
              {(!row.proctoring || row.proctoring.sessions.length === 0) && (
                <div className="mt-4 border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-widest">Proctoring: No data yet</span>
                </div>
              )}

              {insightsByCandidateId.has(row.candidate.id) && (
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">
                    Rank:{' '}
                    <span className="text-foreground font-semibold">
                      {insightsByCandidateId.get(row.candidate.id)?.rank ?? '--'}
                    </span>
                    <span className="mx-2 text-border">|</span>
                    Total Score:{' '}
                    <span className="text-foreground font-semibold">
                      {Number(
                        insightsByCandidateId.get(row.candidate.id)?.final_score ??
                        insightsByCandidateId.get(row.candidate.id)?.total_score ??
                        insightsByCandidateId.get(row.candidate.id)?.resume_score ??
                        0
                      ).toFixed(1)}
                    </span>
                  </div>

                  <button
                    onClick={() => openInsights(insightsByCandidateId.get(row.candidate.id))}
                    className="px-4 py-2 rounded-xl bg-accent hover:bg-accent/80 text-foreground font-semibold transition border border-border"
                  >
                    View Insights
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {insightsOpen && selectedInsight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeInsights} />
          <div className="relative w-full max-w-2xl glass-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Candidate Insights</p>
                <h3 className="text-xl font-semibold text-foreground font-heading mt-2">
                  {selectedInsight.candidate_name || 'Candidate'}
                </h3>
              </div>

              <button
                onClick={closeInsights}
                className="px-3 py-1.5 rounded-xl bg-accent hover:bg-accent/80 text-foreground font-semibold transition border border-border"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
              <div className="bg-accent border border-border rounded-xl px-3 py-2">
                <p className="text-xs text-muted-foreground">Rank</p>
                <p className="text-foreground font-semibold">{selectedInsight.rank ?? '--'}</p>
              </div>
              <div className="bg-accent border border-border rounded-xl px-3 py-2">
                <p className="text-xs text-muted-foreground">Total Score</p>
                <p className="text-foreground font-semibold">
                  {Number(
                    selectedInsight.final_score ??
                    selectedInsight.total_score ??
                    selectedInsight.resume_score ??
                    0
                  ).toFixed(1)}
                </p>
              </div>
            </div>

            {(selectedInsight.resume_summary || selectedInsight.summary) && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Summary</p>
                <p className="text-foreground mt-2 text-sm leading-relaxed">
                  {selectedInsight.resume_summary || selectedInsight.summary}
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-accent border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Strengths</p>
                <div className="mt-2 space-y-2">
                  {(selectedInsight.strengths || []).length > 0 ? (
                    (selectedInsight.strengths || []).map((s, i) => (
                      <p key={i} className="text-sm text-foreground">{s}</p>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No strengths noted yet.</p>
                  )}
                </div>
              </div>

              <div className="bg-accent border border-border rounded-xl p-4">
                {isSelectionLocked && (
                  <div className="rounded-xl border border-border bg-accent/60 px-3 py-2 text-sm text-foreground mb-3">
                    Selection is locked until: <span className="text-foreground font-semibold">{new Date(selectionLockUntil).toLocaleString()}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Gaps</p>
                <div className="mt-2 space-y-2">
                  {(selectedInsight.gaps || []).length > 0 ? (
                    (selectedInsight.gaps || []).map((g, i) => (
                      <p key={i} className="text-sm text-foreground">{g}</p>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No gaps noted yet.</p>
                  )}
                </div>
              </div>
            </div>

            {selectedInsight.resume_score_breakdown && (
              <div className="mt-4 bg-accent border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Score Breakdown</p>
                <pre className="mt-2 text-xs text-foreground overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedInsight.resume_score_breakdown, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {selectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeSelect} />
          <div className="relative w-full max-w-xl glass-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Selection</p>
                <h3 className="text-xl font-semibold text-foreground font-heading mt-2">Send Interview Details</h3>
              </div>

              <button
                onClick={closeSelect}
                disabled={selecting}
                className="px-3 py-1.5 rounded-xl bg-accent hover:bg-accent/80 text-foreground font-semibold transition border border-border disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Top N candidates</p>
                <input
                  type="number"
                  min="1"
                  value={topN}
                  onChange={(e) => setTopN(e.target.value)}
                  className="mt-2 w-full bg-input border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. 50"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">First round</p>
                <div className="mt-2 w-full bg-input border border-border rounded-xl px-3 py-2 text-foreground">
                  {loadingFirstRound ? 'Loading...' : (firstRound || '--')}
                </div>
                {!loadingFirstRound && !selectableNextRound && (
                  <p className="text-[11px] text-muted-foreground mt-2">Add an APTITUDE, DSA, or TECHNICAL round in this job to enable selection emails.</p>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Interview date + day</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full bg-input border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="w-full bg-input border border-border rounded-xl px-3 py-2 text-foreground">
                    {interviewDay || '--'}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Time interval</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <input
                    type="text"
                    value={timeFrom}
                    onChange={(e) => setTimeFrom(e.target.value)}
                    className="w-full bg-input border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="05:00 PM"
                  />
                  <input
                    type="text"
                    value={timeTo}
                    onChange={(e) => setTimeTo(e.target.value)}
                    className="w-full bg-input border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="07:00 PM"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <p className="text-[11px] text-muted-foreground">Start time</p>
                  <p className="text-[11px] text-muted-foreground">End time</p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">Format: hh:mm AM/PM (example: 05:00 PM)</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={handleSendSelection}
                disabled={selecting}
                className="px-5 py-2.5 rounded-xl bg-success hover:bg-success/90 text-white font-semibold shadow-lg transition-opacity disabled:opacity-50"
              >
                {selecting ? 'Sending...' : 'Send Mail'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterScores;
