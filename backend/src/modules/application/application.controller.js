import applicationService from './application.service.js';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';

class ApplicationController {
    create = catchAsync(async (req, res, next) => {
        const userId = req.user.id;
        const { jobId } = req.body;
        // Store only the filename, not the full path
        const resumeFilePath = req.file ? req.file.filename : null;

        if (!jobId) {
            return next(new AppError('Job ID is required', 400));
        }

        const application = await applicationService.createApplication(
            userId,
            jobId,
            resumeFilePath
        );

        res.status(201).json({
            status: 'success',
            data: application
        });
    });

    getById = catchAsync(async (req, res, next) => {
        const application = await applicationService.getApplicationById(req.params.id);

        res.json({
            status: 'success',
            data: application
        });
    });

    getByJob = catchAsync(async (req, res, next) => {
        const recruiterUserId = req.user.id;
        const applications = await applicationService.getApplicationsByJob(
            req.params.jobId,
            recruiterUserId
        );

        res.json({
            status: 'success',
            results: applications.length,
            data: applications
        });
    });

    getByRecruiter = catchAsync(async (req, res, next) => {
        const recruiterUserId = req.user.id;
        const applications = await applicationService.getApplicationsByRecruiter(recruiterUserId);

        res.json({
            status: 'success',
            results: applications.length,
            data: applications
        });
    });

    getMyApplications = catchAsync(async (req, res, next) => {
        const userId = req.user.id;
        const applications = await applicationService.getApplicationsByCandidate(userId);

        res.json({
            status: 'success',
            results: applications.length,
            data: applications
        });
    });

    updateStatus = catchAsync(async (req, res, next) => {
        const { status } = req.body;
        const recruiterUserId = req.user.id;

        if (!status || !['PENDING', 'REVIEWING', 'SHORTLISTED', 'REJECTED'].includes(status)) {
            return next(new AppError('Valid status is required', 400));
        }

        const application = await applicationService.updateApplicationStatus(
            req.params.id,
            recruiterUserId,
            status
        );

        res.json({
            status: 'success',
            data: application
        });
    });

    checkApplication = catchAsync(async (req, res, next) => {
        const userId = req.user.id;
        const { jobId } = req.query;

        if (!jobId) {
            return next(new AppError('Job ID is required', 400));
        }

        const exists = await applicationService.checkApplicationExists(userId, jobId);

        res.json({
            status: 'success',
            data: { applied: exists }
        });
    });
}

export default new ApplicationController();
