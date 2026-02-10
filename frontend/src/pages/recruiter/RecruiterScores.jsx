import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getMyJobs } from '../../services/jobService';
import { getJobScores } from '../../services/jobScoresService';

const RecruiterScores = () => {
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState('');

  const [scores, setScores] = useState(null);
  const [loadingScores, setLoadingScores] = useState(false);

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

  const candidates = useMemo(() => scores?.candidates || [], [scores]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Recruiter</p>
          <h1 className="text-3xl font-bold text-white mt-2">Candidate Scores</h1>
          <p className="text-slate-400 mt-2">View round-wise scores as candidates submit assessments.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <select
            className="bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
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
        </div>
      </div>

      {loadingScores && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-slate-400">Loading scores...</div>
      )}

      {!loadingScores && selectedJobId && candidates.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-slate-400">No candidates found for this job yet.</div>
      )}

      {!loadingScores && candidates.length > 0 && (
        <div className="space-y-3">
          {candidates.map((row) => (
            <div key={row.candidate.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-white font-semibold text-lg">{row.candidate.name}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">{row.application.status}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2">
                    <p className="text-xs text-slate-500">Resume</p>
                    <p className="text-white font-semibold">{row.scores.resume.score ?? '--'}</p>
                  </div>
                  <div className="bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2">
                    <p className="text-xs text-slate-500">Aptitude</p>
                    <p className="text-white font-semibold">
                      {row.scores.aptitude.correct != null && row.scores.aptitude.total != null
                        ? `${row.scores.aptitude.correct}/${row.scores.aptitude.total}`
                        : (row.scores.aptitude.score ?? '--')}
                      {row.scores.aptitude.percent != null ? ` (${row.scores.aptitude.percent}%)` : ''}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{row.scores.aptitude.status}</p>
                  </div>
                  <div className="bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2">
                    <p className="text-xs text-slate-500">DSA</p>
                    <p className="text-white font-semibold">{row.scores.dsa.score ?? '--'}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{row.scores.dsa.status}</p>
                  </div>
                  <div className="bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2">
                    <p className="text-xs text-slate-500">Coding</p>
                    <p className="text-white font-semibold">
                      {row.scores.coding.avg_score_percent ?? '--'}
                      {row.scores.coding.avg_score_percent != null ? '%' : ''}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{(row.scores.coding.rounds || []).length} rounds</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecruiterScores;
