import { verifyToken } from '../utils/jwt.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

export const protect = catchAsync(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in', 401));
    }

    try {
        const decoded = verifyToken(token);
        req.user = decoded; // { id, role, ... }
        next();
    } catch (err) {
        return next(new AppError('Invalid token', 401));
    }
});

export const restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin', 'recruiter']. role='candidate'
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
