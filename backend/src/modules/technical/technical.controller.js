import catchAsync from '../../utils/catchAsync.js';
import technicalService from './technical.service.js';

export const start = catchAsync(async (req, res) => {
  const data = await technicalService.start(req.user.id, req.body);
  res.status(201).json({ status: 'success', data });
});

export const submitAnswer = catchAsync(async (req, res) => {
  const data = await technicalService.submitAnswer(req.user.id, req.body);
  res.status(201).json({ status: 'success', data });
});

export const submit = catchAsync(async (req, res) => {
  const data = await technicalService.submit(req.user.id, req.body);
  res.status(201).json({ status: 'success', data });
});

export const status = catchAsync(async (req, res) => {
  const data = await technicalService.status(req.user.id, req.query);
  res.status(200).json({ status: 'success', data });
});
