import catchAsync from '../../utils/catchAsync.js';
import * as dsaService from './dsa.service.js';

export const listBankProblems = catchAsync(async (req, res) => {
  const data = await dsaService.listBankProblems(req.user.id, req.query);
  res.json({ status: 'success', results: data.length, data });
});

export const getConfig = catchAsync(async (req, res) => {
  const data = await dsaService.getConfig(req.user.id, req.query);
  res.json({ status: 'success', data });
});

export const upsertConfig = catchAsync(async (req, res) => {
  const data = await dsaService.upsertConfig(req.user.id, req.body);
  res.status(201).json({ status: 'success', data });
});

export const publishConfig = catchAsync(async (req, res) => {
  const data = await dsaService.publishConfig(req.user.id, req.body);
  res.status(200).json({ status: 'success', data });
});

export const start = catchAsync(async (req, res) => {
  const data = await dsaService.startRound(req.user.id, req.body);
  res.status(201).json({ status: 'success', data });
});

export const run = catchAsync(async (req, res) => {
  const data = await dsaService.runCode(req.user.id, req.body);
  res.json({ status: 'success', data });
});

export const saveDraft = catchAsync(async (req, res) => {
  const data = await dsaService.saveDraft(req.user.id, req.body);
  res.status(200).json({ status: 'success', data });
});

export const submit = catchAsync(async (req, res) => {
  const data = await dsaService.submit(req.user.id, req.body);
  res.status(201).json({ status: 'success', data });
});

export const status = catchAsync(async (req, res) => {
  const data = await dsaService.getStatus(req.user.id, req.query);
  res.json({ status: 'success', data });
});

export const result = catchAsync(async (req, res) => {
  const data = await dsaService.getResult(req.user.id, req.query);
  res.json({ status: 'success', data });
});
