import React, { useEffect, useState } from 'react';
import { getMyJobs } from '../services/jobService';
import { rankCandidates } from '../services/recruiter.api';
import ResumeScoreCard from '../components/ResumeScoreCard';
import toast from 'react-hot-toast';

const RecruiterJobRanking = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [rankingData, setRankingData] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [ranking, setRanking] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await getMyJobs();
        setJobs(res.data || []);
      } catch (error) {
        toast.error('Failed to load jobs');
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchJobs();
  }, []);

  const handleRank = async () => {
    if (!selectedJob) {
      toast.error('Select a job first');
      return;
    }

    setRanking(true);
    try {
      const res = await rankCandidates(selectedJob);
      setRankingData(res.data);
      toast.success('Candidates ranked');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Ranking failed');
    } finally {
      setRanking(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Recruiter Intelligence</p>
          <h1 className="text-3xl font-bold text-white mt-2">Rank Candidates</h1>
          <p className="text-slate-400 mt-2">Analyze applicants with AI scoring and explainable insights.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <select
            className="bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            value={selectedJob}
            onChange={(event) => setSelectedJob(event.target.value)}
            disabled={loadingJobs}
          >
            <option value="">Select a job</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
          <button
            onClick={handleRank}
            disabled={ranking || loadingJobs}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg transition disabled:opacity-50"
          >
            {ranking ? 'Ranking...' : 'Rank Candidates'}
          </button>
        </div>
      </div>

      {rankingData?.ranked_candidates?.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-slate-400">
          No candidates found for this job yet.
        </div>
      )}

      <div className="grid gap-6">
        {(rankingData?.ranked_candidates || []).map((candidate, index) => (
          <ResumeScoreCard key={candidate.candidate_id} candidate={candidate} index={index} />
        ))}
      </div>
    </div>
  );
};

export default RecruiterJobRanking;
