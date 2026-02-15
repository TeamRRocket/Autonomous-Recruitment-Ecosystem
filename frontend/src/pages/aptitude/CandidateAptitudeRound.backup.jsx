import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { startAptitudeRound, submitAptitudeRound } from '../../services/aptitudeService';
import { getRounds } from '../../services/roundService';

const pad2 = (n) => n.toString().padStart(2, '0');

const CandidateAptitudeRound = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
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
    if (!jobId) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await startAptitudeRound(jobId);
        setAttemptId(res.data.attemptId);
        setDurationMinutes(res.data.durationMinutes);
        setEndsAt(res.data.endsAt);
        setQuestions(res.data.questions || []);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to start Aptitude round');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [jobId]);

  useEffect(() => {
    if (!result) return;
    if (redirected) return;
    setRedirected(true);

    if (!jobId) {
      navigate('/applications', { replace: true });
      return;
    }

    const go = async () => {
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

    go();
  }, [result, redirected, navigate, jobId]);

  useEffect(() => {
    try {
      if (document?.fullscreenElement == null && document?.documentElement?.requestFullscreen) {
        const p = document.documentElement.requestFullscreen();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      }
    } catch {
      // ignore
    }
  }, []);

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

  useEffect(() => {
    if (!endsAt) return;

    const t = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => clearInterval(t);
  }, [endsAt]);

  useEffect(() => {
    if (!attemptId) return;
    if (!endsAt) return;
    if (result) return;
    if (autoSubmitted) return;

    const end = new Date(endsAt).getTime();
    if (Date.now() <= end) return;

    setAutoSubmitted(true);

    // Auto-submit on client when timer hits 0 (backend is still authoritative).
    const auto = async () => {
      try {
        setSubmitting(true);
        const answers = Object.entries(selectedByQuestion).map(([questionId, selected]) => ({ questionId, selected }));
        const res = await submitAptitudeRound({ attemptId, answers });
        setResult(res.data);
        toast.success('Aptitude round submitted');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Auto-submit failed');
      } finally {
        setSubmitting(false);
      }
    };

    auto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, endsAt, result, nowTick, autoSubmitted]);

  useEffect(() => {
    if (!attemptId) return;
    if (result) return;
    if (autoSubmitted) return;

    const submitOnce = async () => {
      if (autoSubmitted) return;
      setAutoSubmitted(true);
      try {
        setSubmitting(true);
        const answers = Object.entries(selectedByQuestion).map(([questionId, selected]) => ({ questionId, selected }));
        const res = await submitAptitudeRound({ attemptId, answers });
        setResult(res.data);
        toast.success('Aptitude round submitted');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Auto-submit failed');
      } finally {
        setSubmitting(false);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') submitOnce();
    };
    const onBlur = () => submitOnce();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
    };
  }, [attemptId, result, autoSubmitted, selectedByQuestion]);

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

  if (loading) {
    return <div className="p-8 text-center text-slate-300">Loading Aptitude round...</div>;
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
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Aptitude Round</h1>
            <p className="text-sm text-slate-400">Attempt: {attemptId}</p>
            {durationMinutes != null && <p className="text-sm text-slate-400">Duration: {durationMinutes} minutes</p>}
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
                            className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                              active
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
            className={`px-5 py-2 rounded-lg font-semibold ${
              submitting || readOnly
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
