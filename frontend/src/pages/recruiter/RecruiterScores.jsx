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
          return first.round_type;
        })();
        setFirstRound(firstLabel);

        // Backend selection + applications.next_round only supports APTITUDE/DSA
        let next = '';
        if (normalized.some((r) => r.round_type === 'MCQ')) next = 'APTITUDE';
        else if (normalized.some((r) => r.round_type === 'CODING')) next = 'DSA';
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
      toast.error('This job must include APTITUDE or DSA rounds to proceed');
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Recruiter</p>
          <h1 className="text-3xl font-bold text-white mt-2">Candidate Scores</h1>
          <p className="text-slate-400 mt-2">View round-wise scores as candidates submit assessments.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <select
            className="bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
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
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg transition disabled:opacity-50"
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
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg transition disabled:opacity-50"
          >
            {selecting ? 'Sending...' : 'Select'}
          </button>
        </div>
      </div>

      {loadingScores && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-slate-400">Loading scores...</div>
      )}

      {!loadingScores && selectedJobId && candidates.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-slate-400">No candidates found for this job yet.</div>
      )}

      {!loadingScores && candidates.length > 0 && (
        <div className="space-y-3">
          {displayCandidates.map((row) => (
            <div key={row.candidate.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-white font-semibold text-lg">{row.candidate.name}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">{row.application.status}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2">
                    <p className="text-xs text-slate-500">Resume</p>
                    <p className="text-white font-semibold">{row.scores.resume.score ?? '--'}</p>
                  </div>
                  <div className="bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2">
                    <p className="text-xs text-slate-500">Aptitude</p>
                    <p className="text-white font-semibold">
                      {row.scores.aptitude.correct != null && row.scores.aptitude.total != null
                        ? `${row.scores.aptitude.correct}/${row.scores.aptitude.total}`
                        : (row.scores.aptitude.score ?? '--')}
                      {row.scores.aptitude.percent != null ? ` (${row.scores.aptitude.percent}%)` : ''}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{row.scores.aptitude.status}</p>
                  </div>
                  <div className="bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2">
                    <p className="text-xs text-slate-500">DSA</p>
                    <p className="text-white font-semibold">{row.scores.dsa.score ?? '--'}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{row.scores.dsa.status}</p>
                  </div>
                  <div className="bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2">
                    <p className="text-xs text-slate-500">Coding</p>
                    <p className="text-white font-semibold">
                      {row.scores.coding.avg_score_percent ?? '--'}
                      {row.scores.coding.avg_score_percent != null ? '%' : ''}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{(row.scores.coding.rounds || []).length} rounds</p>
                  </div>
                </div>
              </div>

              {/* Proctoring Summary */}
              {row.proctoring && row.proctoring.sessions.length > 0 && (
                <div className="mt-4 border-t border-slate-800 pt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 uppercase tracking-widest">Proctoring Summary</span>
                      {row.proctoring.overall_risk_level && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${row.proctoring.overall_risk_level === 'Low'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : row.proctoring.overall_risk_level === 'Medium'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : row.proctoring.overall_risk_level === 'High'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                            }`}
                        >
                          {row.proctoring.overall_risk_level} Risk
                        </span>
                      )}
                      {row.proctoring.overall_risk_score != null && (
                        <span className="text-xs text-slate-400">
                          Score: <span className="text-white font-semibold">{row.proctoring.overall_risk_score}/100</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Overall reason from LLM */}
                  {row.proctoring.overall_reason && (
                    <p className="text-xs text-slate-300 mb-3 bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 leading-relaxed">
                      {row.proctoring.overall_reason}
                    </p>
                  )}

                  {/* Per-session breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {row.proctoring.sessions.map((session) => {
                      const hasEvents = session.total_no_face > 0 || session.total_multiple_face > 0 || session.total_looking_away > 0 || session.total_tab_switch > 0 || session.total_window_blur > 0 || session.total_copy_paste > 0 || session.total_phone_detected > 0;
                      const cheatingDetected = session.risk_level === 'High' || session.total_phone_detected > 0 || session.total_multiple_face > 2;

                      return (
                        <div key={session.session_id} className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-300 uppercase">{session.round_type} Round</span>
                            <div className="flex items-center gap-2">
                              {cheatingDetected ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                  ⚠ Suspicious
                                </span>
                              ) : hasEvents ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                  Minor Issues
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  ✓ Clean
                                </span>
                              )}
                              {session.risk_score != null && (
                                <span className="text-[10px] text-slate-500">{session.risk_score}/100</span>
                              )}
                            </div>
                          </div>

                          {hasEvents && (
                            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                              {session.total_no_face > 0 && (
                                <div className="flex justify-between text-slate-400">
                                  <span>No Face</span>
                                  <span className="text-white font-medium">{session.total_no_face}</span>
                                </div>
                              )}
                              {session.total_multiple_face > 0 && (
                                <div className="flex justify-between text-slate-400">
                                  <span>Multiple Faces</span>
                                  <span className="text-red-400 font-medium">{session.total_multiple_face}</span>
                                </div>
                              )}
                              {session.total_looking_away > 0 && (
                                <div className="flex justify-between text-slate-400">
                                  <span>Looking Away</span>
                                  <span className="text-white font-medium">{session.total_looking_away}</span>
                                </div>
                              )}
                              {session.total_tab_switch > 0 && (
                                <div className="flex justify-between text-slate-400">
                                  <span>Tab Switches</span>
                                  <span className="text-amber-400 font-medium">{session.total_tab_switch}</span>
                                </div>
                              )}
                              {session.total_phone_detected > 0 && (
                                <div className="flex justify-between text-slate-400">
                                  <span>Phone Detected</span>
                                  <span className="text-red-400 font-medium">{session.total_phone_detected}</span>
                                </div>
                              )}
                              {session.total_copy_paste > 0 && (
                                <div className="flex justify-between text-slate-400">
                                  <span>Copy/Paste</span>
                                  <span className="text-amber-400 font-medium">{session.total_copy_paste}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {!hasEvents && (
                            <p className="text-[11px] text-slate-500">No suspicious activity detected</p>
                          )}

                          {session.llm_reason && (
                            <p className="text-[10px] text-slate-400 mt-2 italic leading-relaxed">{session.llm_reason}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No Proctoring Data */}
              {(!row.proctoring || row.proctoring.sessions.length === 0) && (
                <div className="mt-4 border-t border-slate-800 pt-3">
                  <span className="text-xs text-slate-600 uppercase tracking-widest">Proctoring: No data yet</span>
                </div>
              )}

              {insightsByCandidateId.has(row.candidate.id) && (
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">
                    Rank:{' '}
                    <span className="text-white font-semibold">
                      {insightsByCandidateId.get(row.candidate.id)?.rank ?? '--'}
                    </span>
                    <span className="mx-2 text-slate-600">|</span>
                    Total Score:{' '}
                    <span className="text-white font-semibold">
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
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
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
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Candidate Insights</p>
                <h3 className="text-xl font-semibold text-white mt-2">
                  {selectedInsight.candidate_name || 'Candidate'}
                </h3>
              </div>

              <button
                onClick={closeInsights}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2">
                <p className="text-xs text-slate-500">Rank</p>
                <p className="text-white font-semibold">{selectedInsight.rank ?? '--'}</p>
              </div>
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2">
                <p className="text-xs text-slate-500">Total Score</p>
                <p className="text-white font-semibold">
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
                <p className="text-xs text-slate-500 uppercase tracking-widest">Summary</p>
                <p className="text-slate-200 mt-2 text-sm leading-relaxed">
                  {selectedInsight.resume_summary || selectedInsight.summary}
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest">Strengths</p>
                <div className="mt-2 space-y-2">
                  {(selectedInsight.strengths || []).length > 0 ? (
                    (selectedInsight.strengths || []).map((s, i) => (
                      <p key={i} className="text-sm text-slate-200">{s}</p>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">No strengths noted yet.</p>
                  )}
                </div>
              </div>

              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
                {isSelectionLocked && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-300">
                    Selection is locked until: <span className="text-white font-semibold">{new Date(selectionLockUntil).toLocaleString()}</span>
                  </div>
                )}
                <p className="text-xs text-slate-500 uppercase tracking-widest">Gaps</p>
                <div className="mt-2 space-y-2">
                  {(selectedInsight.gaps || []).length > 0 ? (
                    (selectedInsight.gaps || []).map((g, i) => (
                      <p key={i} className="text-sm text-slate-200">{g}</p>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">No gaps noted yet.</p>
                  )}
                </div>
              </div>
            </div>

            {selectedInsight.resume_score_breakdown && (
              <div className="mt-4 bg-slate-950/50 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest">Score Breakdown</p>
                <pre className="mt-2 text-xs text-slate-200 overflow-auto whitespace-pre-wrap">
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
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Selection</p>
                <h3 className="text-xl font-semibold text-white mt-2">Send Interview Details</h3>
              </div>

              <button
                onClick={closeSelect}
                disabled={selecting}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest">Top N candidates</p>
                <input
                  type="number"
                  min="1"
                  value={topN}
                  onChange={(e) => setTopN(e.target.value)}
                  className="mt-2 w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  placeholder="e.g. 50"
                />
              </div>

              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest">First round</p>
                <div className="mt-2 w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-white">
                  {loadingFirstRound ? 'Loading...' : (firstRound || '--')}
                </div>
                {!loadingFirstRound && !selectableNextRound && (
                  <p className="text-[11px] text-slate-500 mt-2">Add an APTITUDE or DSA round in this job to enable selection emails.</p>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest">Interview date + day</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                  <div className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-slate-200">
                    {interviewDay || '--'}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest">Time interval</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <input
                    type="text"
                    value={timeFrom}
                    onChange={(e) => setTimeFrom(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    placeholder="05:00 PM"
                  />
                  <input
                    type="text"
                    value={timeTo}
                    onChange={(e) => setTimeTo(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    placeholder="07:00 PM"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <p className="text-[11px] text-slate-500">Start time</p>
                  <p className="text-[11px] text-slate-500">End time</p>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Format: hh:mm AM/PM (example: 05:00 PM)</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={handleSendSelection}
                disabled={selecting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg transition disabled:opacity-50"
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
