import * as recruiterService from './recruiter.service.js';
import AppError from '../../utils/AppError.js';
import catchAsync from '../../utils/catchAsync.js';

export const onboardRecruiter = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const { full_name } = req.body;

    if (!full_name) {
        return next(new AppError('Full name is required', 400));
    }

    // Check if recruiter profile already exists
    const existingRecruiter = await recruiterService.getRecruiterByUserId(userId);
    if (existingRecruiter) {
        return next(new AppError('Recruiter profile already exists', 400));
    }

    // Create Recruiter Profile (all recruiters belong to implicit company)
    const newRecruiter = await recruiterService.createRecruiter({
        user_id: userId,
        organization_id: null,
        full_name: full_name
    });

    res.status(201).json({
        status: 'success',
        data: {
            recruiter: newRecruiter
        }
    });
});

export const getMyProfile = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const recruiter = await recruiterService.getRecruiterByUserId(userId);

    if (!recruiter) {
        return next(new AppError('Recruiter profile not found', 404));
    }

    res.json({ status: 'success', data: recruiter });
});

export const updateProfile = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const updatedRecruiter = await recruiterService.updateRecruiterProfile(userId, req.body);

    if (!updatedRecruiter) {
        return next(new AppError('Recruiter profile not found', 404));
    }

    res.json({
        status: 'success',
        data: {
            recruiter: updatedRecruiter
        }
    });
});
