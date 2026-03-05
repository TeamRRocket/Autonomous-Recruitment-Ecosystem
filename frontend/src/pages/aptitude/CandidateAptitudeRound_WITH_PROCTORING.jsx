/**
 * INTEGRATION EXAMPLE: Aptitude Round with Proctoring
 * 
 * This example shows how to integrate proctoring into CandidateAptitudeRound.jsx
 * 
 * FLOW:
 * 1. User clicks "Start Round" button
 * 2. Consent modal appears
 * 3. If user accepts → Request camera permission
 * 4. If permission granted → Start exam + proctoring
 * 5. If permission denied → Block exam, show error
 * 6. Camera stays on for entire exam duration
 * 7. Camera turns off only after exam completion
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { startAptitudeRound, submitAptitudeRound } from '../../services/aptitudeService';
import { getRounds } from '../../services/roundService';
import useProctoring from '../../hooks/useProctoring';
import ProctoringConsent from '../../components/proctoring/ProctoringConsent';
import RecordingIndicator from '../../components/proctoring/RecordingIndicator';
import proctoringService from '../../services/proctoringService';

const pad2 = (n) => n.toString().padStart(2, '0');

const CandidateAptitudeRound = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();

    // Existing state
    const [loading, setLoading] = useState(false);
    const [attemptId, setAttemptId] = useState(null);
    const [endsAt, setEndsAt] = useState(null);
    const [durationMinutes, setDurationMinutes] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [selectedByQuestion, setSelectedByQuestion] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [nowTick, setNowTick] = useState(Date.now());
    const [autoSubmitted, setAutoSubmitted] = useState(false);
    const [redirected, setRedirected] = useState(false);

    // NEW: Proctoring state
    const [showConsent, setShowConsent] = useState(true);
    const [consentGiven, setConsentGiven] = useState(false);
    const [proctoringSessionId, setProctoringSessionId] = useState(null);
    const [examStarted, setExamStarted] = useState(false);

    // NEW: Proctoring hook
    const {
        isProctoring,
        hasWebcamPermission,
        error: proctoringError,
        startProctoring,
        stopProctoring
    } = useProctoring(proctoringSessionId, examStarted);

    const timeLeftMs = useMemo(() => {
        if (!endsAt) return 0;
        const end = new Date(endsAt).getTime();
        return Math.max(0, end - nowTick);
    }, [endsAt, nowTick]);

    const timeLeftLabel = useMemo(() => {
        const totalSeconds = Math.floor(timeLeftMs / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
    }, [timeLeftMs]);

    // NEW: Handle consent acceptance
    const handleConsentAccept = async () => {
        setShowConsent(false);
        setConsentGiven(true);

        // Start the exam round
        await startExamRound();
    };

    // NEW: Handle consent decline
    const handleConsentDecline = () => {
        toast.error('Camera permission is required to take the exam');
        navigate('/applications');
    };

    // NEW: Start exam round (only called after consent)
    const startExamRound = async () => {
        setLoading(true);
        try {
            // 1. Start the aptitude round (backend creates attempt)
            const res = await startAptitudeRound(jobId);
            setAttemptId(res.data.attemptId);
            setDurationMinutes(res.data.durationMinutes);
            setEndsAt(res.data.endsAt);
            setQuestions(res.data.questions || []);

            // 2. Start proctoring session
            const session = await proctoringService.startSession(
                jobId,
                'APTITUDE',
                res.data.attemptId
            );
            setProctoringSessionId(session.id);

            // 3. Request camera permission and start proctoring
            const started = await startProctoring();

            if (!started) {
                // Camera permission denied - block exam
                toast.error('Camera permission is required. Please enable camera access and try again.');
                navigate('/applications');
                return;
            }

            // 4. Mark exam as started (enables proctoring hook)
            setExamStarted(true);
            toast.success('Exam started. Your session is being proctored.');

        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to start Aptitude round');
            navigate('/applications');
        } finally {
            setLoading(false);
        }
    };

    // Redirect after exam completion
    useEffect(() => {
        if (!result) return;
        if (redirected) return;
        setRedirected(true);

        // NEW: End proctoring session
        const endProctoringAndRedirect = async () => {
            if (proctoringSessionId) {
                try {
                    await proctoringService.endSession(proctoringSessionId);
                    stopProctoring(); // Turn off camera
                    console.log('✓ Proctoring session ended');
                } catch (err) {
                    console.error('Failed to end proctoring session:', err);
                }
            }

            if (!jobId) {
                navigate('/applications', { replace: true });
                return;
            }

            try {
                const r = await getRounds(jobId);
                const rounds = Array.isArray(r?.data) ? r.data : [];
                const hasCoding = rounds.some((x) => String(x?.round_type || '').toUpperCase() === 'CODING');
                if (hasCoding) {
                    navigate(`/dsa/round/${jobId}`, { replace: true });
                    return;
                }
            } catch {
                // if rounds api fails, fallback to applications
            }

            navigate('/applications', { replace: true });
        };

        endProctoringAndRedirect();
    }, [result, redirected, navigate, jobId, proctoringSessionId, stopProctoring]);

    // Fullscreen attempt
    useEffect(() => {
        if (!examStarted) return;

        // Fullscreen removed - can only be triggered by user gesture, not automatically
    }, [examStarted]);

    // Block back navigation
    useEffect(() => {
        if (!attemptId) return;
        if (result) return;

        const onPop = () => {
            try {
                window.history.pushState(null, '', window.location.href);
            } catch {
                // ignore
            }
        };

        try {
            window.history.pushState(null, '', window.location.href);
        } catch {
            // ignore
        }
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, [attemptId, result]);

    // Timer tick
    useEffect(() => {
        if (!endsAt) return;

        const t = setInterval(() => {
            setNowTick(Date.now());
        }, 1000);

        return () => clearInterval(t);
    }, [endsAt]);

    // Auto-submit when timer expires
    useEffect(() => {
        if (!attemptId) return;
        if (!endsAt) return;
        if (result) return;
        if (autoSubmitted) return;

        const end = new Date(endsAt).getTime();
        if (Date.now() <= end) return;

        setAutoSubmitted(true);

        const auto = async () => {
            try {
                setSubmitting(true);
                const answers = Object.entries(selectedByQuestion).map(([questionId, selected]) => ({ questionId, selected }));
                const res = await submitAptitudeRound({ attemptId, answers });
                setResult(res.data);
                toast.success('Aptitude round submitted (time expired)');
            } catch (err) {
                toast.error(err.response?.data?.message || 'Auto-submit failed');
            } finally {
                setSubmitting(false);
            }
        };

        auto();
    }, [attemptId, endsAt, result, nowTick, autoSubmitted, selectedByQuestion]);

    // Auto-submit on tab switch or blur (REMOVED - proctoring handles this now)
    // The proctoring hook already detects these events and logs them
    // We don't want to auto-submit anymore, just record the violation

    const onSelect = (questionId, letter) => {
        setSelectedByQuestion((prev) => ({ ...prev, [questionId]: letter }));
    };

    const onSubmit = async () => {
        if (!attemptId) return;

        setSubmitting(true);
        try {
            const answers = Object.entries(selectedByQuestion).map(([questionId, selected]) => ({ questionId, selected }));
            const res = await submitAptitudeRound({ attemptId, answers });
            setResult(res.data);
            toast.success('Aptitude round submitted');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit Aptitude round');
        } finally {
            setSubmitting(false);
        }
    };

    // NEW: Show consent modal first
    if (showConsent) {
        return (
            <ProctoringConsent
                onAccept={handleConsentAccept}
                onDecline={handleConsentDecline}
            />
        );
    }

    // Show loading while starting exam
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <p className="text-slate-300">Starting exam and initializing proctoring...</p>
                </div>
            </div>
        );
    }

    // Show error if camera permission denied
    if (proctoringError) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="bg-red-900/20 border border-red-500 rounded-xl p-6 max-w-md">
                    <h2 className="text-xl font-bold text-red-400 mb-2">Camera Access Required</h2>
                    <p className="text-slate-300 mb-4">{proctoringError}</p>
                    <button
                        onClick={() => navigate('/applications')}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
                    >
                        Return to Applications
                    </button>
                </div>
            </div>
        );
    }

    if (!attemptId) {
        return (
            <div className="p-8 max-w-3xl mx-auto">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <p className="text-slate-300">Unable to start aptitude round.</p>
                </div>
            </div>
        );
    }

    const ended = timeLeftMs <= 0;
    const readOnly = !!result || ended;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            {/* NEW: Recording indicator */}
            {isProctoring && <RecordingIndicator />}

            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Aptitude Round</h1>
                        <p className="text-sm text-slate-400">Attempt: {attemptId}</p>
                        {durationMinutes != null && <p className="text-sm text-slate-400">Duration: {durationMinutes} minutes</p>}
                        {/* NEW: Proctoring status */}
                        {isProctoring && (
                            <p className="text-xs text-green-400 mt-1">
                                ● Proctoring Active
                            </p>
                        )}
                    </div>

                    <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase tracking-widest">Time Left</p>
                        <p className={`text-xl font-semibold ${ended ? 'text-red-400' : 'text-emerald-400'}`}>{timeLeftLabel}</p>
                    </div>
                </div>

                {result && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <p className="text-slate-300">
                            Status: <span className="text-white font-semibold">{result.status}</span>
                        </p>
                        <p className="text-slate-300">
                            Score: <span className="text-white font-semibold">{result.score}</span>
                        </p>
                    </div>
                )}

                <div className="space-y-4">
                    {questions.map((q, idx) => {
                        const selected = selectedByQuestion[q.id];
                        const labels = ['A', 'B', 'C', 'D'];

                        return (
                            <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                                <div className="flex items-start gap-3">
                                    <div className="text-slate-500 font-semibold">{idx + 1}.</div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium">{q.question}</p>

                                        <div className="mt-4 grid gap-2">
                                            {q.options.map((opt, i) => {
                                                const letter = labels[i];
                                                const active = selected === letter;

                                                return (
                                                    <button
                                                        key={letter}
                                                        type="button"
                                                        disabled={readOnly}
                                                        onClick={() => onSelect(q.id, letter)}
                                                        className={`text-left px-4 py-3 rounded-lg border transition-colors ${active
                                                                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                                                                : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700'
                                                            } ${readOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    >
                                                        <span className="font-semibold mr-3 text-slate-400">{letter}</span>
                                                        {opt}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center justify-between">
                    <button
                        disabled={submitting || readOnly}
                        onClick={onSubmit}
                        className={`px-5 py-2 rounded-lg font-semibold ${submitting || readOnly
                                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                    >
                        {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CandidateAptitudeRound;
