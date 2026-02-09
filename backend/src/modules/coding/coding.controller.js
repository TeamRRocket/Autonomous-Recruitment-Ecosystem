import catchAsync from '../../utils/catchAsync.js';
import * as codingService from './coding.service.js';

export const upsertProblem = catchAsync(async (req, res) => {
  const data = await codingService.upsertProblem(req.params.roundId, req.user.id, req.body);
  res.status(201).json({ status: 'success', data });
});

export const getProblemForRecruiter = catchAsync(async (req, res) => {
  const data = await codingService.getProblemForRecruiter(req.params.roundId, req.user.id);
  res.json({ status: 'success', data });
});

export const getProblemForCandidate = catchAsync(async (req, res) => {
  const data = await codingService.getProblemForCandidate(req.params.roundId);
  res.json({ status: 'success', data });
});

export const runCode = catchAsync(async (req, res) => {
  const { source_code, stdin } = req.body;
  const data = await codingService.runCode(req.params.roundId, req.user.id, source_code, stdin);
  res.json({ status: 'success', data });
});

export const submitCode = catchAsync(async (req, res) => {
  const { source_code } = req.body;
  const data = await codingService.submitCode(req.params.roundId, req.user.id, source_code);
  res.status(201).json({ status: 'success', data });
});

export const getSubmission = catchAsync(async (req, res) => {
  // Only candidates should view their own submission details for now.
  const data = await codingService.getSubmission(req.params.submissionId, req.user.id, true);
  res.json({ status: 'success', data });
});

export const listSubmissionsForRound = catchAsync(async (req, res) => {
  const data = await codingService.listSubmissionsForRound(req.params.roundId, req.user.id);
  res.json({ status: 'success', results: data.length, data });
});
