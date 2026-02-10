import catchAsync from '../../utils/catchAsync.js';
import aptitudeService from './aptitude.service.js';

export const start = catchAsync(async (req, res) => {
  const data = await aptitudeService.start(req.user.id, req.body);
  res.status(201).json({ status: 'success', data });
});

export const submit = catchAsync(async (req, res) => {
  const data = await aptitudeService.submit(req.user.id, req.body);
  res.status(201).json({ status: 'success', data });
});

export const status = catchAsync(async (req, res) => {
  const data = await aptitudeService.status(req.user.id, req.query);
  res.status(200).json({ status: 'success', data });
});
