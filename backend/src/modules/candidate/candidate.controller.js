import * as candidateService from './candidate.service.js';
import * as recommendationService from '../job/recommendation.service.js';
import AppError from '../../utils/AppError.js';

export const createProfile = async (req, res, next) => {
    try {
        const userId = req.user.id; // Assumes auth middleware populates req.user
        const existingProfile = await candidateService.getCandidateProfileByUserId(userId);

        if (existingProfile) {
            return next(new AppError('Profile already exists', 400));
        }

        const profile = await candidateService.createCandidateProfile(userId, req.body);
        res.status(201).json({ status: 'success', data: profile });
    } catch (error) {
        next(error);
    }
};

export const getMyProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const profile = await candidateService.getCandidateProfileByUserId(userId);

        if (!profile) {
            return next(new AppError('Profile not found', 404));
        }

        res.json({ status: 'success', data: profile });
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const updatedProfile = await candidateService.updateCandidateProfile(userId, req.body);

        if (!updatedProfile) {
            return next(new AppError('Profile not found', 404));
        }

        // Clear AI recommendation cache so new recommendations match updated profile
        recommendationService.clearRecommendationCache(userId);

        res.json({ status: 'success', data: updatedProfile });
    } catch (error) {
        next(error);
    }
};
