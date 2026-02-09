import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getCodingProblemForCandidate, runCoding, submitCoding } from '../../services/codingService';

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

const CandidateCodingRound = () => {
  const { roundId } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sourceCode, setSourceCode] = useState(DEFAULT_CPP_TEMPLATE);
  const [stdin, setStdin] = useState('');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  const [leftTab, setLeftTab] = useState('description');
  const [bottomTab, setBottomTab] = useState('testcase');

  const languageLabel = useMemo(() => problem?.language?.name || 'C++ (GNU++17)', [problem]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getCodingProblemForCandidate(roundId);
        setProblem(res.data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load coding problem');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [roundId]);

  const handleRun = async () => {
    if (!sourceCode.trim()) {
      toast.error('Code is empty');
      return;
    }

    setRunning(true);
    setRunResult(null);
    setBottomTab('result');
    try {
      const res = await runCoding(roundId, sourceCode, stdin);
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
    if (!sourceCode.trim()) {
      toast.error('Code is empty');
      return;
    }

    setSubmitting(true);
    setSubmitResult(null);
    setBottomTab('result');
    try {
      const res = await submitCoding(roundId, sourceCode);
      setSubmitResult(res.data);
      toast.success(`Submission: ${res.data.status}`);
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
    return <div className="p-8 text-slate-400">Loading...</div>;
  }

  if (!problem) {
    return <div className="p-8 text-slate-400">Problem not available.</div>;
  }

  return (
    <div className="w-full h-[calc(100vh-96px)] min-h-[720px] px-3 sm:px-4 lg:px-6 py-4">
      <div className="h-full rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="h-12 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/30">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-semibold text-slate-400">DSA Round</span>
            <span className="text-slate-600">/</span>
            <h1 className="text-sm sm:text-base font-semibold text-slate-100 truncate">{problem.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-slate-300">
              {languageLabel}
            </span>
          </div>
        </div>

        <div className="h-[calc(100%-3rem)] grid grid-cols-1 lg:grid-cols-2">
          <div className="min-h-0 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/20">
            <div className="h-11 flex items-center gap-1 px-3 border-b border-slate-800">
              <button
                onClick={() => setLeftTab('description')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  leftTab === 'description' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setLeftTab('constraints')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  leftTab === 'constraints' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Constraints
              </button>
              <button
                onClick={() => setLeftTab('samples')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  leftTab === 'samples' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Samples
              </button>
            </div>

            <div className="h-[calc(100%-2.75rem)] overflow-auto p-4">
              {leftTab === 'description' && (
                <div className="space-y-4">
                  <pre className="whitespace-pre-wrap text-sm text-slate-200 leading-relaxed">{problem.statement}</pre>
                </div>
              )}

              {leftTab === 'constraints' && (
                <div className="space-y-4">
                  {problem.constraints ? (
                    <pre className="whitespace-pre-wrap text-sm text-slate-200 leading-relaxed">{problem.constraints}</pre>
                  ) : (
                    <p className="text-sm text-slate-400">No constraints provided.</p>
                  )}
                </div>
              )}

              {leftTab === 'samples' && (
                <div className="space-y-4">
                  {(problem.sample_input || problem.sample_output) ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Sample Input</h3>
                        <pre className="text-sm text-slate-200 whitespace-pre-wrap">{problem.sample_input || ''}</pre>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Sample Output</h3>
                        <pre className="text-sm text-slate-200 whitespace-pre-wrap">{problem.sample_output || ''}</pre>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No samples provided.</p>
                  )}

                  {problem.samples?.length > 0 && (
                    <div className="space-y-3">
                      {problem.samples.map((tc, index) => (
                        <div key={tc.id || index} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                          <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Sample #{index + 1}</p>
                          <div className="mt-3">
                            <p className="text-xs text-slate-400 mb-1">Input</p>
                            <pre className="text-xs text-slate-100 whitespace-pre-wrap">{tc.input}</pre>
                          </div>
                          <div className="mt-3">
                            <p className="text-xs text-slate-400 mb-1">Expected Output</p>
                            <pre className="text-xs text-slate-100 whitespace-pre-wrap">{tc.expected_output}</pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="min-h-0 bg-slate-950/10">
            <div className="h-full grid grid-rows-[1fr_260px_56px]">
              <div className="min-h-0 border-b border-slate-800 p-3">
                <textarea
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                  className="w-full h-full rounded-xl bg-slate-950/60 border border-slate-800 p-3 text-xs font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  spellCheck={false}
                />
              </div>

              <div className="min-h-0 border-b border-slate-800 bg-slate-950/20">
                <div className="h-11 flex items-center justify-between px-3 border-b border-slate-800">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setBottomTab('testcase')}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                        bottomTab === 'testcase' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Testcase
                    </button>
                    <button
                      onClick={() => setBottomTab('result')}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                        bottomTab === 'result' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Result
                    </button>
                  </div>
                  <div className="text-xs text-slate-500">
                    {submitResult ? `Verdict: ${submitResult.status}` : (runResult ? `Status: ${runResult.status}` : '')}
                  </div>
                </div>

                <div className="h-[calc(100%-2.75rem)] overflow-auto p-3">
                  {bottomTab === 'testcase' && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Custom Input</p>
                      <textarea
                        value={stdin}
                        onChange={(e) => setStdin(e.target.value)}
                        className="w-full h-40 rounded-xl bg-slate-950/60 border border-slate-800 p-3 text-xs font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        spellCheck={false}
                      />
                      <p className="text-[11px] text-slate-500 mt-2">Provide stdin input exactly as the program expects.</p>
                    </div>
                  )}

                  {bottomTab === 'result' && (
                    <div className="space-y-3">
                      {Array.isArray(runResult?.results) && runResult.results.length > 0 && (
                        <div className="space-y-2">
                          {runResult.results.map((tc, idx) => (
                            <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-xs text-slate-400 uppercase tracking-widest">
                                  Test #{tc.test_order ?? idx + 1}
                                </p>
                                <span
                                  className={`text-xs font-semibold ${
                                    tc.passed ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  {tc.status}
                                </span>
                              </div>

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
                      )}

                      {(!Array.isArray(runResult?.results) || runResult.results.length === 0) && runResult?.compile_output && (
                        <pre className="text-xs text-rose-300 whitespace-pre-wrap">{runResult.compile_output}</pre>
                      )}
                      {(!Array.isArray(runResult?.results) || runResult.results.length === 0) && runResult?.stderr && (
                        <pre className="text-xs text-amber-300 whitespace-pre-wrap">{runResult.stderr}</pre>
                      )}
                      {(!Array.isArray(runResult?.results) || runResult.results.length === 0) && runResult?.stdout && (
                        <pre className="text-xs text-emerald-200 whitespace-pre-wrap">{runResult.stdout}</pre>
                      )}

                      {submitResult?.compile_output && (
                        <pre className="text-xs text-rose-300 whitespace-pre-wrap">{submitResult.compile_output}</pre>
                      )}
                      {submitResult?.stderr && (
                        <pre className="text-xs text-amber-300 whitespace-pre-wrap">{submitResult.stderr}</pre>
                      )}
                      {submitResult?.stdout && (
                        <pre className="text-xs text-emerald-200 whitespace-pre-wrap">{submitResult.stdout}</pre>
                      )}

                      {!runResult && !submitResult && (
                        <p className="text-sm text-slate-400">Run your code to see output here.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="h-14 flex items-center justify-between px-3 bg-slate-950/30">
                <div className="text-xs text-slate-500">
                  {submitResult ? `Passed: ${submitResult.passed_tests}/${submitResult.total_tests}` : ''}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRun}
                    disabled={running}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-semibold disabled:opacity-50"
                  >
                    {running ? 'Running…' : 'Run'}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    {submitting ? 'Submitting…' : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateCodingRound;
