import * as jobService from './job.service.js';
import * as recruiterService from '../recruiter/recruiter.service.js';
import AppError from '../../utils/AppError.js';
import catchAsync from '../../utils/catchAsync.js';

// Recruiter: Create Job
export const createJob = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const recruiter = await recruiterService.getRecruiterByUserId(userId);

    if (!recruiter) {
        return next(new AppError('Recruiter not found', 404));
    }

    const { title, description, requirements } = req.body;
    if (!title || !description) {
        return next(new AppError('Title and description are required', 400));
    }

    if (!requirements || !Array.isArray(requirements) || requirements.length === 0) {
        return next(new AppError('At least one requirement is required', 400));
    }

    // Convert expires_at string to Date if provided
    let expires_at = req.body.expires_at;
    if (expires_at) {
        const date = new Date(expires_at);
        if (isNaN(date.getTime())) {
            return next(new AppError('Invalid expiration date format', 400));
        }
        expires_at = date;
    }

    const jobData = {
        ...req.body,
        experience_level: req.body.experience_level?.toUpperCase(),
        recruiter_id: recruiter.id,
        organization_id: recruiter.organization_id || null,
        expires_at: expires_at || null
    };

    const job = await jobService.createJob(jobData);
    res.status(201).json({ status: 'success', data: job });
});

// Recruiter: Update Job
export const updateJob = catchAsync(async (req, res, next) => {
    // Ownership check is done in middleware (requireOwnership)
    // req.job is set by the middleware

    const { expires_at } = req.body;
    let processedExpiresAt = expires_at;

    if (expires_at) {
        processedExpiresAt = new Date(expires_at);
        if (isNaN(processedExpiresAt.getTime())) {
            return next(new AppError('Invalid expiration date format', 400));
        }
    }

    const updateData = {
        ...req.body,
        experience_level: req.body.experience_level?.toUpperCase(),
        expires_at: processedExpiresAt || null
    };

    const updatedJob = await jobService.updateJob(req.params.id, updateData);

    if (!updatedJob) {
        return next(new AppError('Job not found', 404));
    }

    res.json({ status: 'success', data: updatedJob });
});

// Recruiter: Get My Jobs
export const getMyJobs = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const recruiter = await recruiterService.getRecruiterByUserId(userId);

    if (!recruiter) {
        return next(new AppError('Recruiter not found', 404));
    }

    const jobs = await jobService.getJobsByRecruiter(recruiter.id);
    res.json({ status: 'success', results: jobs.length, data: jobs });
});

// Candidate & Recruiter: Get Job Details
export const getJob = catchAsync(async (req, res, next) => {
    const job = await jobService.getJobById(req.params.id);

    if (!job) {
        return next(new AppError('Job not found', 404));
    }

    // If Candidate -> must be PUBLISHED
    if (req.user.role === 'CANDIDATE' && job.status !== 'PUBLISHED') {
        return next(new AppError('Job not available', 404));
    }

    // If Recruiter -> can view their own jobs regardless of status
    // For other recruiters' jobs, only PUBLISHED jobs are visible
    if (req.user.role === 'RECRUITER') {
        // Check if this recruiter owns the job
        const recruiter = await recruiterService.getRecruiterByUserId(req.user.id);
        if (recruiter && job.recruiter_id === recruiter.id) {
            // Owner can view their own job in any status
            return res.json({ status: 'success', data: job });
        }
        // Non-owner can only view PUBLISHED jobs
        if (job.status !== 'PUBLISHED') {
            return next(new AppError('Job not available', 404));
        }
    }

    res.json({ status: 'success', data: job });
});

// Candidate: List Published Jobs
export const getPublishedJobs = catchAsync(async (req, res, next) => {
    const jobs = await jobService.getPublishedJobs(req.query);
    res.json({ status: 'success', results: jobs.length, data: jobs });
});

// Search Jobs
export const searchJobs = catchAsync(async (req, res, next) => {
    const { q } = req.query;
    if (!q || q.trim() === '') {
        return res.json({ status: 'success', results: 0, data: [] });
    }
    const jobs = await jobService.searchJobs(q.trim());
    res.json({ status: 'success', results: jobs.length, data: jobs });
});

// Recruiter: Delete Job (only for CLOSED jobs)
export const deleteJob = catchAsync(async (req, res, next) => {
    // Ownership check is done in middleware (requireOwnership)
    // req.job is set by the middleware

    // Verify job is CLOSED before allowing deletion
    if (req.job.status !== 'CLOSED') {
        return next(new AppError('Only closed jobs can be deleted', 400));
    }

    await jobService.deleteJob(req.params.id);
    res.json({ status: 'success', message: 'Job deleted successfully' });
});

// Recruiter: Publish Job
export const publishJob = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { id } = req.params;

    const recruiter = await recruiterService.getRecruiterByUserId(userId);
    if (!recruiter) {
        return next(new AppError('Recruiter not found', 404));
    }

    const job = await jobService.getJobById(id);
    if (!job) {
        return next(new AppError('Job not found', 404));
    }

    // Check ownership
    if (job.recruiter_id !== recruiter.id) {
        return next(new AppError('You do not have permission to publish this job', 403));
    }

    // Validate job has required fields
    if (!job.title || !job.description || !job.department || !job.experience_level) {
        return next(new AppError('Job must have title, description, department, and experience level', 400));
    }

    // Check if job has at least one round
    const { getRoundsByJobId } = await import('../round/round.service.js');
    const rounds = await getRoundsByJobId(id);
    if (rounds.length === 0) {
        return next(new AppError('Job must have at least one interview round before publishing', 400));
    }

    // Update job status to PUBLISHED
    const updatedJob = await jobService.updateJob(id, { status: 'PUBLISHED' });

    res.json({
        status: 'success',
        message: 'Job published successfully',
        data: updatedJob
    });
});

// Recruiter: Get Job Overview (with rounds)
export const getJobOverview = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { id } = req.params;

    const recruiter = await recruiterService.getRecruiterByUserId(userId);
    if (!recruiter) {
        return next(new AppError('Recruiter not found', 404));
    }

    const jobWithRounds = await jobService.getJobWithRounds(id);
    if (!jobWithRounds) {
        return next(new AppError('Job not found', 404));
    }

    // Check ownership
    if (jobWithRounds.recruiter_id !== recruiter.id) {
        return next(new AppError('You do not have permission to view this job', 403));
    }

    res.json({
        status: 'success',
        data: jobWithRounds
    });
});
