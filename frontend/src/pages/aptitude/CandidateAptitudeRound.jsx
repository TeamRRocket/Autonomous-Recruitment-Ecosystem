// Refactored CandidateAptitudeRound.jsx to match Reference UI
// Key Changes: Sidebar Navigation, Single Question View, Fixed Timer, Clean Dark UI

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { startAptitudeRound, submitAptitudeRound } from '../../services/aptitudeService';
import { getRounds } from '../../services/roundService';
import { getNextRoundAfter, getNavigatePathForRound } from '../../utils/candidateRoundNavigation';
import useProctoring from '../../hooks/useProctoring';
import ProctoringConsent from '../../components/proctoring/ProctoringConsent';
import RecordingIndicator from '../../components/proctoring/RecordingIndicator';
import proctoringService from '../../services/proctoringService';

const pad2 = (n) => n.toString().padStart(2, '0');

const CandidateAptitudeRound = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();

    // --- State ---
    const [loading, setLoading] = useState(false);
    const [attemptId, setAttemptId] = useState(null);
    const [endsAt, setEndsAt] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [selectedByQuestion, setSelectedByQuestion] = useState({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [nowTick, setNowTick] = useState(Date.now());
    const [autoSubmitted, setAutoSubmitted] = useState(false);
    const [redirected, setRedirected] = useState(false);

    // --- Proctoring State ---
    const alreadyConsented = sessionStorage.getItem('proctoring_consent') === 'true';
    const [showConsent, setShowConsent] = useState(!alreadyConsented);
    const [consentGiven, setConsentGiven] = useState(alreadyConsented);
    const [proctoringSessionId, setProctoringSessionId] = useState(null);
    const [examStarted, setExamStarted] = useState(false);
    const tabAutoSubmitDoneRef = useRef(false);

    const {
        isProctoring,
        error: proctoringError,
        startProctoring,
        stopProctoring
    } = useProctoring(proctoringSessionId, examStarted);

    // --- Computed ---
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

    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const isFirstQuestion = currentQuestionIndex === 0;

    // --- Handlers ---
    const handleConsentAccept = async () => {
        setShowConsent(false);
        setConsentGiven(true);
        sessionStorage.setItem('proctoring_consent', 'true');
    };

    const handleConsentDecline = () => {
        toast.error('Camera permission is required to take the exam');
        navigate('/applications');
    };

    const startExamRound = async () => {
        setLoading(true);
        try {
            // 1. Start Aptitude Round
            const res = await startAptitudeRound(jobId);
            setAttemptId(res.data.attemptId);
            setEndsAt(res.data.endsAt);
            setQuestions(res.data.questions || []);

            // 2. Start Proctoring Session - check for existing session
            const existingSessionId = sessionStorage.getItem('proctoring_session_id');
            const session = await proctoringService.startSession(jobId, 'APTITUDE', res.data.attemptId, existingSessionId);
            const sessionId = session.id;
            sessionStorage.setItem('proctoring_session_id', sessionId);
            
            setProctoringSessionId(sessionId);
            setExamStarted(true);

            // 3. Request Permission
            const started = await startProctoring(sessionId);
            if (!started) {
                toast.error('Camera permission is required. Please enable camera access.');
                navigate('/applications');
                return;
            }
            toast.success('Exam started. Good luck!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to start Aptitude round');
            navigate('/applications');
        } finally {
            setLoading(false);
        }
    };

    const submitExam = async (isAuto = false) => {
        if (!attemptId || submitting || result) return;

        setSubmitting(true);
        try {
            const answers = Object.entries(selectedByQuestion).map(([questionId, selected]) => ({ questionId, selected }));
            const res = await submitAptitudeRound({ attemptId, answers });
            setResult(res.data);
            if (isAuto) {
                toast('Time expired! Exam auto-submitted.', { icon: '⏰' });
            } else {
                toast.success('Exam submitted successfully!');
            }
        } catch (err) {
            toast.error('Failed to submit exam. Please try again.');
            setSubmitting(false); // Only reset if manual submit failed
        }
    };

    // --- Effects ---
    useEffect(() => {
        if (consentGiven && !attemptId) startExamRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [consentGiven, attemptId]);

    // Timer Tick
    useEffect(() => {
        if (!endsAt) return;
        const t = setInterval(() => setNowTick(Date.now()), 1000);
        return () => clearInterval(t);
    }, [endsAt]);

    // Auto Submit on Time Expiry
    useEffect(() => {
        if (attemptId && endsAt && !result && !autoSubmitted) {
            const end = new Date(endsAt).getTime();
            if (Date.now() > end) {
                setAutoSubmitted(true);
                submitExam(true);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attemptId, endsAt, result, nowTick, autoSubmitted]);

    // Tab Switch Auto-Submit
    useEffect(() => {
        if (!attemptId || result || autoSubmitted) return;

        const triggerAutoSubmit = () => {
            if (tabAutoSubmitDoneRef.current) return;
            tabAutoSubmitDoneRef.current = true;
            setAutoSubmitted(true);
            // Stop proctoring and generate summary on tab switch
            if (proctoringSessionId) {
                proctoringService.endSession(proctoringSessionId).catch(e => console.error(e));
                sessionStorage.removeItem('proctoring_session_id');
            }
            stopProctoring();
            submitExam(true);
            toast.error('Tab switching detected. Exam auto-submitted.');
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') triggerAutoSubmit();
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('blur', triggerAutoSubmit);
        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('blur', triggerAutoSubmit);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attemptId, result, autoSubmitted, proctoringSessionId]);

    // Redirect after Result
    useEffect(() => {
        if (!result || redirected) return;
        setRedirected(true);

        const endSessionAndRedirect = async () => {
            // Navigate to next round or applications
            try {
                const r = await getRounds(jobId);
                const rounds = Array.isArray(r?.data) ? r.data : [];
                const next = getNextRoundAfter(rounds, 'APTITUDE');
                
                if (next) {
                    // Continue to next round - don't stop proctoring
                    navigate(getNavigatePathForRound(jobId, next), { replace: true });
                } else {
                    // No more rounds - stop proctoring
                    if (proctoringSessionId) {
                        try { await proctoringService.endSession(proctoringSessionId); } catch (e) {}
                        sessionStorage.removeItem('proctoring_session_id');
                    }
                    stopProctoring();
                    navigate('/applications', { replace: true });
                }
            } catch {
                // On error, stop proctoring and go to applications
                if (proctoringSessionId) {
                    try { await proctoringService.endSession(proctoringSessionId); } catch (e) {}
                    sessionStorage.removeItem('proctoring_session_id');
                }
                stopProctoring();
                navigate('/applications', { replace: true });
            }
        };
        endSessionAndRedirect();
    }, [result, redirected, navigate, jobId]);


    // --- Render Helpers ---
    if (showConsent) return <ProctoringConsent onAccept={handleConsentAccept} onDecline={handleConsentDecline} />;
    
    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            Loading Exam...
        </div>
    );

    if (proctoringError) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white p-4">
            <div className="bg-destructive/10 border border-destructive/50 p-6 rounded-lg max-w-md text-center">
                <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
                <h2 className="text-lg font-bold mb-2">Proctoring Error</h2>
                <p className="text-muted-foreground mb-4">{proctoringError}</p>
                <button onClick={() => navigate('/applications')} className="bg-secondary hover:bg-secondary/80 text-white px-4 py-2 rounded">Back to Dashboard</button>
            </div>
        </div>
    );

    if (!attemptId) return null;

    return (
        <div className="min-h-screen bg-black text-white flex overflow-hidden font-sans">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                
                {/* Header */}
                <header className="h-16 border-b border-border/20 bg-card/30 backdrop-blur-md flex items-center justify-between px-6 z-10">
                    <div className="flex items-center gap-4">
                         <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground/50">APTITUDE ROUND</span>
                    </div>

                    <div className="flex items-center gap-6">
                         {/* Proctoring Status */}
                        {isProctoring && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full animate-pulse">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span className="text-xs font-bold text-red-500 uppercase tracking-wider">REC</span>
                            </div>
                        )}
                        
                        {/* Timer */}
                        <div className="flex items-center gap-2 text-foreground font-mono bg-secondary/10 px-3 py-1.5 rounded-md border border-border/20">
                            <Clock size={16} className="text-primary" />
                            <span className="text-lg font-bold">{timeLeftLabel}</span>
                        </div>

                        {/* Submit Button */}
                        <button 
                            onClick={() => submitExam()} 
                            disabled={submitting || result}
                            className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-primary/20"
                        >
                            {submitting ? 'Submitting...' : 'Submit Exam'}
                        </button>
                    </div>
                </header>

                {/* Question Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 flex flex-col w-full relative">
                    {currentQuestion && (
                        <div className="animate-fade-in flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full">
                            <div className="mb-4 text-primary font-bold tracking-wider text-xs uppercase flex items-center justify-between">
                                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                                <span className="text-muted-foreground/50 hidden md:inline-block">Select one option</span>
                            </div>
                            
                            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold font-heading leading-tight mb-8 text-foreground">
                                {currentQuestion.question}
                            </h2>

                            <div className="space-y-4 max-w-3xl w-full">
                                {currentQuestion.options.map((optionText, idx) => {
                                    const labels = ['A', 'B', 'C', 'D'];
                                    const optionLabel = labels[idx];
                                    const isSelected = selectedByQuestion[currentQuestion.id] === optionLabel;
                                    
                                    return (
                                        <button
                                            key={optionLabel}
                                            onClick={() => setSelectedByQuestion(prev => ({ ...prev, [currentQuestion.id]: optionLabel }))}
                                            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center group relative overflow-hidden ${
                                                isSelected 
                                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/5' 
                                                : 'border-border/40 bg-card/40 hover:border-primary/40 hover:bg-card/60'
                                            }`}
                                        >
                                            {/* Selection Indicator Bar */}
                                            {isSelected && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                                            )}

                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-4 text-sm font-bold transition-colors shrink-0 ${
                                                isSelected 
                                                ? 'bg-primary text-white' 
                                                : 'bg-secondary text-muted-foreground group-hover:text-foreground group-hover:bg-secondary/80'
                                            }`}>
                                                {optionLabel}
                                            </div>
                                            <span className={`text-base md:text-lg ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                                {optionText}
                                            </span>
                                            
                                            {/* Checkmark for selected state */}
                                            {isSelected && (
                                                <div className="ml-auto text-primary animate-in fade-in zoom-in duration-200">
                                                    <CheckCircle2 size={20} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </main>

                {/* Footer Navigation */}
                <footer className="h-20 border-t border-border/20 bg-card/20 backdrop-blur-sm flex items-center justify-between px-6 md:px-12 z-10">
                    <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={isFirstQuestion}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                            isFirstQuestion 
                            ? 'opacity-30 cursor-not-allowed text-muted-foreground' 
                            : 'text-foreground hover:bg-secondary/40 hover:pl-3'
                        }`}
                    >
                        <ChevronLeft size={20} />
                        Previous
                    </button>

                    <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground font-medium bg-secondary/20 px-3 py-1 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                        <span>{Object.keys(selectedByQuestion).length} answered</span>
                        <span className="opacity-30">|</span>
                        <span>{questions.length - Object.keys(selectedByQuestion).length} remaining</span>
                    </div>

                    <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                        disabled={isLastQuestion}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                            isLastQuestion 
                            ? 'opacity-30 cursor-not-allowed text-muted-foreground' 
                            : 'text-foreground hover:bg-secondary/40 hover:pr-3'
                        }`}
                    >
                        Next
                        <ChevronRight size={20} />
                    </button>
                </footer>
            </div>

            {/* Right Sidebar - Question Palette */}
            <aside className="w-80 border-l border-border/20 bg-card/10 backdrop-blur-sm p-6 hidden lg:flex flex-col h-screen sticky top-0">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Question Palette</h3>
                    <div className="text-[10px] bg-secondary/30 px-2 py-0.5 rounded text-muted-foreground font-mono">
                        {currentQuestionIndex + 1}/{questions.length}
                    </div>
                </div>
                
                <div className="grid grid-cols-5 gap-2.5 content-start overflow-y-auto pr-1 custom-scrollbar pb-4">
                    {questions.map((q, idx) => {
                        const isAnswered = !!selectedByQuestion[q.id];
                        const isCurrent = currentQuestionIndex === idx;

                        return (
                            <button
                                key={q.id}
                                onClick={() => setCurrentQuestionIndex(idx)}
                                className={`aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                                    isCurrent 
                                    ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-110 ring-2 ring-primary/50 relative z-10' 
                                    : isAnswered 
                                        ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' 
                                        : 'bg-secondary/30 text-muted-foreground border border-border/20 hover:bg-secondary/50 hover:text-foreground'
                                }`}
                            >
                                {idx + 1}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-auto pt-6 border-t border-border/20 space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-primary shadow-sm shadow-primary/50"></div>
                            Current
                        </span>
                        <span>1</span>
                    </div>
                     <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30"></div>
                            Answered
                        </span>
                         <span>{Object.keys(selectedByQuestion).length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-secondary/30 border border-border/20"></div>
                            Unanswered
                        </span>
                         <span>{questions.length - Object.keys(selectedByQuestion).length}</span>
                    </div>
                </div>
            </aside>
        </div>
    );
};

export default CandidateAptitudeRound;
