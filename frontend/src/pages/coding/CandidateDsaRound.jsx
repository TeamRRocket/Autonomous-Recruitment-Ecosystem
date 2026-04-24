import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Editor from '@monaco-editor/react';
import { Play, Send, Clock, Terminal, Minimize2, FileCode, Settings, CheckCircle2, AlertCircle, Maximize2 } from 'lucide-react';
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

    // TODO: Write your solution here

    return 0;
}
`;

const pad2 = (n) => n.toString().padStart(2, '0');

const CandidateDsaRound = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();

    // -- State --
    const [loading, setLoading] = useState(true);
    const [attemptId, setAttemptId] = useState(null);
    const [status, setStatus] = useState(null);
    const [endsAt, setEndsAt] = useState(null);
    const [serverTime, setServerTime] = useState(null); // unused but kept for completeness
    const [nowTick, setNowTick] = useState(Date.now());
    
    // Problems & Code
    const [problems, setProblems] = useState([]);
    const [activeProblemId, setActiveProblemId] = useState(null);
    const [submittedProblemIds, setSubmittedProblemIds] = useState([]);
    const [codeByProblem, setCodeByProblem] = useState({});
    
    // Execution
    const [running, setRunning] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [runResult, setRunResult] = useState(null);
    const [finalResult, setFinalResult] = useState(null);
    const [showConsole, setShowConsole] = useState(false);

    // UI
    const [redirected, setRedirected] = useState(false);
    
    // Proctoring
    const alreadyConsented = sessionStorage.getItem('proctoring_consent') === 'true';
    const [showConsent, setShowConsent] = useState(false);
    const [proctoringSessionId, setProctoringSessionId] = useState(null);
    const [examStarted, setExamStarted] = useState(false);
    const [fullscreenLocked, setFullscreenLocked] = useState(false);

    const {
        isProctoring,
        startProctoring,
        stopProctoring
    } = useProctoring(proctoringSessionId, examStarted && !finalResult && !fullscreenLocked);

    // -- Refs for Autosave & Anticheat --
    const saveTimerRef = useRef(null);
    const antiCheatRef = useRef([]);

    // -- Computed --
    const activeProblem = useMemo(() => problems.find(p => String(p.id) === String(activeProblemId)), [problems, activeProblemId]);
    const isSubmitted = useMemo(() => submittedProblemIds.includes(String(activeProblemId)), [submittedProblemIds, activeProblemId]);
    
    const editorReadOnly = fullscreenLocked || status === 'SUBMITTED' || status === 'EXPIRED' || isSubmitted;

    const currentCode = useMemo(() => {
        if (!activeProblemId) return DEFAULT_CPP_TEMPLATE;
        return codeByProblem[activeProblemId] ?? activeProblem?.boilerplate_cpp ?? DEFAULT_CPP_TEMPLATE;
    }, [activeProblemId, codeByProblem, activeProblem]);

    // -- Timer --
    const timeLeftLabel = useMemo(() => {
        if (!endsAt) return "00:00:00";
        const end = new Date(endsAt).getTime();
        const diff = Math.max(0, end - nowTick);
        const totalSeconds = Math.floor(diff / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
    }, [endsAt, nowTick]);

    useEffect(() => {
        if (!endsAt) return;
        const t = setInterval(() => setNowTick(Date.now()), 1000);
        return () => clearInterval(t);
    }, [endsAt]);

    // -- Init / Load --
    const loadRef = useRef(false);
    
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const startRes = await startDsaRound(jobId);
            const data = startRes.data;
            
            setAttemptId(data.attempt_id);
            setStatus(data.status);
            setEndsAt(data.ends_at);
            setServerTime(data.server_time);
            setSubmittedProblemIds((data.submitted_problem_ids || []).map(String));

            const normProblems = (data.problems || []).map(p => ({
                ...p,
                id: String(p.id)
            }));
            setProblems(normProblems);

            // Set active problem to first unsubmitted or first
            const firstUnsub = normProblems.find(p => !(data.submitted_problem_ids || []).map(String).includes(String(p.id)));
            setActiveProblemId(firstUnsub ? String(firstUnsub.id) : String(normProblems[0]?.id));

            // Hydrate local drafts
            const initialCode = {};
            for (const p of normProblems) {
                const local = localStorage.getItem(`dsa:draft:${jobId}:${p.id}`);
                initialCode[p.id] = local || p.boilerplate_cpp || DEFAULT_CPP_TEMPLATE;
            }
            setCodeByProblem(initialCode);

            // Start Proctoring (Non-blocking) - check for existing session
            if (alreadyConsented) {
                try {
                    // Check if proctoring session already exists from previous round
                    const existingSessionId = sessionStorage.getItem('proctoring_session_id');
                    const session = await proctoringService.startSession(jobId, 'DSA', data.attempt_id, existingSessionId);
                    const sessionId = session.id;
                    sessionStorage.setItem('proctoring_session_id', sessionId);
                    
                    setProctoringSessionId(sessionId);
                    await startProctoring(sessionId);
                } catch (e) { console.error('Proctoring start failed', e); }
            } else {
                setShowConsent(true);
            }

            setExamStarted(true);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load DSA round. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [jobId, alreadyConsented, startProctoring]);

    useEffect(() => { 
        if (loadRef.current) return;
        loadRef.current = true;
        load(); 
    }, [load]);

    // -- Polling Status --
    useEffect(() => {
        if (!jobId || !examStarted || finalResult) return;
        const t = setInterval(async () => {
            try {
                const st = await getDsaStatus(jobId);
                setStatus(st.data.status);
                setEndsAt(st.data.ends_at);
                setSubmittedProblemIds((st.data.submitted_problem_ids || []).map(String));
                if (st.data.status === 'SUBMITTED') {
                    const res = await getDsaResult(jobId);
                    setFinalResult(res.data);
                }
            } catch {}
        }, 5000);
        return () => clearInterval(t);
    }, [jobId, examStarted, finalResult]);

    // -- Code Change & Autosave --
    const handleCodeChange = (val) => {
        if (!activeProblemId || editorReadOnly) return;
        setCodeByProblem(prev => ({ ...prev, [activeProblemId]: val }));
        
        // Autosave debounce
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(async () => {
            localStorage.setItem(`dsa:draft:${jobId}:${activeProblemId}`, val);
            try {
                await saveDsaDraft({
                    job_id: jobId,
                    attempt_id: attemptId,
                    problem_id: String(activeProblemId),
                    source_code: val
                });
            } catch {}
        }, 1000);
    };

    // -- Actions --
    const handleRun = async () => {
        if (!activeProblemId) return;
        setRunning(true);
        setShowConsole(true);
        setRunResult(null);
        try {
            const res = await runDsa({
                job_id: jobId,
                attempt_id: attemptId,
                problem_id: String(activeProblemId),
                source_code: currentCode
            });
            setRunResult(res.data); // Expect { status, stdout, stderr }
        } catch (err) {
            toast.error('Run failed');
            setRunResult({ status: 'ERROR', stderr: 'Network or internal error.' });
        } finally {
            setRunning(false);
        }
    };

    const handleSubmit = useRef(null);
    handleSubmit.current = async () => {
        if (isSubmitted) return;
        setSubmitting(true);
        try {
            const res = await submitDsa({
                job_id: jobId,
                attempt_id: attemptId,
                solutions: [{ problem_id: String(activeProblemId), source_code: currentCode }],
                anti_cheat_events: []
            });
            
            setSubmittedProblemIds((res.data.submitted_problem_ids || []).map(String));
            
            if (res.data.status === 'SUBMITTED') {
                setFinalResult(res.data);
                toast.success('All submitted!');
            } else {
                toast.success('Problem submitted successfully');
                // Move to next unsubmitted
                const next = problems.find(p => !(res.data.submitted_problem_ids || []).map(String).includes(String(p.id)));
                if (next) setActiveProblemId(String(next.id));
            }
        } catch (err) {
            toast.error('Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleNextRound = async () => {
         if (!jobId || redirected) return;
         setRedirected(true);

        try {
            const r = await getRounds(jobId);
            const rounds = Array.isArray(r?.data) ? r.data : [];
            const next = getNextRoundAfter(rounds, 'DSA');
            if (next) {
                // Continue to next round - don't stop proctoring
                navigate(getNavigatePathForRound(jobId, next), { replace: true });
                return;
            }
        } catch {}
        
        // No more rounds - stop proctoring and generate summary
        if (proctoringSessionId) {
            try { 
                await proctoringService.endSession(proctoringSessionId); 
                sessionStorage.removeItem('proctoring_session_id');
            } catch (e) { console.error('Failed to end proctoring session:', e); }
        }
        stopProctoring();
        navigate('/applications', { replace: true });
    };

    // Automatically handle end
    useEffect(() => {
        if (finalResult && !redirected) {
             // In a real app we might show a summary modal first, 
            // but for now we can redirect or just let user click 'Continue'
            // Added a manual button for clarity in this design
        }
    }, [finalResult, redirected]);


    // -- Anticheat Enforcements --
    useEffect(() => {
        if (!examStarted || finalResult || !proctoringSessionId || !handleSubmit.current) return;

        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                if(proctoringSessionId) sendBrowserEvent('TAB_SWITCH', {});
                // Stop proctoring and generate summary on tab switch
                proctoringService.endSession(proctoringSessionId).catch(e => console.error(e));
                sessionStorage.removeItem('proctoring_session_id');
                stopProctoring();
                toast.error('Tab switching detected. Exam locked.');
                handleSubmit.current(); // Enforce submit
            }
        };

        const onBlur = () => {
            if(proctoringSessionId) sendBrowserEvent('WINDOW_BLUR', { reason: 'blur' });
            toast.error('Window blur detected!');
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('blur', onBlur);

        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('blur', onBlur);
        };
    }, [examStarted, finalResult, proctoringSessionId]); // handleSubmit is a ref, so stable

    // -- Render --
    if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white font-mono animate-pulse">Loading Assessment Environment...</div>;
    
    if (finalResult) {
        return (
            <div className="h-screen bg-black flex flex-col items-center justify-center text-white space-y-6">
                <div className="p-4 rounded-full bg-emerald-500/20 text-emerald-400 mb-2">
                    <CheckCircle2 size={64} />
                </div>
                <h2 className="text-3xl font-bold">Assessment Complete</h2>
                <p className="text-zinc-400">Your solutions have been submitted successfully.</p>
                <div className="flex gap-4">
                    <button 
                        onClick={handleNextRound}
                        className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-500 font-bold transition"
                    >
                        Continue Application
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
            {/* Proctoring Consent Overlay */}
            {showConsent && (
                <ProctoringConsent 
                    onAccept={async () => {
                        setShowConsent(false);
                        sessionStorage.setItem('proctoring_consent', 'true');
                        try {
                            const session = await proctoringService.startSession(jobId, 'DSA', attemptId);
                            setProctoringSessionId(session.id);
                            await startProctoring(session.id);
                        } catch(e) {}
                    }} 
                    onDecline={() => setShowConsent(false)}
                />
            )}

            {/* Header */}
            <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-[#0a0a0a] z-10 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="text-sm font-bold tracking-wider text-muted-foreground">DSA ROUND</div>
                         {/* Problem Tabs */}
                        <div className="flex items-center gap-0.5 ml-4">
                            {problems.map((p, idx) => {
                                const isActive = String(p.id) === String(activeProblemId);
                                const isDone = submittedProblemIds.includes(String(p.id));
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => setActiveProblemId(String(p.id))}
                                        className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                                            isActive 
                                            ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/20' 
                                            : isDone
                                                ? 'text-emerald-500 hover:bg-emerald-900/10'
                                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                        }`}
                                    >
                                        P{idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                     {/* Timer */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded border border-zinc-800 text-zinc-300 font-mono text-sm shadow-inner">
                        <Clock size={14} className="text-zinc-500" />
                        {timeLeftLabel}
                    </div>

                    {/* Submit All */}
                    <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded text-sm font-bold transition-all shadow-lg shadow-red-900/20 hover:shadow-red-600/20">
                        Submit All
                    </button>
                    
                    {/* Proctoring Indicator */}
                    {isProctoring && <div className="scale-75 origin-right"><RecordingIndicator /></div>}
                </div>
            </header>

            {/* Main Content - Split View */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left Panel: Problem Statement */}
                <div className="w-5/12 border-r border-white/10 flex flex-col bg-[#050505] min-w-[350px]">
                    {activeProblem ? (
                        <>
                            {/* Problem Header */}
                            <div className="p-6 pb-2">
                                <div className="flex items-center gap-3 mb-4">
                                    <h1 className="text-2xl font-bold text-white tracking-tight leading-none">{activeProblem.title || `Problem ${problems.findIndex(p => String(p.id) === String(activeProblemId)) + 1}`}</h1>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-widest">
                                        Easy
                                    </span>
                                </div>
                                <div className="text-sm text-zinc-500 line-clamp-2 hidden">
                                    Topic tags or short summary could go here.
                                </div>
                            </div>

                            {/* Section Tabs */}
                            <div className="flex items-center gap-6 px-6 border-b border-white/5 text-[11px] font-bold tracking-wider text-zinc-500 uppercase sticky top-0 bg-[#050505] z-10">
                                <button className="py-3 text-white border-b-2 border-white transition-colors">PROBLEM</button>
                                <button className="py-3 hover:text-zinc-300 transition-colors">SUBMISSIONS</button>
                                <button className="py-3 hover:text-zinc-300 transition-colors">DISCUSS</button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent space-y-8">
                                <section>
                                    <h3 className="text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider hidden">Description</h3>
                                    <div className="text-zinc-300 text-sm leading-7 selection:bg-blue-500/30 whitespace-pre-wrap font-sans">
                                        {activeProblem.problem_statement || "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice."}
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider">Constraints</h3>
                                    <div className="bg-zinc-900/30 p-4 rounded-lg border border-white/5 font-mono text-xs text-zinc-400 space-y-2">
                                        {(activeProblem.constraints || ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9']).map((c, i) => (
                                            <div key={i} className="flex gap-2">
                                                <span className="text-zinc-600 select-none">•</span>
                                                <span>{c}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider">Sample</h3>
                                    <div className="bg-zinc-900/30 p-4 rounded-lg border border-white/5 font-mono text-xs space-y-4">
                                        {activeProblem.public_test_cases && activeProblem.public_test_cases.length > 0 ? (
                                            activeProblem.public_test_cases.slice(0, 1).map((tc, idx) => (
                                                <React.Fragment key={idx}>
                                                    <div>
                                                        <div className="text-zinc-500 mb-1.5 font-bold uppercase text-[10px] tracking-wider">Input</div>
                                                        <div className="text-zinc-300 bg-black/20 p-2 rounded border border-white/5 whitespace-pre-wrap">{tc.input}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-zinc-500 mb-1.5 font-bold uppercase text-[10px] tracking-wider">Output</div>
                                                        <div className="text-zinc-300 bg-black/20 p-2 rounded border border-white/5 whitespace-pre-wrap">{tc.expected_output}</div>
                                                    </div>
                                                </React.Fragment>
                                            ))
                                        ) : (
                                            <>
                                                <div>
                                                    <div className="text-zinc-500 mb-1.5 font-bold uppercase text-[10px] tracking-wider">Input</div>
                                                    <div className="text-zinc-300 bg-black/20 p-2 rounded border border-white/5">nums = [2,7,11,15], target = 9</div>
                                                </div>
                                                <div>
                                                    <div className="text-zinc-500 mb-1.5 font-bold uppercase text-[10px] tracking-wider">Output</div>
                                                    <div className="text-zinc-300 bg-black/20 p-2 rounded border border-white/5">[0,1]</div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-4">
                            <div className="p-4 rounded-full bg-zinc-900">
                                <FileCode size={32} />
                            </div>
                            <p>Select a problem from the top bar to begin</p>
                        </div>
                    )}
                </div>

                {/* Right Panel: Editor */}
                <div className="flex-1 flex flex-col bg-[#0a0a0a] relative min-w-[400px]">
                    {/* Editor Header */}
                    <div className="h-10 flex items-center justify-between px-4 border-b border-white/5 bg-[#0a0a0a] shrink-0">
                        <div className="flex items-center gap-2">
                             <div className="flex items-center gap-2 px-2 py-1 bg-zinc-900 rounded text-xs text-zinc-300 border border-white/5 cursor-pointer hover:border-zinc-700 transition-colors">
                                <FileCode size={12} className="text-blue-500" />
                                <span className="font-mono font-medium">C++ (GNU C++17)</span>
                             </div>
                        </div>
                        <div className="flex items-center gap-3 text-zinc-500">
                             <div className="hover:text-white cursor-pointer transition-colors p-1 rounded hover:bg-white/5">
                                <Settings size={14} />
                             </div>
                             <div className="hover:text-white cursor-pointer transition-colors p-1 rounded hover:bg-white/5">
                                 <Maximize2 size={14} className={fullscreenLocked ? 'text-zinc-700' : ''} />
                             </div>
                        </div>
                    </div>

                    {/* Monaco Editor */}
                    <div className="flex-1 relative overflow-hidden">
                        {activeProblemId && (
                            <Editor
                                key={activeProblemId}
                                height="100%"
                                language="cpp"
                                theme="vs-dark"
                                value={currentCode}
                                onChange={handleCodeChange}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    lineNumbers: 'on',
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    padding: { top: 16 },
                                    fontFamily: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
                                    fontLigatures: true,
                                    readOnly: editorReadOnly,
                                    renderLineHighlight: 'line',
                                    cursorBlinking: 'smooth',
                                    cursorSmoothCaretAnimation: true,
                                }}
                            />
                        )}
                        
                        {/* Console / Output Drawer */}
                        {showConsole && (
                            <div className="absolute bottom-0 left-0 right-0 h-1/2 min-h-[150px] max-h-[80%] bg-[#0a0a0a] border-t border-white/10 flex flex-col z-20 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-200">
                                <div className="h-9 shrink-0 flex items-center justify-between px-4 bg-zinc-900 border-b border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Terminal size={12} className="text-zinc-400" />
                                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Data Output</span>
                                    </div>
                                    <button onClick={() => setShowConsole(false)} className="text-zinc-500 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"><Minimize2 size={14}/></button>
                                </div>
                                <div className="flex-1 p-4 font-mono text-xs overflow-auto text-zinc-300 whitespace-pre-wrap bg-[#0c0c0c]">
                                    {running && (
                                        <div className="flex items-center gap-2 text-yellow-500">
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-500"></div>
                                            Running Code...
                                        </div>
                                    )}
                                    {!running && runResult && runResult.results && (
                                        <div className="space-y-4">
                                            {runResult.results.map((res, idx) => (
                                                <div key={idx} className="p-3 bg-zinc-900 rounded border border-white/5">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <span className="font-bold text-zinc-300">Test Case {res.test_order || idx + 1}</span>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${res.passed || res.status === 'Accepted' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'}`}>
                                                            {res.status || (res.passed ? 'Passed' : 'Failed')}
                                                        </span>
                                                        {res.time && <span className="text-[10px] text-zinc-500">{res.time}s</span>}
                                                    </div>
                                                    
                                                    {res.compile_output && (
                                                        <div className="mb-3">
                                                            <div className="text-red-400/70 uppercase text-[10px] font-bold mb-1">Compilation Output</div>
                                                            <div className="text-red-400 pl-2 border-l-2 border-red-900/50 text-[11px] whitespace-pre-wrap">{res.compile_output}</div>
                                                        </div>
                                                    )}
                                                    
                                                    {res.stdout && (
                                                        <div className="mb-3">
                                                            <div className="text-zinc-500 uppercase text-[10px] font-bold mb-1">Standard Output</div>
                                                            <div className="text-white/90 font-medium pl-2 border-l-2 border-zinc-700 text-[11px] whitespace-pre-wrap">{res.stdout}</div>
                                                        </div>
                                                    )}
                                                    
                                                    {res.stderr && (
                                                        <div className="mb-3">
                                                            <div className="text-red-400/70 uppercase text-[10px] font-bold mb-1">Standard Error</div>
                                                            <div className="text-red-400 pl-2 border-l-2 border-red-900/50 text-[11px] whitespace-pre-wrap">{res.stderr}</div>
                                                        </div>
                                                    )}

                                                    {!res.stdout && !res.stderr && !res.compile_output && (
                                                        <div className="text-zinc-600 italic text-[11px]">No output generated for this test case.</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Editor Footer */}
                    <div className="h-14 shrink-0 border-t border-white/10 flex items-center justify-between px-4 bg-[#0a0a0a]">
                        <button 
                            onClick={() => setShowConsole(!showConsole)}
                            className={`flex items-center gap-2 text-xs font-medium transition-colors px-3 py-1.5 rounded hover:bg-white/5 ${showConsole ? 'text-white bg-white/5' : 'text-zinc-500'}`}
                        >
                            <Terminal size={14} />
                            Console
                        </button>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={handleRun}
                                disabled={running || submitting}
                                className="flex items-center gap-2 px-5 py-2 rounded bg-zinc-800 text-white text-sm font-semibold hover:bg-zinc-700 active:scale-95 transition-all border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                <Play size={14} className={`fill-current opacity-70 group-hover:opacity-100 transition-opacity ${running ? 'animate-pulse' : ''}`} />
                                {running ? 'Running...' : 'Run Code'}
                            </button>

                            <button
                                onClick={() => handleSubmit.current()}
                                disabled={submitting || isSubmitted}
                                className={`flex items-center gap-2 px-5 py-2 rounded text-white text-sm font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    isSubmitted 
                                    ? 'bg-emerald-600/50 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20 group'
                                }`}
                            >
                                {isSubmitted ? (
                                    <>
                                        <CheckCircle2 size={16} /> Submitted
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" /> 
                                        {submitting ? 'Submitting...' : 'Submit'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CandidateDsaRound;