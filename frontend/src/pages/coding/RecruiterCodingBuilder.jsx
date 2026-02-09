import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getMyJobs } from '../../services/jobService';
import { getRounds } from '../../services/roundService';
import { upsertCodingProblem } from '../../services/codingService';

const emptyTestCase = () => ({ input: '', expected_output: '', is_sample: false });

const RecruiterCodingBuilder = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState('');

  const [form, setForm] = useState({
    title: '',
    statement: '',
    constraints: '',
    input_format: '',
    output_format: '',
    sample_input: '',
    sample_output: '',
    time_limit_seconds: 2,
    memory_limit_mb: 256,
  });

  const [testCases, setTestCases] = useState([emptyTestCase()]);
  const [saving, setSaving] = useState(false);
  const codingRounds = useMemo(() => rounds.filter((r) => r.round_type === 'CODING'), [rounds]);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await getMyJobs();
        setJobs(res.data || []);
      } catch {
        toast.error('Failed to load jobs');
      }
    };
    loadJobs();
  }, []);

  useEffect(() => {
    const loadRounds = async () => {
      if (!selectedJob) {
        setRounds([]);
        setSelectedRound('');
        return;
      }
      try {
        const res = await getRounds(selectedJob);
        setRounds(res.data || []);
        setSelectedRound('');
      } catch {
        toast.error('Failed to load rounds');
      }
    };
    loadRounds();
  }, [selectedJob]);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const updateTestCase = (idx, key, value) => {
    setTestCases((prev) => prev.map((tc, i) => (i === idx ? { ...tc, [key]: value } : tc)));
  };

  const addTestCase = () => setTestCases((prev) => [...prev, emptyTestCase()]);

  const removeTestCase = (idx) => {
    setTestCases((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!selectedRound) {
      toast.error('Select a CODING round first');
      return;
    }

    const cleaned = testCases
      .map((tc) => ({
        input: tc.input,
        expected_output: tc.expected_output,
        is_sample: !!tc.is_sample,
      }))
      .filter((tc) => tc.input.trim() && tc.expected_output.trim());

    if (cleaned.length === 0) {
      toast.error('Add at least one valid test case');
      return;
    }

    setSaving(true);
    try {
      await upsertCodingProblem(selectedRound, {
        ...form,
        test_cases: cleaned,
      });
      toast.success('DSA problem saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save problem');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Recruiter Tools</p>
        <h1 className="text-3xl font-bold text-white mt-2">DSA Round Builder</h1>
        <p className="text-slate-400 mt-2">Attach a coding problem to a CODING round and define test cases.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-3">Select Job & Round</h2>
          <div className="space-y-3">
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100"
            >
              <option value="">Select a job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>

            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100"
              disabled={!selectedJob}
            >
              <option value="">Select a CODING round</option>
              {codingRounds.map((round) => (
                <option key={round.id} value={round.id}>{round.round_name}</option>
              ))}
            </select>

            {selectedJob && codingRounds.length === 0 && (
              <p className="text-xs text-amber-300">No CODING round found for this job. Add a DSA round in job rounds first.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-3">Problem Details</h2>
          <div className="space-y-3">
            <input
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Problem title"
              className="w-full bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100"
            />
            <textarea
              value={form.statement}
              onChange={(e) => updateField('statement', e.target.value)}
              placeholder="Problem statement"
              className="w-full h-40 bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">Test Cases</h2>
        <p className="text-xs text-slate-500">Mark a testcase as sample to show it to candidates. Others are hidden.</p>

        <div className="space-y-4">
          {testCases.map((tc, idx) => (
            <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 font-semibold">Test Case #{idx + 1}</p>
                <button
                  onClick={() => removeTestCase(idx)}
                  disabled={testCases.length === 1}
                  className="text-xs text-rose-300 disabled:opacity-40"
                >
                  Remove
                </button>
              </div>

              <textarea
                value={tc.input}
                onChange={(e) => updateTestCase(idx, 'input', e.target.value)}
                placeholder="Input"
                className="w-full h-20 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100"
              />
              <textarea
                value={tc.expected_output}
                onChange={(e) => updateTestCase(idx, 'expected_output', e.target.value)}
                placeholder="Expected Output"
                className="w-full h-20 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100"
              />

              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={!!tc.is_sample}
                  onChange={(e) => updateTestCase(idx, 'is_sample', e.target.checked)}
                />
                Sample (visible to candidate)
              </label>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-between pt-2">
          <button
            onClick={addTestCase}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-semibold"
          >
            Add Test Case
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Problem'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecruiterCodingBuilder;
