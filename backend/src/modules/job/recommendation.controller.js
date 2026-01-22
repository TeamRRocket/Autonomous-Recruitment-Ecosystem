import * as recommendationService from './recommendation.service.js';
import catchAsync from '../../utils/catchAsync.js';

export const getRecommendations = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const recommendations = await recommendationService.getJobRecommendations(userId);

    res.json({
        status: 'success',
        results: recommendations.length,
        data: recommendations
    });
});
