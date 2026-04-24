import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import useProctoring from '../../hooks/useProctoring';
import ProctoringConsent from '../../components/proctoring/ProctoringConsent';
import RecordingIndicator from '../../components/proctoring/RecordingIndicator';
import proctoringService from '../../services/proctoringService';
import technicalService from '../../services/technical';
import { getRounds } from '../../services/roundService';
import { getNextRoundAfter, getNavigatePathForRound } from '../../utils/candidateRoundNavigation';
import {
    Mic,
    MicOff,
    Send,
    ChevronLeft,
    ChevronRight,
    Clock,
    CheckCircle2,
    RotateCcw,
    Maximize2,
    ShieldCheck,
    AlertCircle,
    Play
} from 'lucide-react';

const TechnicalInterview = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();

    // -- State --
    const [loading, setLoading] = useState(true);
    const [interview, setInterview] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [showFeedback, setShowFeedback] = useState({});
    const [error, setError] = useState(null);

    // -- Proctoring State --
    const alreadyConsented = sessionStorage.getItem('proctoring_consent') === 'true';
    const [showConsent, setShowConsent] = useState(!alreadyConsented);
    const [consentGiven, setConsentGiven] = useState(alreadyConsented);
    const [proctoringSessionId, setProctoringSessionId] = useState(null);
    const [examStarted, setExamStarted] = useState(false);
    const [fullscreenLocked, setFullscreenLocked] = useState(false);
    const [inFullscreen, setInFullscreen] = useState(false);
    const [forceClosed, setForceClosed] = useState(false);

    // -- Refs --
    const endsAtMsRef = useRef(null);
    const autoSubmittedRef = useRef(false);
    const wasFullscreenRef = useRef(false);
    const securityToastAtRef = useRef(0);
    const timerRef = useRef(null);

    // -- Helpers --
    const examActive = !!examStarted && !fullscreenLocked;
    const currentQuestion = interview?.questions[currentQuestionIndex];
    const currentAnswer = currentQuestion ? answers[currentQuestion.id] || '' : '';

    // -- Hooks --
    const { isProctoring, startProctoring, stopProctoring, sendBrowserEvent } = useProctoring(
        proctoringSessionId,
        examStarted && !fullscreenLocked
    );

    const {
        transcript,
        isListening,
        isSupported: isSpeechSupported,
        startListening,
        stopListening,
        resetTranscript,
        setTranscript
    } = useSpeechRecognition();

    // -- Load Interview --
    const loadRef = useRef(false);
    
    const loadInterview = useCallback(async () => {
        if (!jobId) return;
        try {
            setLoading(true);
            const response = await technicalService.start(jobId);
            const payload = response.data;
            setInterview(payload);

            if (payload.endsAt) {
                endsAtMsRef.current = new Date(payload.endsAt).getTime();
                const remaining = Math.max(0, Math.floor((endsAtMsRef.current - Date.now()) / 1000));
                setTimeRemaining(remaining);
            }

            if (payload.responses && payload.responses.length > 0) {
                const existingAnswers = {};
                payload.responses.forEach((r) => {
                    existingAnswers[r.questionId] = r.answer;
                });
                setAnswers(existingAnswers);
            }

            setError(null);

            // Start Proctoring - check for existing session
            try {
                const existingSessionId = sessionStorage.getItem('proctoring_session_id');
                const session = await proctoringService.startSession(jobId, 'TECHNICAL', payload.attemptId, existingSessionId);
                const sessionId = session.id;
                sessionStorage.setItem('proctoring_session_id', sessionId);
                
                setProctoringSessionId(sessionId);
                const started = await startProctoring(sessionId);
                if (!started) {
                    toast.error('Camera permission denied. Monitoring may be limited.');
                }
            } catch (proctorErr) {
                console.error('Proctoring start failed:', proctorErr);
                 // Non-blocking error
            }

            setExamStarted(true);
            const alreadyInFullscreen = !!document.fullscreenElement;
            setInFullscreen(alreadyInFullscreen);
            setFullscreenLocked(!alreadyInFullscreen);

        } catch (err) {
            console.error('Failed to load interview:', err);
            setError(err.response?.data?.message || 'Failed to load interview');
        } finally {
            setLoading(false);
        }
    }, [jobId, startProctoring]);

    useEffect(() => {
        if (!consentGiven || !jobId) return;
        if (loadRef.current) return;
        loadRef.current = true;
        loadInterview();
    }, [consentGiven, jobId, loadInterview]);

    // -- Timer --
    useEffect(() => {
        if (!examActive || timeRemaining === null || timeRemaining <= 0) return;

        timerRef.current = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 0) return 0;
                if (prev === 1) {
                    submitInterviewFinal();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [examActive, timeRemaining]); // Added submitInterviewFinal to dep array if strictly needed, but careful with circular deps

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // -- Input Handling --
    useEffect(() => {
        if (!interview || !examActive || !isListening) return;
        const q = interview.questions[currentQuestionIndex];
        if (!q) return;
        setAnswers((prev) => ({
            ...prev,
            [q.id]: transcript
        }));
    }, [transcript, interview, examActive, isListening, currentQuestionIndex]);

    const handleManualInput = (value) => {
        if (currentQuestion) {
            setAnswers((prev) => ({
                ...prev,
                [currentQuestion.id]: value
            }));
            setTranscript(value);
        }
    };

    // -- Actions --
    const handleNextQuestion = () => {
        if (currentQuestionIndex < interview.questions.length - 1) {
            stopListening();
            resetTranscript();
            setCurrentQuestionIndex((prev) => prev + 1);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            stopListening();
            resetTranscript();
            setCurrentQuestionIndex((prev) => prev - 1);
        }
    };

    const handleSubmitAnswer = async () => {
        if (!currentQuestion || !currentAnswer.trim()) {
            toast.error('Please provide an answer before submitting');
            return;
        }

        try {
            setSubmitting(true);
            stopListening();
            const response = await technicalService.submitAnswer(
                interview.attemptId,
                currentQuestion.id,
                currentAnswer
            );

            setShowFeedback((prev) => ({
                ...prev,
                [currentQuestion.id]: response.data
            }));
            
            toast.success('Answer recorded');

            setTimeout(() => {
                if (currentQuestionIndex < interview.questions.length - 1) {
                    handleNextQuestion();
                }
            }, 1500);
        } catch (err) {
            console.error('Failed to submit answer:', err);
            toast.error(err.response?.data?.message || 'Failed to submit answer');
        } finally {
            setSubmitting(false);
        }
    };

    const submitInterviewFinal = async () => {
        if (autoSubmittedRef.current) return;
        if (!interview) return;

        autoSubmittedRef.current = true;
        try {
            setSubmitting(true);
            stopListening();
            // Don't stop proctoring - continue to next round
            // Proctoring will be stopped only after all rounds are complete
            
            await technicalService.submit(interview.attemptId);
            toast.success('Interview submitted successfully!');

            // Navigate immediately
             try {
                const r = await getRounds(jobId);
                const rounds = Array.isArray(r?.data) ? r.data : [];
                const next = getNextRoundAfter(rounds, 'TECHNICAL');
                if (next) {
                    navigate(getNavigatePathForRound(jobId, next), { replace: true });
                    return;
                }
            } catch {}

            // No more rounds - stop proctoring and exit fullscreen
            if (proctoringSessionId) {
                try { await proctoringService.endSession(proctoringSessionId); } catch (e) {}
                sessionStorage.removeItem('proctoring_session_id'); // Clear session after all rounds
            }
            stopProctoring();

            try {
                if (document.fullscreenElement && document.exitFullscreen) {
                    await document.exitFullscreen();
                }
            } catch {}
            navigate('/applications', { replace: true });

        } catch (err) {
            console.error('Failed to submit interview:', err);
            autoSubmittedRef.current = false;
            toast.error(err.response?.data?.message || 'Failed to submit interview');
        } finally {
            setSubmitting(false);
        }
    };

    // -- Fullscreen & Security --
    const enterFullscreenAndStart = useCallback(async () => {
        try {
            await document.documentElement.requestFullscreen();
            setFullscreenLocked(false);
            setInFullscreen(true);
            if (endsAtMsRef.current) {
                setTimeRemaining(Math.max(0, Math.floor((endsAtMsRef.current - Date.now()) / 1000)));
            }
        } catch {
            toast.error('Fullscreen is required.');
        }
    }, []);

    useEffect(() => {
        if (!examActive || autoSubmittedRef.current) return;

        const onFs = () => {
            if (autoSubmittedRef.current) return;
            const fs = !!document.fullscreenElement;
            if (fs) wasFullscreenRef.current = true;
            if (wasFullscreenRef.current && !fs) {
                if (proctoringSessionId) sendBrowserEvent('WINDOW_BLUR', { reason: 'fullscreen_exit' });
                toast.error('Fullscreen exited — submitting your interview.');
                submitInterviewFinal();
            }
            setInFullscreen(fs);
        };
        document.addEventListener('fullscreenchange', onFs);
        return () => document.removeEventListener('fullscreenchange', onFs);
    }, [examActive, proctoringSessionId]);

    // Tab Switch Auto-Submit
    useEffect(() => {
        if (!examActive || autoSubmittedRef.current) return;

        const onVisibility = () => {
            if (document.visibilityState === 'hidden') {
                sendBrowserEvent('TAB_SWITCH', { timestamp: new Date().toISOString() });
                // Stop proctoring and generate summary on tab switch
                if (proctoringSessionId) {
                    proctoringService.endSession(proctoringSessionId).catch(e => console.error(e));
                    sessionStorage.removeItem('proctoring_session_id');
                }
                stopProctoring();
                submitInterviewFinal();
            }
        };

        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [examActive, proctoringSessionId]);

    // Window Blur Auto-Submit
    useEffect(() => {
        if (!examActive || autoSubmittedRef.current) return;
        const fire = () => {
            if (autoSubmittedRef.current) return;
            if (proctoringSessionId) sendBrowserEvent('TAB_SWITCH', {});
            // Stop proctoring and generate summary on window blur
            if (proctoringSessionId) {
                proctoringService.endSession(proctoringSessionId).catch(e => console.error(e));
                sessionStorage.removeItem('proctoring_session_id');
            }
            stopProctoring();
            setForceClosed(true);
            toast.error('You left the exam — submitting your interview.');
        };
        const onBlur = () => fire();
        window.addEventListener('blur', onBlur);
        return () => window.removeEventListener('blur', onBlur);
    }, [examActive, proctoringSessionId]);
    if (showConsent) {
        return <ProctoringConsent onAccept={() => {
            sessionStorage.setItem('proctoring_consent', 'true');
            setShowConsent(false);
            setConsentGiven(true);
        }} onDecline={() => {
            toast.error('Camera access is required');
            navigate('/applications');
        }} />;
    }

    if (loading) {
        return <div className="h-screen bg-black flex items-center justify-center text-white animate-pulse font-mono">Loading Technical Interview...</div>;
    }

    if (error) {
         return (
            <div className="h-screen bg-black flex flex-col items-center justify-center text-white space-y-4">
                <AlertCircle size={48} className="text-red-500" />
                <h2 className="text-xl font-bold">Error Loading Interview</h2>
                <p className="text-zinc-400 max-w-md text-center">{error}</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-2 rounded bg-zinc-800 hover:bg-zinc-700 transition"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (forceClosed) {
        return (
            <div className="h-screen bg-black flex flex-col items-center justify-center text-white space-y-4">
                <ShieldCheck size={48} className="text-red-500" />
                <h2 className="text-xl font-bold">Session Terminated</h2>
                <p className="text-zinc-400">Please do not switch tabs during the assessment.</p>
            </div>
        );
    }

    if (fullscreenLocked) {
        return (
            <div className="h-screen bg-black flex flex-col items-center justify-center text-white space-y-6">
                <Maximize2 size={64} className="text-blue-500 animate-pulse" />
                <h2 className="text-2xl font-bold">Fullscreen Required</h2>
                <p className="text-zinc-400 max-w-md text-center">
                    This interview takes place in a secure fullscreen environment. 
                    Please ensure your camera is ready.
                </p>
                <button
                    onClick={enterFullscreenAndStart}
                    className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-lg transition flex items-center gap-2"
                >
                    Start Assessment <ChevronRight size={20} />
                </button>
            </div>
        );
    }

    const progress = ((currentQuestionIndex + 1) / (interview?.questions.length || 1)) * 100;

    return (
        <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
            {/* Header */}
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a] shrink-0 z-10">
                <div className="flex items-center gap-4">
                     <div className="flex flex-col">
                        <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase text-zinc-500">Technical Round</span>
                        <h1 className="text-sm font-bold text-white tracking-tight">Technical Interview</h1>
                     </div>
                </div>

                <div className="flex items-center gap-6">
                     {/* Progress */}
                     <div className="hidden md:flex flex-col w-32 gap-1.5">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                     </div>

                     {/* Timer */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded border font-mono text-sm font-bold tracking-widest ${
                        timeRemaining < 300 
                        ? 'bg-red-950/20 border-red-900/50 text-red-500 animate-pulse' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                    }`}>
                        <Clock size={14} />
                        {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
                    </div>
                    
                    {/* Submit All */}
                     <button 
                        onClick={() => submitInterviewFinal()}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-red-900/20"
                    >
                        Finish Interview
                    </button>

                    {/* Proctoring Indicator */}
                    {isProctoring && <div className="scale-75 origin-right"><RecordingIndicator /></div>}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden relative">
                {/* Left Panel: Question */}
                <div className="w-1/2 border-r border-white/10 flex flex-col bg-[#050505] p-8 md:p-12 overflow-y-auto">
                     <div className="max-w-xl mx-auto w-full">
                        <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20 mb-6 uppercase tracking-wider">
                            Question {currentQuestionIndex + 1} of {interview?.questions.length}
                        </span>
                        
                        <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-8 text-white">
                            {currentQuestion?.question}
                        </h2>

                        {currentQuestion?.topic && (
                             <div className="text-zinc-500 text-sm font-medium uppercase tracking-widest border-l-2 border-zinc-700 pl-4 py-1">
                                Topic: {currentQuestion.topic}
                             </div>
                        )}
                     </div>
                </div>

                {/* Right Panel: Answer */}
                <div className="flex-1 flex flex-col bg-[#0a0a0a] relative">
                    <div className="flex-1 p-6 md:p-8 flex flex-col max-w-2xl mx-auto w-full justify-center">
                        <div className="mb-4 flex items-center justify-between">
                            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Your Answer</label>
                            {isSpeechSupported && (
                                <button
                                    onClick={isListening ? stopListening : startListening}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                        isListening 
                                        ? 'bg-red-500/20 text-red-500 animate-pulse border border-red-500/30' 
                                        : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                                    }`}
                                >
                                    {isListening ? (
                                        <>
                                            <MicOff size={14} /> Stop Recording
                                        </>
                                    ) : (
                                        <>
                                            <Mic size={14} /> Dictate Answer
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        <div className="relative group flex-1 min-h-[300px] mb-6">
                            <textarea
                                value={currentAnswer}
                                onChange={(e) => handleManualInput(e.target.value)}
                                placeholder="Type your answer here or utilize the dictation feature..."
                                className="w-full h-full bg-zinc-900/50 text-white p-6 rounded-xl border border-white/5 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none resize-none transition-all font-sans text-lg leading-relaxed placeholder:text-zinc-700 shadow-inner"
                                spellCheck={false}
                            />
                            {/* Listening Visualizer Placeholder */}
                            {isListening && (
                                <div className="absolute bottom-4 right-4 flex gap-1 items-end h-4">
                                    {[1,2,3,4].map(i => (
                                        <div key={i} className="w-1 bg-red-500 animate-bounce rounded-full" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}></div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                         <div className="flex items-center justify-between pt-6 border-t border-white/5 w-full"> 
                             <div className="flex gap-2">
                                <button
                                    onClick={handlePreviousQuestion}
                                    disabled={currentQuestionIndex === 0}
                                    className="p-3 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={handleNextQuestion}
                                    disabled={currentQuestionIndex === (interview?.questions.length || 0) - 1}
                                    className="p-3 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight size={20} />
                                </button>
                             </div>

                             <div className="flex gap-3">
                                <button
                                    onClick={() => setTranscript('')}
                                    className="px-4 py-2 rounded-lg text-zinc-500 text-sm font-medium hover:text-white hover:bg-zinc-900 transition-colors"
                                >
                                    Clear
                                </button>
                                <button 
                                    onClick={handleSubmitAnswer}
                                    disabled={submitting || !currentAnswer.trim()}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                >
                                    {submitting ? 'Saving...' : 'Submit Answer'}
                                    <Send size={16} />
                                </button>
                             </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default TechnicalInterview;
