import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getJobOverview, getMyJobs } from '../../services/jobService';
import { getJobScores } from '../../services/jobScoresService';
import { rankCandidates, selectTopCandidates } from '../../services/recruiter.api';
import { getRounds } from '../../services/roundService';
import { Eye, BarChart3, Trophy, Users } from 'lucide-react';

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

    const openInsights = (insight, row) => {
        // Merge proctoring data from scores if available
        const scoresCandidate = scores?.candidates?.find(c => c.candidate.id === row.candidate.id);
        const proctoringData = scoresCandidate?.proctoring || null;
        
        setSelectedInsight({ 
            ...insight, 
            candidateData: row.candidate, 
            applicationData: row.application,
            proctoring: proctoringData
        });
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

    // Helper for score coloring
    const getScoreColor = (score) => {
        if (score === null || score === undefined || score === 'N/A') return 'text-muted-foreground';
        const num = parseFloat(score);
        if (isNaN(num)) return 'text-muted-foreground';
        if (num >= 80) return 'text-emerald-500 font-bold';
        if (num >= 60) return 'text-yellow-500 font-bold';
        return 'text-red-500 font-bold';
    };

    return (
        <div className="space-y-6 animate-fade-in p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                   
                    <h1 className="text-2xl font-bold text-white font-heading">Candidate Scores</h1>
                     <p className="text-muted-foreground mt-1 text-sm">View round-wise scores as candidates submit assessments.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                   
                    <div className="flex items-center gap-3">
                        <select
                            className="bg-secondary/10 border border-border/20 text-foreground rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 min-w-[200px]"
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
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/10 hover:bg-secondary/20 border border-border/20 text-foreground font-medium text-sm transition-all"
                        >
                            <BarChart3 size={16} />
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
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-sm shadow-lg shadow-primary/20 transition-all"
                        >
                            <Trophy size={16} />
                            {selecting ? 'Sending...' : 'Select Top Candidates'}
                        </button>
                    </div>
                </div>
            </div>

            {loadingScores && (
                <div className="flex items-center justify-center py-20">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}

            {!loadingScores && selectedJobId && candidates.length === 0 && (
                <div className="rounded-xl border border-border/20 bg-secondary/5 p-12 text-center">
                    <Users size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">No candidates found for this job yet.</p>
                </div>
            )}

            {!loadingScores && selectedJobId && !selectedJobId && (
                 <div className="rounded-xl border border-border/20 bg-secondary/5 p-12 text-center">
                    <p className="text-muted-foreground">Please select a job to view scores.</p>
                </div>
            )}


            {!loadingScores && candidates.length > 0 && (
                <div className="rounded-xl border border-border/20 bg-secondary/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border/20 bg-white/5">
                                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground w-16">Rank</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground">Candidate</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground">Resume</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground">Aptitude</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground">DSA</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground">Technical</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground">Overall</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/10">
                                {displayCandidates.map((row, index) => {
                                    const rank = insightsByCandidateId.get(row.candidate.id)?.rank;
                                    const displayRank = Number.isFinite(rank) ? `#${rank}` : `#${index + 1}`;
                                    
                                    const resumeScore = row.scores.resume.score;
                                    const aptitudeScore = row.scores.aptitude.score ?? (row.scores.aptitude.correct != null ? Math.round((row.scores.aptitude.correct / row.scores.aptitude.total) * 100) : 'N/A');
                                    const dsaScore = row.scores.dsa.score ?? 'N/A';
                                    const technicalScore = row.scores.technical.score ?? 'N/A';
                                    
                                    const overallScore = row.scores?.total_score ?? 'N/A';

                                    return (
                                        <tr key={row.candidate.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 text-sm text-muted-foreground font-medium">
                                                {displayRank}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-white">{row.candidate.name}</span>
                                                    <span className="text-xs text-muted-foreground">{row.application.status}</span>
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 text-sm ${getScoreColor(resumeScore)}`}>
                                                {resumeScore ?? 'N/A'}
                                            </td>
                                            <td className={`px-6 py-4 text-sm ${getScoreColor(aptitudeScore)}`}>
                                                {aptitudeScore}
                                            </td>
                                            <td className={`px-6 py-4 text-sm ${getScoreColor(dsaScore)}`}>
                                                {dsaScore}
                                            </td>
                                            <td className={`px-6 py-4 text-sm ${getScoreColor(technicalScore)}`}>
                                                {technicalScore}
                                            </td>
                                            <td className={`px-6 py-4 text-sm ${getScoreColor(overallScore)}`}>
                                                 {typeof overallScore === 'number' ? overallScore.toFixed(0) : overallScore}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => openInsights(insightsByCandidateId.get(row.candidate.id), row)}
                                                    disabled={!insightsByCandidateId.has(row.candidate.id)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/20 hover:bg-secondary/40 text-xs font-medium text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Eye size={14} />
                                                    Insights
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Selection Modal */}
            {selectOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-lg bg-background border border-border rounded-2xl shadow-2xl p-6">
                        <h3 className="text-xl font-bold text-foreground font-heading mb-1">Select Top Candidates</h3>
                        <p className="text-sm text-muted-foreground mb-6">Configure interview details for the next round</p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Top N Candidates</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={topN}
                                    onChange={(e) => setTopN(e.target.value)}
                                    className="w-full bg-secondary/10 border border-border/20 rounded-lg px-3 py-2 text-foreground focus:ring-1 focus:ring-primary/50 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Interview Date</label>
                                    <input
                                        type="date"
                                        value={interviewDate}
                                        onChange={(e) => setInterviewDate(e.target.value)}
                                        className="w-full bg-secondary/10 border border-border/20 rounded-lg px-3 py-2 text-foreground focus:ring-1 focus:ring-primary/50 outline-none"
                                    />
                                    {interviewDay && <p className="text-xs text-primary mt-1">{interviewDay}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Next Round</label>
                                    <div className="w-full bg-secondary/10 border border-border/20 rounded-lg px-3 py-2 text-foreground opacity-70">
                                        {selectableNextRound || 'None'}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Start Time</label>
                                    <input
                                        type="text"
                                        placeholder="09:00 AM"
                                        value={timeFrom}
                                        onChange={(e) => setTimeFrom(e.target.value)}
                                        className="w-full bg-secondary/10 border border-border/20 rounded-lg px-3 py-2 text-foreground focus:ring-1 focus:ring-primary/50 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">End Time</label>
                                    <input
                                        type="text"
                                        placeholder="05:00 PM"
                                        value={timeTo}
                                        onChange={(e) => setTimeTo(e.target.value)}
                                        className="w-full bg-secondary/10 border border-border/20 rounded-lg px-3 py-2 text-foreground focus:ring-1 focus:ring-primary/50 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                             <button
                                onClick={closeSelect}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendSelection}
                                disabled={selecting}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/25 transition-colors"
                            >
                                {selecting ? 'Sending...' : 'Confirm & Send'}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Insights Modal */}
            {insightsOpen && selectedInsight && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in pb-10">
                    <div className="relative w-full max-w-4xl bg-[#121212] border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto font-sans">
                        
                        {/* Sticky Header / Close */}
                        <div className="sticky top-0 z-10 flex justify-end p-4">
                            <button
                                onClick={closeInsights}
                                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold transition border border-white/10"
                            >
                                Close
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-8 pb-8 -mt-4">
                            {/* Top Score Circular badge */}
                            <div className="flex flex-col items-center mb-8">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-3 ${
                                    Number(selectedInsight.total_score ?? selectedInsight.resume_score ?? 0) >= 70 ? 'bg-green-500/20 text-green-500' : 
                                    Number(selectedInsight.total_score ?? selectedInsight.resume_score ?? 0) >= 50 ? 'bg-yellow-500/20 text-yellow-500' : 
                                    'bg-red-500/20 text-red-500'
                                }`}>
                                    {Number(selectedInsight.total_score ?? selectedInsight.resume_score ?? 0).toFixed(0)}
                                </div>
                                <h2 className="text-xl font-bold text-white mb-1">Overall Match Score</h2>
                                <p className="text-sm text-zinc-400">Based on skills, experience, and requirements</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 mb-8">
                                {/* Left: Key Skills */}
                                <div>
                                    <h3 className="text-sm font-bold text-white mb-3">Key Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {(selectedInsight.resume_score_breakdown?.skills || selectedInsight.candidateData?.primary_skills || []).length > 0 ? (
                                            (selectedInsight.resume_score_breakdown?.skills || selectedInsight.candidateData?.primary_skills).slice(0, 15).map((s, i) => (
                                                <span key={i} className="px-3 py-1 bg-white/10 hover:bg-white/20 transition-colors text-zinc-300 rounded-full text-xs font-medium cursor-default">{s}</span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-zinc-500">Not specified</span>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Experience & Education */}
                                <div>
                                    <h3 className="text-sm font-bold text-white mb-3">Experience & Education</h3>
                                    <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                                        <strong className="text-zinc-300">Experience:</strong> {selectedInsight.resume_score_breakdown?.professional_summary || selectedInsight.resume_summary || selectedInsight.summary || 'Experience details evaluated from resume.'}
                                    </p>
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        <strong className="text-zinc-300">Education:</strong> {(selectedInsight.resume_score_breakdown?.education || []).length > 0 ? selectedInsight.resume_score_breakdown.education.join(' • ') : 'Education details evaluated from resume.'}
                                    </p>
                                </div>
                            </div>

                            {/* Strengths */}
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <h3 className="text-sm font-bold text-white">Strengths</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-zinc-300">
                                    {(selectedInsight.strengths || []).length > 0 ? (
                                        (selectedInsight.strengths || []).map((s, i) => (
                                            <li key={i} className="flex gap-3 items-start">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div> 
                                                <span className="leading-relaxed">{s}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <p className="text-xs text-zinc-500 italic">No notable strengths identified matching the specific job requirements.</p>
                                    )}
                                </ul>
                            </div>

                            {/* Areas of Concern */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-3">
                                    <h3 className="text-sm font-bold text-white">Areas of Concern</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-zinc-300">
                                    {(selectedInsight.gaps || []).length > 0 ? (
                                        (selectedInsight.gaps || []).map((g, i) => (
                                            <li key={i} className="flex gap-3 items-start">
                                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 shrink-0"></div> 
                                                <span className="leading-relaxed">{g}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <p className="text-xs text-zinc-500 italic">No significant gaps or concerns identified.</p>
                                    )}
                                </ul>
                            </div>

                            {/* Score Breakdown Matches (Progress bars) */}
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-sm font-bold text-white mb-3">Relevance Matches</h3>
                                    <div className="space-y-3">
                                        {[
                                            { title: 'Skill Match', score: selectedInsight.resume_score_breakdown?.matching_scores?.skill_match_score || 0 },
                                            { title: 'Experience Relevance', score: selectedInsight.resume_score_breakdown?.matching_scores?.experience_relevance_score || 0 },
                                            { title: 'Education Relevance', score: selectedInsight.resume_score_breakdown?.matching_scores?.education_relevance_score || 0 }
                                        ].filter(pm => pm.score > 0).map((pm, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                                                <span className="text-sm text-zinc-300 font-medium">{pm.title}</span>
                                                <span className="text-xs font-bold px-3 py-1 bg-white/10 rounded-full text-white">{pm.score}% match</span>
                                            </div>
                                        ))}
                                        
                                        {!selectedInsight.resume_score_breakdown?.matching_scores && (
                                            <div className="text-xs text-zinc-500 italic p-3 bg-white/5 rounded-lg border border-white/5">Detailed match breakdowns are currently unavailable.</div>
                                        )}
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-bold text-white mb-3">Career History</h3>
                                    <div className="space-y-3">
                                        {(selectedInsight.resume_score_breakdown?.previous_companies || []).length > 0 ? (
                                            selectedInsight.resume_score_breakdown.previous_companies.slice(0, 5).map((comp, i) => (
                                                <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                    <span className="text-sm text-zinc-300 font-medium">{comp}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-xs text-zinc-500 italic p-3 bg-white/5 rounded-lg border border-white/5">No distinct company history extracted.</div>
                                        )}
                                    </div>
                                </div>

                                {/* Proctoring Insights */}
                                {selectedInsight.proctoring && (
                                    <div>
                                        <h3 className="text-sm font-bold text-white mb-4">Proctoring & Integrity</h3>
                                        {selectedInsight.proctoring.overall_risk_score !== null ? (
                                            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
                                                {/* Background glow based on risk level */}
                                                <div className={`absolute inset-0 opacity-10 ${
                                                    selectedInsight.proctoring.overall_risk_level === 'LOW' ? 'bg-emerald-500' :
                                                    selectedInsight.proctoring.overall_risk_level === 'MEDIUM' ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                                }`}></div>
                                                
                                                <div className="relative p-6">
                                                    {/* Header with risk badge */}
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                                selectedInsight.proctoring.overall_risk_level === 'LOW' ? 'bg-emerald-500/20' :
                                                                selectedInsight.proctoring.overall_risk_level === 'MEDIUM' ? 'bg-yellow-500/20' :
                                                                'bg-red-500/20'
                                                            }`}>
                                                                <svg className={`w-5 h-5 ${
                                                                    selectedInsight.proctoring.overall_risk_level === 'LOW' ? 'text-emerald-400' :
                                                                    selectedInsight.proctoring.overall_risk_level === 'MEDIUM' ? 'text-yellow-400' :
                                                                    'text-red-400'
                                                                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Integrity Score</p>
                                                                <p className="text-sm font-semibold text-white">Proctoring Assessment</p>
                                                            </div>
                                                        </div>
                                                        <div className={`px-4 py-2 rounded-full text-sm font-bold border ${
                                                            selectedInsight.proctoring.overall_risk_level === 'LOW' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                                            selectedInsight.proctoring.overall_risk_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                                            'bg-red-500/20 text-red-400 border-red-500/30'
                                                        }`}>
                                                            {selectedInsight.proctoring.overall_risk_level || 'UNKNOWN'}
                                                        </div>
                                                    </div>

                                                    {/* Large score display */}
                                                    <div className="flex items-baseline gap-2 mb-4">
                                                        <span className={`text-5xl font-bold ${
                                                            selectedInsight.proctoring.overall_risk_level === 'LOW' ? 'text-emerald-400' :
                                                            selectedInsight.proctoring.overall_risk_level === 'MEDIUM' ? 'text-yellow-400' :
                                                            'text-red-400'
                                                        }`}>
                                                            {selectedInsight.proctoring.overall_risk_score}
                                                        </span>
                                                        <span className="text-xl text-zinc-400">/100</span>
                                                    </div>

                                                    {/* Progress bar */}
                                                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-500 ${
                                                                selectedInsight.proctoring.overall_risk_level === 'LOW' ? 'bg-emerald-500' :
                                                                selectedInsight.proctoring.overall_risk_level === 'MEDIUM' ? 'bg-yellow-500' :
                                                                'bg-red-500'
                                                            }`}
                                                            style={{ width: `${100 - selectedInsight.proctoring.overall_risk_score}%` }}
                                                        ></div>
                                                    </div>

                                                    {/* Reason text */}
                                                    {selectedInsight.proctoring.overall_reason && (
                                                        <div className="mt-4 p-4 bg-black/30 rounded-xl border border-white/5">
                                                            <p className="text-xs text-zinc-400 leading-relaxed">
                                                                {selectedInsight.proctoring.overall_reason}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-6 rounded-2xl border border-dashed border-white/10 bg-white/5">
                                                <div className="flex items-center gap-3 text-zinc-500">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <p className="text-sm">Proctoring assessment pending...</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecruiterScores;
