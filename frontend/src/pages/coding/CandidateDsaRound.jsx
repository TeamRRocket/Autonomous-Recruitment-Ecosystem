import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Editor from '@monaco-editor/react';
import { getDsaResult, getDsaStatus, runDsa, saveDsaDraft, startDsaRound, submitDsa } from '../../services/dsaService';

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

  const [loading, setLoading] = useState(true);
  const [attemptId, setAttemptId] = useState(null);
  const [status, setStatus] = useState(null);
  const [endsAt, setEndsAt] = useState(null);
  const [serverTime, setServerTime] = useState(null);
  const [problems, setProblems] = useState([]);
  const [activeProblemId, setActiveProblemId] = useState(null);
  const [stdin, setStdin] = useState('');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [finalResult, setFinalResult] = useState(null);

  const [antiCheatEvents, setAntiCheatEvents] = useState([]);

  const [codeByProblem, setCodeByProblem] = useState({});

  const saveTimerRef = useRef(null);
  const lastSavedRef = useRef({});

  const activeProblem = useMemo(
    () => problems.find((p) => p.id === activeProblemId) || null,
    [problems, activeProblemId]
  );

  const editorReadOnly = status === 'SUBMITTED' || status === 'EXPIRED';

  const timeLeftMs = useMemo(() => {
    if (!endsAt) return 0;
    const end = new Date(endsAt).getTime();
    return Math.max(0, end - Date.now());
  }, [endsAt, serverTime]);

  const timeLeftLabel = useMemo(() => {
    const totalSeconds = Math.floor(timeLeftMs / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
  }, [timeLeftMs]);

  const currentCode = useMemo(() => {
    if (!activeProblemId) return DEFAULT_CPP_TEMPLATE;
    return codeByProblem[activeProblemId] ?? activeProblem?.boilerplate_cpp ?? DEFAULT_CPP_TEMPLATE;
  }, [activeProblemId, codeByProblem, activeProblem]);

  const setCurrentCode = (next) => {
    if (!activeProblemId) return;
    setCodeByProblem((prev) => ({ ...prev, [activeProblemId]: next }));
  };

  const pushAntiCheatEvent = (event_type) => {
    setAntiCheatEvents((prev) => [...prev, { event_type, ts: Date.now() }]);
  };

  useEffect(() => {
    const onVisibilityChange = () => {
      pushAntiCheatEvent(document.hidden ? 'VISIBILITY_HIDDEN' : 'VISIBILITY_VISIBLE');
    };
    const onBlur = () => pushAntiCheatEvent('WINDOW_BLUR');
    const onFocus = () => pushAntiCheatEvent('WINDOW_FOCUS');

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const scheduleSave = (problemId, source) => {
    if (!attemptId || !problemId) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      try {
        const last = lastSavedRef.current[problemId];
        if (last === source) return;
        await saveDsaDraft({ job_id: jobId, attempt_id: attemptId, problem_id: problemId, source_code: source });
        lastSavedRef.current[problemId] = source;
      } catch {
        // Autosave failures should not block the candidate.
      }
    }, 900);
  };

  const load = async () => {
    setLoading(true);
    try {
      const startRes = await startDsaRound(jobId);
      setAttemptId(startRes.data.attempt_id);
      setStatus(startRes.data.status);
      setEndsAt(startRes.data.ends_at);
      setServerTime(startRes.data.server_time);
      setProblems(startRes.data.problems || []);
      setActiveProblemId((startRes.data.problems || [])?.[0]?.id || null);

      const initialCode = {};
      for (const p of startRes.data.problems || []) {
        const local = localStorage.getItem(`dsa:draft:${jobId}:${p.id}`);
        initialCode[p.id] = local || p.boilerplate_cpp || DEFAULT_CPP_TEMPLATE;
      }
      setCodeByProblem(initialCode);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start DSA round');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;

    const timer = setInterval(async () => {
      try {
        const st = await getDsaStatus(jobId);
        setStatus(st.data.status);
        setEndsAt(st.data.ends_at);
        setServerTime(st.data.server_time);

        if (st.data.status === 'SUBMITTED') {
          const res = await getDsaResult(jobId);
          setFinalResult(res.data);
        }
      } catch {
        // Ignore transient polling errors.
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [jobId]);

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
      const res = await runDsa({ job_id: jobId, attempt_id: attemptId, problem_id: activeProblemId, source_code, stdin });
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
    if (!attemptId) return;

    const solutions = problems.map((p) => ({
      problem_id: p.id,
      source_code: codeByProblem[p.id] || p.boilerplate_cpp || DEFAULT_CPP_TEMPLATE,
    }));

    setSubmitting(true);
    try {
      const res = await submitDsa({ job_id: jobId, attempt_id: attemptId, solutions, anti_cheat_events: antiCheatEvents });
      setFinalResult(res.data);
      toast.success('DSA round submitted');
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

  if (loading) {
    return <div className="p-8 text-slate-400">Loading DSA round...</div>;
  }

  if (!problems.length) {
    return <div className="p-8 text-slate-400">DSA round not available.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-start justify-between gap-4">
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

          {activeProblem && (
            <div className="mt-6 space-y-4">
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
            <div className="mt-6">
              <p className="text-sm text-slate-400">Select a problem from the right panel to begin.</p>
            </div>
          )}
        </div>

        <div className="w-full lg:w-[520px] space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-200">Problems</h2>
              {timeLeftMs > 0 && !editorReadOnly && (
                <span className="text-xs font-semibold rounded-full border border-amber-600 bg-amber-900 px-3 py-1 text-amber-300">
                  {timeLeftLabel}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {problems.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveProblemId(p.id)}
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    p.id === activeProblemId
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {p.problem_order}. {p.title}
                </button>
              ))}
            </div>
          </div>

          {activeProblem && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
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
                    {submitting ? 'Submitting…' : 'Submit'}
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <Editor
                  height="320"
                  language="cpp"
                  theme="vs-dark"
                  value={currentCode}
                  onChange={(value) => setCurrentCode(value)}
                  options={{
                    readOnly: editorReadOnly,
                    minimap: { enabled: false },
                    fontSize: 13,
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>

              <div className="mt-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Custom Input (stdin)</h3>
                <textarea
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
                {runResult.results.map((tc, i) => (
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
                {finalResult.per_problem.map((p, i) => (
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
  );
};

export default CandidateDsaRound;
