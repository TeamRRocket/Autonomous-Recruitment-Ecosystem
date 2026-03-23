import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Editor from '@monaco-editor/react';
import { getDsaResult, getDsaStatus, runDsa, saveDsaDraft, startDsaRound, submitDsa } from '../../services/dsaService';
import { getRounds } from '../../services/roundService';
import useProctoring from '../../hooks/useProctoring';
import ProctoringConsent from '../../components/proctoring/ProctoringConsent';
import RecordingIndicator from '../../components/proctoring/RecordingIndicator';
import proctoringService from '../../services/proctoringService';
import { getNextRoundAfter, getNavigatePathForRound } from '../../utils/candidateRoundNavigation';

const DEFAULT_CPP_TEMPLATE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // TODO: Read input

    // TODO: Write output

    return 0;
}
`;

const pad2 = (n) => n.toString().padStart(2, '0');

const CandidateDsaRound = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const splitContainerRef = useRef(null);
  const [rightPanePx, setRightPanePx] = useState(() => {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('dsa:rightPanePx') : null;
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) ? n : 520;
  });
  const [draggingSplit, setDraggingSplit] = useState(false);

  const [loading, setLoading] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [status, setStatus] = useState(null);
  const [endsAt, setEndsAt] = useState(null);
  const [serverTime, setServerTime] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [problems, setProblems] = useState([]);
  const [activeProblemId, setActiveProblemId] = useState(null);
  const [submittedProblemIds, setSubmittedProblemIds] = useState([]);
  const [remaining, setRemaining] = useState(null);
  const [stdin, setStdin] = useState('');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [finalResult, setFinalResult] = useState(null);

  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [redirected, setRedirected] = useState(false);

  const [codeByProblem, setCodeByProblem] = useState({});

  // Proctoring is optional - start exam immediately if consent was given previously
  const alreadyConsented = sessionStorage.getItem('proctoring_consent') === 'true';
  const [showConsent, setShowConsent] = useState(false); // Don't block with consent modal
  const [consentGiven, setConsentGiven] = useState(true); // Always allow exam to start
  const [proctoringSessionId, setProctoringSessionId] = useState(null);
  const [examStarted, setExamStarted] = useState(false);

  // Proctoring hook
  const {
    isProctoring,
    hasWebcamPermission,
    error: proctoringError,
    startProctoring,
    stopProctoring,
    sendBrowserEvent
  } = useProctoring(proctoringSessionId, examStarted && !finalResult);

  const saveTimerRef = useRef(null);
  const lastSavedRef = useRef({});
  /** Flushed to server on each problem submit (DSA anti-cheat table) */
  const antiCheatRef = useRef([]);
  const codeByProblemRef = useRef(codeByProblem);
  codeByProblemRef.current = codeByProblem;

  const activeProblem = useMemo(
    () => problems.find((p) => p.id === activeProblemId) || null,
    [problems, activeProblemId]
  );

  const submittedSet = useMemo(() => new Set((submittedProblemIds || []).map((v) => String(v))), [submittedProblemIds]);
  const activeProblemSubmitted = !!activeProblemId && submittedSet.has(String(activeProblemId));

  const editorReadOnly = status === 'SUBMITTED' || status === 'EXPIRED' || activeProblemSubmitted;

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

  useEffect(() => {
    if (!endsAt) return;
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  const currentCode = useMemo(() => {
    if (!activeProblemId) return DEFAULT_CPP_TEMPLATE;
    return codeByProblem[activeProblemId] ?? activeProblem?.boilerplate_cpp ?? DEFAULT_CPP_TEMPLATE;
  }, [activeProblemId, codeByProblem, activeProblem]);

  const setCurrentCode = (next) => {
    if (!activeProblemId) return;
    setCodeByProblem((prev) => ({ ...prev, [activeProblemId]: typeof next === 'string' ? next : '' }));
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('dsa:rightPanePx', String(rightPanePx));
    } catch {
      // ignore
    }
  }, [rightPanePx]);

  useEffect(() => {
    if (!draggingSplit) return;

    const onMove = (e) => {
      const el = splitContainerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const containerW = rect.width;
      if (!Number.isFinite(containerW) || containerW <= 0) return;

      const minLeft = 360;
      const minRight = 380;
      const maxRight = Math.max(minRight, Math.floor(containerW - minLeft));
      const nextRight = Math.round(containerW - x);
      const clamped = Math.max(minRight, Math.min(maxRight, nextRight));
      setRightPanePx(clamped);
    };

    const onUp = () => setDraggingSplit(false);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [draggingSplit]);

  // Fullscreen removed - can only be triggered by user gesture, not automatically

  useEffect(() => {
    if (!attemptId) return;
    if (finalResult) return;

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
  }, [attemptId, finalResult]);

  useEffect(() => {
    if (!finalResult) return;
    if (redirected) return;
    setRedirected(true);

    // End proctoring session
    const endProctoringAndRedirect = async () => {
      // Clean up proctoring
      if (proctoringSessionId) {
        try {
          await proctoringService.endSession(proctoringSessionId);
          console.log('✓ Proctoring session ended');
        } catch (err) {
          console.error('Failed to end proctoring session:', err);
        }
      }
      stopProctoring(); // Turn off camera - DSA is the last round
      sessionStorage.removeItem('proctoring_consent'); // Clear consent for next exam

      try {
        if (document?.fullscreenElement && document?.exitFullscreen) {
          document.exitFullscreen();
        }
      } catch {
        // ignore
      }

      const go = async () => {
        if (!jobId) {
          navigate('/applications', { replace: true });
          return;
        }

        try {
          const r = await getRounds(jobId);
          const rounds = Array.isArray(r?.data) ? r.data : [];
          const next = getNextRoundAfter(rounds, 'DSA');
          if (next) {
            navigate(getNavigatePathForRound(jobId, next), { replace: true });
            return;
          }
        } catch {
          // ignore
        }

        navigate('/applications', { replace: true });
      };

      go();
    };

    endProctoringAndRedirect();
  }, [finalResult, redirected, navigate, proctoringSessionId, stopProctoring]);

  const scheduleSave = (problemId, source) => {
    if (!attemptId || !problemId) return;
    if (typeof source !== 'string') return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      try {
        const last = lastSavedRef.current[problemId];
        if (last === source) return;
        await saveDsaDraft({
          job_id: jobId,
          attempt_id: attemptId,
          problem_id: String(problemId),
          source_code: source,
        });
        lastSavedRef.current[problemId] = source;
      } catch {
        // Autosave failures should not block the candidate.
      }
    }, 900);
  };

  // Handle consent acceptance
  const handleConsentAccept = async () => {
    setShowConsent(false);
    setConsentGiven(true);
    sessionStorage.setItem('proctoring_consent', 'true');
  };

  // Handle consent decline - allow exam without proctoring
  const handleConsentDecline = () => {
    setShowConsent(false);
    setConsentGiven(true); // Allow exam to proceed without proctoring
    toast.warning('Continuing without proctoring');
  };

  const load = async () => {
    setLoading(true);
    try {
      const startRes = await startDsaRound(jobId);
      setAttemptId(startRes.data.attempt_id);
      setStatus(startRes.data.status);
      setEndsAt(startRes.data.ends_at);
      setServerTime(startRes.data.server_time);
      setSubmittedProblemIds((startRes.data.submitted_problem_ids || []).map((v) => String(v)));
      setRemaining(startRes.data.remaining ?? null);

      const normalizedProblems = (startRes.data.problems || []).map((p) => ({
        ...p,
        id: p?.id != null ? String(p.id) : p.id,
      }));
      setProblems(normalizedProblems);
      const submitted = new Set((startRes.data.submitted_problem_ids || []).map((v) => String(v)));
      const firstUnsubmitted = normalizedProblems.find((p) => !submitted.has(String(p.id)));
      setActiveProblemId((firstUnsubmitted?.id || normalizedProblems?.[0]?.id) ?? null);

      const initialCode = {};
      for (const p of normalizedProblems) {
        const pid = p?.id != null ? String(p.id) : p.id;
        const local = localStorage.getItem(`dsa:draft:${jobId}:${pid}`);
        initialCode[pid] = local || p.boilerplate_cpp || DEFAULT_CPP_TEMPLATE;
      }
      setCodeByProblem(initialCode);

      // Start proctoring session if consent was given (NON-FATAL - exam continues without it)
      if (alreadyConsented) {
        try {
          const session = await proctoringService.startSession(
            jobId,
            'DSA',
            startRes.data.attempt_id
          );
          setProctoringSessionId(session.id);

          // Request camera permission and start proctoring
          const started = await startProctoring(session.id);

          if (!started) {
            console.warn('Camera permission denied for DSA proctoring - exam continues without proctoring');
          }
        } catch (err) {
          console.error('Failed to start proctoring for DSA:', err);
          // Non-fatal: exam continues without proctoring
        }
      }

      setExamStarted(true);
    } catch (err) {
      console.error('Failed to start DSA round:', err);
      const errorMsg = err.response?.data?.message || 'Failed to start DSA round';
      toast.error(errorMsg);
      
      // Show error in UI instead of navigating away
      setLoading(false);
      setProblems([]);
      
      // If it's a prerequisite error (403), show helpful message
      if (err.response?.status === 403) {
        setTimeout(() => {
          toast.error('Please complete the Aptitude round first', { duration: 5000 });
          setTimeout(() => navigate('/applications'), 2000);
        }, 1000);
      } else {
        setTimeout(() => navigate('/applications'), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(); // Start immediately without waiting for consent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;
    if (!examStarted) return; // Don't poll until exam actually starts

    const timer = setInterval(async () => {
      try {
        const st = await getDsaStatus(jobId);
        setStatus(st.data.status);
        setEndsAt(st.data.ends_at);
        setServerTime(st.data.server_time);
        setSubmittedProblemIds((st.data.submitted_problem_ids || []).map((v) => String(v)));
        setRemaining(st.data.remaining ?? null);

        if (st.data.status === 'SUBMITTED') {
          const res = await getDsaResult(jobId);
          setFinalResult(res.data);
        }
      } catch {
        // Ignore transient polling errors.
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [jobId, examStarted]);

  useEffect(() => {
    if (!activeProblemId) return;
    const code = codeByProblem[activeProblemId];
    if (code == null) return;

    localStorage.setItem(`dsa:draft:${jobId}:${activeProblemId}`, code);
    scheduleSave(activeProblemId, code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, activeProblemId, codeByProblem[activeProblemId]]);

  const handleRun = async () => {
    if (!attemptId || !activeProblemId || !activeProblem) return;

    const source_code = codeByProblem[activeProblemId] || activeProblem.boilerplate_cpp || DEFAULT_CPP_TEMPLATE;
    if (!source_code.trim()) {
      toast.error('Code is empty');
      return;
    }

    setRunning(true);
    setRunResult(null);
    try {
      const res = await runDsa({
        job_id: jobId,
        attempt_id: attemptId,
        problem_id: String(activeProblemId),
        source_code,
        stdin,
      });
      setRunResult(res.data);
    } catch (err) {
      if (!err.response) {
        toast.error('Backend not reachable (http://localhost:3000). Start the backend and try again.');
      } else {
        toast.error(err.response?.data?.message || 'Run failed');
      }
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!attemptId || !activeProblemId || !activeProblem) return;
    if (submittedSet.has(String(activeProblemId))) {
      toast.error('Problem already submitted');
      return;
    }

    const solutions = [
      {
        problem_id: String(activeProblemId),
        source_code: codeByProblem[activeProblemId] || activeProblem.boilerplate_cpp || DEFAULT_CPP_TEMPLATE,
      },
    ];

    setSubmitting(true);
    try {
      const anti_cheat_events = antiCheatRef.current.splice(0);
      const res = await submitDsa({ job_id: jobId, attempt_id: attemptId, solutions, anti_cheat_events });

      const nextStatus = res?.data?.status;
      const nextSubmitted = (res?.data?.submitted_problem_ids || []).map((v) => String(v));
      setSubmittedProblemIds(nextSubmitted);
      setRemaining(res?.data?.remaining ?? null);
      setRunResult(null);

      if (nextStatus === 'SUBMITTED') {
        setFinalResult(res.data);
        toast.success('DSA round submitted');
        return;
      }

      toast.success('Answer submitted');

      // Move to next unsubmitted problem automatically
      const nextUnsubmitted = problems.find((p) => !new Set(nextSubmitted).has(String(p.id)));
      if (nextUnsubmitted?.id) {
        setActiveProblemId(String(nextUnsubmitted.id));
      }
    } catch (err) {
      if (!err.response) {
        toast.error('Backend not reachable (http://localhost:3000). Start the backend and try again.');
      } else {
        toast.error(err.response?.data?.message || 'Submit failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const submitAllRemaining = useCallback(async () => {
    if (!attemptId) return;

    const submitted = new Set((submittedProblemIds || []).map((v) => String(v)));
    const unsubmitted = problems.filter((p) => !submitted.has(String(p.id)));
    if (unsubmitted.length === 0) return;

    const code = codeByProblemRef.current;
    const solutions = unsubmitted.map((p) => ({
      problem_id: String(p.id),
      source_code: code[p.id] || p.boilerplate_cpp || DEFAULT_CPP_TEMPLATE,
    }));

    setSubmitting(true);
    try {
      const anti_cheat_events = antiCheatRef.current.splice(0);
      const res = await submitDsa({ job_id: jobId, attempt_id: attemptId, solutions, anti_cheat_events });
      const nextStatus = res?.data?.status;
      const nextSubmitted = (res?.data?.submitted_problem_ids || []).map((v) => String(v));
      setSubmittedProblemIds(nextSubmitted);
      setRemaining(res?.data?.remaining ?? null);
      setRunResult(null);

      if (nextStatus === 'SUBMITTED') {
        setFinalResult(res.data);
      }
    } catch {
      // ignore (auto submit should not spam errors)
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, jobId, problems, submittedProblemIds]);

  /** Leaving the exam tab auto-submits once (policy: same idea as fullscreen exit on technical) */
  const tabAutoSubmitDoneRef = useRef(false);
  useEffect(() => {
    if (!examStarted || !attemptId || finalResult) return;
    const onVis = () => {
      if (document.visibilityState === 'hidden' && !tabAutoSubmitDoneRef.current) {
        tabAutoSubmitDoneRef.current = true;
        toast.error('You left the exam tab — submitting your answers now.');
        void submitAllRemaining();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [examStarted, attemptId, finalResult, submitAllRemaining]);

  /** Block copy/cut/paste in the round (stdin field may still paste — marked data-allow-paste) */
  useEffect(() => {
    if (!examStarted || finalResult) return;

    const allowPasteTarget = (el) => el?.closest?.('[data-allow-paste="true"]');

    const onClipboardBlock = (e) => {
      if (allowPasteTarget(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      antiCheatRef.current.push({ event_type: 'CLIPBOARD_' + e.type.toUpperCase() });
      sendBrowserEvent('COPY_PASTE_BLOCKED', { action: e.type, timestamp: new Date().toISOString() });
    };

    const onKeyBlock = (e) => {
      if (allowPasteTarget(e.target)) return;
      if (e.ctrlKey || e.metaKey) {
        const k = e.key?.toLowerCase?.();
        if (k === 'c' || k === 'v' || k === 'x') {
          e.preventDefault();
          e.stopPropagation();
          antiCheatRef.current.push({ event_type: 'KEYBOARD_' + k.toUpperCase() });
        }
      }
    };

    document.addEventListener('copy', onClipboardBlock, true);
    document.addEventListener('cut', onClipboardBlock, true);
    document.addEventListener('paste', onClipboardBlock, true);
    window.addEventListener('keydown', onKeyBlock, true);

    return () => {
      document.removeEventListener('copy', onClipboardBlock, true);
      document.removeEventListener('cut', onClipboardBlock, true);
      document.removeEventListener('paste', onClipboardBlock, true);
      window.removeEventListener('keydown', onKeyBlock, true);
    };
  }, [examStarted, finalResult, sendBrowserEvent]);

  /** Persist tab/blur counts for DSA anti_cheat rows (useProctoring already sends proctoring HTTP events) */
  useEffect(() => {
    if (!examStarted || finalResult) return;

    const onVis = () => {
      if (document.visibilityState !== 'visible') {
        antiCheatRef.current.push({ event_type: 'TAB_HIDDEN' });
      }
    };
    const onBlur = () => {
      antiCheatRef.current.push({ event_type: 'WINDOW_BLUR' });
    };

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', onBlur);
    };
  }, [examStarted, finalResult]);

  useEffect(() => {
    if (!attemptId) return;
    if (!endsAt) return;
    if (finalResult) return;
    if (autoSubmitted) return;

    const end = new Date(endsAt).getTime();
    if (!Number.isFinite(end)) return;
    if (Date.now() <= end) return;

    setAutoSubmitted(true);
    submitAllRemaining();
  }, [attemptId, endsAt, finalResult, autoSubmitted, nowTick, submitAllRemaining]);

  // Show consent modal FIRST (before any loading checks)
  if (showConsent) {
    return (
      <ProctoringConsent
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />
    );
  }

  if (loading) {
    return <div className="p-8 text-slate-400">Loading DSA round...</div>;
  }

  if (!problems.length && !loading) {
    return <div className="p-8 text-slate-400">DSA round not available.</div>;
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Recording Indicator */}
      {isProctoring && <RecordingIndicator />}

      <div ref={splitContainerRef} className="w-full px-4 sm:px-6 lg:px-8 py-6 h-full">
        <div className="h-full min-h-0 flex flex-col lg:flex-row gap-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col min-h-0 lg:flex-1" style={{ width: undefined }}>
            <div className="flex items-start justify-between gap-4 shrink-0">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">DSA Round</p>
                <h1 className="text-2xl font-bold text-white mt-2">{activeProblem?.title || 'Select a problem'}</h1>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-slate-300">
                  C++ (GNU++17)
                </span>
                {timeLeftMs > 0 && (
                  <span className="text-xs font-semibold rounded-full border border-amber-600 bg-amber-900 px-3 py-1 text-amber-300">
                    {timeLeftLabel}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 min-h-0 overflow-y-auto pr-1">
              {activeProblem && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-200 mb-2">Problem</h2>
                    <pre className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed">{activeProblem.problem_statement}</pre>
                  </div>

                  {activeProblem.constraints && (
                    <div>
                      <h2 className="text-sm font-semibold text-slate-200 mb-2">Constraints</h2>
                      <pre className="whitespace-pre-wrap text-sm text-slate-300">{activeProblem.constraints}</pre>
                    </div>
                  )}

                  {activeProblem.public_test_cases && activeProblem.public_test_cases.length > 0 && (
                    <div>
                      <h2 className="text-sm font-semibold text-slate-200 mb-2">Public Test Cases</h2>
                      <div className="space-y-2">
                        {activeProblem.public_test_cases.map((tc, i) => (
                          <div key={i} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                            <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Test #{tc.test_order}</p>
                            <div className="mt-2">
                              <p className="text-xs text-slate-400 mb-1">Input</p>
                              <pre className="text-xs text-slate-200 whitespace-pre-wrap">{tc.input}</pre>
                            </div>
                            <div className="mt-2">
                              <p className="text-xs text-slate-400 mb-1">Expected Output</p>
                              <pre className="text-xs text-slate-200 whitespace-pre-wrap">{tc.expected_output}</pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!activeProblem && (
                <div>
                  <p className="text-sm text-slate-400">Select a problem from the right panel to begin.</p>
                </div>
              )}
            </div>
          </div>

          <div
            role="separator"
            aria-orientation="vertical"
            onMouseDown={() => setDraggingSplit(true)}
            className="hidden lg:flex w-2 -mx-2 cursor-col-resize items-stretch"
          >
            <div className={`w-0.5 mx-auto rounded-full ${draggingSplit ? 'bg-indigo-500' : 'bg-slate-700/60'}`} />
          </div>

          <div className="space-y-4 min-h-0 flex flex-col" style={{ width: rightPanePx }}>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-200">Problems</h2>
                {timeLeftMs > 0 && !editorReadOnly && (
                  <span className="text-xs font-semibold rounded-full border border-amber-600 bg-amber-900 px-3 py-1 text-amber-300">
                    {timeLeftLabel}
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {problems.map((p) => (
                  (() => {
                    const isSubmitted = submittedSet.has(String(p.id));
                    return (
                      <button
                        key={p.id}
                        onClick={() => setActiveProblemId(p.id)}
                        className={`w-full text-left rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${p.id === activeProblemId
                          ? 'bg-indigo-600 text-white'
                          : isSubmitted
                            ? 'bg-slate-900 text-slate-500'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span>
                            {p.problem_order}. {p.title}
                          </span>
                          {isSubmitted && (
                            <span className="text-[10px] uppercase tracking-widest rounded-full border border-slate-700 px-2 py-0.5">
                              Submitted
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })()
                ))}
              </div>
            </div>

            {activeProblem && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 min-h-0 flex flex-col">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-200">Editor</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRun}
                      disabled={running || editorReadOnly}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-semibold disabled:opacity-50"
                    >
                      {running ? 'Running…' : 'Run'}
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || editorReadOnly}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50"
                    >
                      {activeProblemSubmitted ? 'Submitted' : submitting ? 'Submitting…' : 'Submit'}
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <Editor
                    key={activeProblemId || 'no-problem'}
                    path={activeProblemId ? `dsa:${jobId}:${activeProblemId}.cpp` : `dsa:${jobId}:no-problem.cpp`}
                    height="42vh"
                    language="cpp"
                    theme="vs-dark"
                    value={currentCode}
                    onChange={(value) => setCurrentCode(value ?? '')}
                    onMount={(editor, monaco) => {
                      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {});
                      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {});
                      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, () => {});
                    }}
                    options={{
                      readOnly: editorReadOnly,
                      minimap: { enabled: false },
                      fontSize: 13,
                      wordWrap: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      contextmenu: false,
                    }}
                  />
                </div>

                <div className="mt-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Custom Input (stdin)</h3>
                  <textarea
                    data-allow-paste="true"
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    className="w-full h-24 rounded-xl bg-slate-950/50 border border-slate-800 p-3 text-xs font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    spellCheck={false}
                  />
                </div>
              </div>
            )}

            {runResult && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <h3 className="text-sm font-semibold text-slate-200">Run Result</h3>
                <div className="mt-3 space-y-2">
                  {(Array.isArray(runResult?.results) ? runResult.results : []).map((tc, i) => (
                    <div key={i} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                      <p className="text-xs text-slate-400 uppercase tracking-widest">Test #{tc.test_order}</p>
                      <p className="text-xs text-slate-300 mt-1">
                        Status: <span className={`font-semibold ${tc.passed ? 'text-emerald-400' : 'text-rose-400'}`}>{tc.status}</span>
                      </p>
                      {tc.compile_output && (
                        <pre className="mt-2 text-xs text-rose-300 whitespace-pre-wrap">{tc.compile_output}</pre>
                      )}
                      {tc.stderr && (
                        <pre className="mt-2 text-xs text-amber-300 whitespace-pre-wrap">{tc.stderr}</pre>
                      )}
                      {tc.stdout && (
                        <pre className="mt-2 text-xs text-emerald-200 whitespace-pre-wrap">{tc.stdout}</pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {finalResult && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <h3 className="text-sm font-semibold text-slate-200">Final Result</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Status: <span className="text-slate-100 font-semibold">{finalResult.status}</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Final Score: <span className="text-indigo-400 font-bold">{finalResult.final_score}</span>
                </p>
                <div className="mt-3 space-y-2">
                  {(Array.isArray(finalResult?.per_problem) ? finalResult.per_problem : []).map((p, i) => (
                    <div key={i} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                      <p className="text-xs text-slate-400 uppercase tracking-widest">Problem {i + 1}</p>
                      <p className="text-xs text-slate-300 mt-1">
                        Score: <span className="text-indigo-400 font-bold">{p.score}</span> ({p.passed_hidden}/{p.total_hidden} hidden)
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDsaRound;
