import * as roundService from './round.service.js';
import * as jobService from '../job/job.service.js';
import * as recruiterService from '../recruiter/recruiter.service.js';
import AppError from '../../utils/AppError.js';
import catchAsync from '../../utils/catchAsync.js';

/**
 * Create or update rounds for a job
 * POST /api/jobs/:jobId/rounds
 */
export const createOrUpdateRounds = catchAsync(async (req, res, next) => {
    const { jobId } = req.params;
    const { rounds } = req.body;

    // Verify job exists and user owns it
    const job = await jobService.getJobById(jobId);
    if (!job) {
        return next(new AppError('Job not found', 404));
    }

    const recruiter = await recruiterService.getRecruiterByUserId(req.user.id);
    if (!recruiter || job.recruiter_id !== recruiter.id) {
        return next(new AppError('You do not have permission to modify this job', 403));
    }

    // Validate rounds array
    if (!rounds || !Array.isArray(rounds) || rounds.length === 0) {
        return next(new AppError('At least one round is required', 400));
    }

    // Validate each round
    for (const round of rounds) {
        if (!round.round_name || !round.round_type || round.round_order === undefined || !round.duration_minutes) {
            return next(new AppError('Each round must have name, type, order, and duration', 400));
        }
        if (!['MCQ', 'CODING', 'INTERVIEW'].includes(round.round_type)) {
            return next(new AppError('Invalid round type', 400));
        }
        if (round.difficulty_level && !['EASY', 'MEDIUM', 'HARD'].includes(round.difficulty_level)) {
            return next(new AppError('Invalid difficulty level', 400));
        }
    }

    const savedRounds = await roundService.createOrUpdateRounds(jobId, rounds);
    res.status(200).json({
        status: 'success',
        data: savedRounds
    });
});

/**
 * Get all rounds for a job
 * GET /api/jobs/:jobId/rounds
 */
export const getRounds = catchAsync(async (req, res, next) => {
    const { jobId } = req.params;

    const job = await jobService.getJobById(jobId);
    if (!job) {
        return next(new AppError('Job not found', 404));
    }

    // If candidate, job must be published
    if (req.user.role === 'CANDIDATE' && job.status !== 'PUBLISHED') {
        return next(new AppError('Job not available', 404));
    }

    // If recruiter, check ownership for non-published jobs
    if (req.user.role === 'RECRUITER' && job.status !== 'PUBLISHED') {
        const recruiter = await recruiterService.getRecruiterByUserId(req.user.id);
        if (!recruiter || job.recruiter_id !== recruiter.id) {
            return next(new AppError('Job not available', 404));
        }
    }

    const rounds = await roundService.getRoundsByJobId(jobId);
    res.json({
        status: 'success',
        results: rounds.length,
        data: rounds
    });
});

/**
 * Update a specific round
 * PUT /api/jobs/:jobId/rounds/:roundId
 */
export const updateRound = catchAsync(async (req, res, next) => {
    const { jobId, roundId } = req.params;

    // Verify job exists and user owns it
    const job = await jobService.getJobById(jobId);
    if (!job) {
        return next(new AppError('Job not found', 404));
    }

    const recruiter = await recruiterService.getRecruiterByUserId(req.user.id);
    if (!recruiter || job.recruiter_id !== recruiter.id) {
        return next(new AppError('You do not have permission to modify this job', 403));
    }

    // Verify round exists and belongs to this job
    const round = await roundService.getRoundById(roundId);
    if (!round || round.job_id !== jobId) {
        return next(new AppError('Round not found', 404));
    }

    const updatedRound = await roundService.updateRound(roundId, req.body);
    res.json({
        status: 'success',
        data: updatedRound
    });
});

/**
 * Delete a specific round
 * DELETE /api/jobs/:jobId/rounds/:roundId
 */
export const deleteRound = catchAsync(async (req, res, next) => {
    const { jobId, roundId } = req.params;

    // Verify job exists and user owns it
    const job = await jobService.getJobById(jobId);
    if (!job) {
        return next(new AppError('Job not found', 404));
    }

    const recruiter = await recruiterService.getRecruiterByUserId(req.user.id);
    if (!recruiter || job.recruiter_id !== recruiter.id) {
        return next(new AppError('You do not have permission to modify this job', 403));
    }

    // Verify round exists and belongs to this job
    const round = await roundService.getRoundById(roundId);
    if (!round || round.job_id !== jobId) {
        return next(new AppError('Round not found', 404));
    }

    await roundService.deleteRound(roundId);
    res.json({
        status: 'success',
        message: 'Round deleted successfully'
    });
});
