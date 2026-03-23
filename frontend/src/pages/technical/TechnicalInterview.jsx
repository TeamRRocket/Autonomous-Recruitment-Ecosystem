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
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  MicrophoneIcon,
  StopCircleIcon
} from '@heroicons/react/24/outline';

const TechnicalInterview = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const alreadyConsented =
    typeof sessionStorage !== 'undefined' && sessionStorage.getItem('proctoring_consent') === 'true';
  const [showConsent, setShowConsent] = useState(!alreadyConsented);
  const [consentGiven, setConsentGiven] = useState(alreadyConsented);
  const [proctoringSessionId, setProctoringSessionId] = useState(null);
  const [examStarted, setExamStarted] = useState(false);
  /** Blocks the UI until the candidate enters fullscreen (required user gesture). */
  const [fullscreenLocked, setFullscreenLocked] = useState(false);

  const endsAtMsRef = useRef(null);
  const autoSubmittedRef = useRef(false);
  const wasFullscreenRef = useRef(false);
  const securityToastAtRef = useRef(0);

  const examActive = !!examStarted && !fullscreenLocked;

  const { isProctoring, startProctoring, stopProctoring, sendBrowserEvent } = useProctoring(
    proctoringSessionId,
    examActive
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

  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showFeedback, setShowFeedback] = useState({});
  const [error, setError] = useState(null);
  const [inFullscreen, setInFullscreen] = useState(false);
  const [forceClosed, setForceClosed] = useState(false);

  const timerRef = useRef(null);

  const handleConsentAccept = () => {
    sessionStorage.setItem('proctoring_consent', 'true');
    setShowConsent(false);
    setConsentGiven(true);
  };

  const handleConsentDecline = () => {
    toast.error('Camera access is required for the technical interview');
    navigate('/applications');
  };

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

      try {
        const session = await proctoringService.startSession(jobId, 'TECHNICAL', payload.attemptId);
        setProctoringSessionId(session.id);
        const started = await startProctoring(session.id);
        if (!started) {
          toast.error('Camera permission denied. You can still complete the interview; monitoring may be limited.');
        }
      } catch (proctorErr) {
        console.error('Proctoring start failed:', proctorErr);
        const msg = String(proctorErr.response?.data?.message || '');
        if (/aptitude or dsa|invalid round type/i.test(msg)) {
          toast.error(
            'Proctoring rejected TECHNICAL round: restart the backend API after pulling latest code, then run: node src/scripts/addTechnicalProctoringRoundType.js',
            { duration: 12000 }
          );
        } else {
          toast.error(msg || 'Proctoring could not start. Interview continues; camera may be off.');
        }
        setProctoringSessionId(null);
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
    loadInterview();
  }, [consentGiven, jobId, loadInterview]);

  const submitInterviewFinal = useCallback(
    async () => {
      if (autoSubmittedRef.current) return;
      if (!interview) return;

      autoSubmittedRef.current = true;
      try {
        setSubmitting(true);
        stopListening();
        if (proctoringSessionId) {
          try {
            await proctoringService.endSession(proctoringSessionId);
          } catch (e) {
            console.error('End proctoring session:', e);
          }
        }
        stopProctoring();
        await technicalService.submit(interview.attemptId);
        toast.success('Interview submitted successfully!');
        try {
          const r = await getRounds(jobId);
          const rounds = Array.isArray(r?.data) ? r.data : [];
          const next = getNextRoundAfter(rounds, 'TECHNICAL');
          if (next) {
            navigate(getNavigatePathForRound(jobId, next), { replace: true });
            return;
          }
        } catch {
          // ignore
        }
        try {
          if (document.fullscreenElement && document.exitFullscreen) {
            await document.exitFullscreen();
          }
        } catch {
          // ignore
        }
        sessionStorage.removeItem('proctoring_consent');
        navigate('/applications', { replace: true });
      } catch (err) {
        console.error('Failed to submit interview:', err);
        autoSubmittedRef.current = false;
        toast.error(err.response?.data?.message || 'Failed to submit interview');
      } finally {
        setSubmitting(false);
      }
    },
    [interview, proctoringSessionId, stopProctoring, stopListening, navigate, jobId]
  );

  const enterFullscreenAndStart = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setFullscreenLocked(false);
      setInFullscreen(true);
      if (endsAtMsRef.current) {
        setTimeRemaining(Math.max(0, Math.floor((endsAtMsRef.current - Date.now()) / 1000)));
      }
    } catch {
      toast.error('Fullscreen is required. Please allow fullscreen for this site.');
    }
  }, []);

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

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examActive, timeRemaining, submitInterviewFinal]);

  /** Auto-submit: leave fullscreen after having been in fullscreen during the attempt */
  useEffect(() => {
    if (!examActive || autoSubmittedRef.current) return;

    const onFs = () => {
      if (autoSubmittedRef.current) return;
      const fs = !!document.fullscreenElement;
      if (fs) wasFullscreenRef.current = true;
      if (wasFullscreenRef.current && !fs) {
        if (proctoringSessionId) {
          sendBrowserEvent('WINDOW_BLUR', {
            reason: 'fullscreen_exit',
            timestamp: new Date().toISOString()
          });
        }
        toast.error('Fullscreen exited — submitting your interview.');
        submitInterviewFinal();
      }
      setInFullscreen(fs);
    };

    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, [examActive, proctoringSessionId, sendBrowserEvent, submitInterviewFinal]);

  /** Auto-submit: tab switch / window blur */
  useEffect(() => {
    if (!examActive || autoSubmittedRef.current) return;

    const fire = () => {
      if (autoSubmittedRef.current) return;
      if (proctoringSessionId) {
        sendBrowserEvent('TAB_SWITCH', { timestamp: new Date().toISOString() });
      }
      setForceClosed(true);
      toast.error('You left the exam — submitting your interview.');
      submitInterviewFinal();
    };

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') fire();
    };

    const onBlur = () => fire();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
    };
  }, [examActive, proctoringSessionId, sendBrowserEvent, submitInterviewFinal]);

  useEffect(() => {
    if (!interview || !examActive) return;

    const maybeToast = (msg) => {
      const now = Date.now();
      if (now - securityToastAtRef.current < 2000) return;
      securityToastAtRef.current = now;
      toast.error(msg);
    };

    const blockClipboard = (e) => {
      e.preventDefault();
      if (proctoringSessionId) {
        sendBrowserEvent('COPY_PASTE', {
          action: 'blocked',
          event: e.type,
          timestamp: new Date().toISOString()
        });
      }
      maybeToast('Copy/paste is disabled during this interview');
    };

    const onKeyDown = (e) => {
      const k = e.key?.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a'].includes(k)) {
        e.preventDefault();
        if (proctoringSessionId) {
          sendBrowserEvent('COPY_PASTE', {
            action: 'blocked_shortcut',
            key: e.key,
            timestamp: new Date().toISOString()
          });
        }
        maybeToast('Keyboard shortcuts are disabled during this interview');
      }
    };

    document.addEventListener('copy', blockClipboard, true);
    document.addEventListener('paste', blockClipboard, true);
    document.addEventListener('cut', blockClipboard, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('contextmenu', blockClipboard, true);

    return () => {
      document.removeEventListener('copy', blockClipboard, true);
      document.removeEventListener('paste', blockClipboard, true);
      document.removeEventListener('cut', blockClipboard, true);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('contextmenu', blockClipboard, true);
    };
  }, [interview, examActive, sendBrowserEvent, proctoringSessionId]);

  useEffect(() => {
    if (!interview || !examActive) return;

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
  }, [interview, examActive]);

  /** Live speech-to-text into the current answer while listening */
  useEffect(() => {
    if (!interview || !examActive || !isListening) return;
    const currentQuestion = interview.questions[currentQuestionIndex];
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: transcript
    }));
  }, [transcript, interview, examActive, isListening, currentQuestionIndex]);

  const currentQuestion = interview?.questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] || '' : '';

  const handleManualInput = (value) => {
    if (currentQuestion) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: value
      }));
      setTranscript(value);
    }
  };

  const handleStartRecording = () => {
    resetTranscript();
    startListening();
  };

  const handleStopRecording = () => {
    stopListening();
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

      setTimeout(() => {
        if (currentQuestionIndex < interview.questions.length - 1) {
          handleNextQuestion();
        }
      }, 3000);
    } catch (err) {
      console.error('Failed to submit answer:', err);
      toast.error(err.response?.data?.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

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

  const handleSubmitInterview = () => submitInterviewFinal();

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showConsent) {
    return <ProctoringConsent onAccept={handleConsentAccept} onDecline={handleConsentDecline} />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-900">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
          <p className="mt-4 text-base font-medium text-slate-700">Loading interview and proctoring…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-900">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <h2 className="mb-3 text-xl font-bold text-red-700">Something went wrong</h2>
          <p className="text-base leading-relaxed text-slate-700">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (forceClosed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center">
          <p className="text-base">Closing technical round due to tab switch...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return null;
  }

  const progress = ((currentQuestionIndex + 1) / interview.questions.length) * 100;
  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim()).length;
  const feedback = showFeedback[currentQuestion?.id];

  return (
    <div className="min-h-screen bg-slate-950 py-6 text-slate-100 antialiased sm:py-10">
      {isProctoring && <RecordingIndicator />}
      <div className="fixed right-4 top-4 z-40 rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2 text-right shadow-lg backdrop-blur">
        <p className="text-[10px] uppercase tracking-widest text-slate-400">Time Left</p>
        <p className={`text-lg font-semibold ${timeRemaining != null && timeRemaining < 300 ? 'text-red-400' : 'text-emerald-400'}`}>
          {examActive && timeRemaining != null ? formatTime(timeRemaining) : '—'}
        </p>
      </div>

      {fullscreenLocked && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 px-4">
          <div className="max-w-lg rounded-2xl border border-slate-600 bg-slate-900 p-8 text-center shadow-2xl">
            <h2 className="mb-2 text-xl font-bold text-white">Fullscreen required</h2>
            <p className="mb-6 text-sm leading-relaxed text-slate-300">
              Click below to enter fullscreen and begin. The timer starts after you enter fullscreen.
            </p>
            <button
              type="button"
              onClick={enterFullscreenAndStart}
              className="w-full rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Enter fullscreen and start interview
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Technical round</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">Technical interview</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSubmitInterview}
                disabled={submitting || !examActive}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                Submit interview
              </button>
            </div>
          </div>

          <div className="mb-3">
            <div className="mb-2 flex justify-between text-sm font-medium text-slate-400">
              <span>
                Question {currentQuestionIndex + 1} of {interview.questions.length}
              </span>
              <span>{answeredCount} answered</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <p className="text-sm leading-relaxed text-slate-300">
            Read each question carefully. Use <strong className="font-semibold text-white">Speak answer</strong> to
            dictate (text appears live), or type your response in the box below.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            {currentQuestion?.topic && (
              <p className="mb-2 text-sm font-medium uppercase tracking-wide text-indigo-300">{currentQuestion.topic}</p>
            )}
            <h2 className="text-lg font-semibold leading-relaxed text-white sm:text-xl">{currentQuestion?.question}</h2>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label htmlFor="technical-answer" className="text-base font-semibold text-slate-200">
                Your answer
              </label>
              {isSpeechSupported && examActive && (
                <div className="flex gap-2">
                  {!isListening ? (
                    <button
                      type="button"
                      onClick={handleStartRecording}
                      className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                    >
                      <MicrophoneIcon className="h-5 w-5" />
                      Speak answer (live text)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStopRecording}
                      className="flex animate-pulse items-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                    >
                      <StopCircleIcon className="h-5 w-5" />
                      Stop dictation
                    </button>
                  )}
                </div>
              )}
            </div>

            <textarea
              id="technical-answer"
              value={currentAnswer}
              onChange={(e) => handleManualInput(e.target.value)}
              rows={10}
              className="min-h-[220px] w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 text-base leading-relaxed text-slate-100 shadow-inner placeholder:text-slate-500 caret-indigo-400 selection:bg-indigo-200/30 selection:text-white focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
              placeholder={
                isListening
                  ? 'Listening… speak clearly. You can edit this text anytime.'
                  : 'Type your answer here, or use Speak answer to dictate.'
              }
              autoComplete="off"
              spellCheck={false}
              disabled={!examActive}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium tabular-nums text-slate-400">
                {currentAnswer.length} characters
              </span>

              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={!examActive || !currentAnswer.trim() || submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Evaluating…
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    Submit answer
                  </>
                )}
              </button>
            </div>
          </div>

          {feedback && (
            <div className="mt-8 rounded-xl border border-emerald-700/40 bg-emerald-900/20 p-5 text-slate-100 shadow-sm">
              <h3 className="mb-3 text-base font-bold text-emerald-300">Evaluation</h3>
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-950/60 px-3 py-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Correctness</span>
                  <p className="text-lg font-bold text-emerald-300">{feedback.correctness}/10</p>
                </div>
                <div className="rounded-lg bg-slate-950/60 px-3 py-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Depth</span>
                  <p className="text-lg font-bold text-emerald-300">{feedback.depth}/10</p>
                </div>
                <div className="rounded-lg bg-slate-950/60 px-3 py-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Clarity</span>
                  <p className="text-lg font-bold text-emerald-300">{feedback.clarity}/10</p>
                </div>
              </div>
              <p className="text-sm text-slate-200">
                <span className="font-semibold">Overall score:</span> {feedback.score}/10
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">
                <span className="font-semibold">Feedback:</span> {feedback.feedback}
              </p>
            </div>
          )}
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0 || !examActive}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-200 shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Previous
          </button>

          <button
            type="button"
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex === interview.questions.length - 1 || !examActive}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-200 shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Next
            <ArrowRightIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm sm:p-8">
          <h3 className="mb-4 text-base font-bold text-white">Question navigator</h3>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-3 md:grid-cols-6 lg:grid-cols-8">
            {interview.questions.map((q, idx) => (
              <button
                key={q.id}
                type="button"
                disabled={!examActive}
                onClick={() => {
                  stopListening();
                  resetTranscript();
                  setCurrentQuestionIndex(idx);
                }}
                className={`rounded-xl p-3 text-center text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  idx === currentQuestionIndex
                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300'
                    : answers[q.id]?.trim()
                      ? 'border border-emerald-700/40 bg-emerald-900/20 text-emerald-300 hover:bg-emerald-900/30'
                      : 'border border-slate-700 bg-slate-950/70 text-slate-200 hover:bg-slate-800'
                } ${!examActive ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                Q{idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicalInterview;
