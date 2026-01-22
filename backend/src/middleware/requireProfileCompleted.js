import { pool } from '../config/db.js';
import AppError from '../utils/AppError.js';

const requireProfileCompleted = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        if (!userId || !role) {
            return next(new AppError('User not authenticated or role missing', 401));
        }

        let profileExists = false;

        if (role === 'CANDIDATE') {
            const result = await pool.query(
                'SELECT 1 FROM candidate_profiles WHERE user_id = $1',
                [userId]
            );
            profileExists = result.rowCount > 0;
        } else if (role === 'RECRUITER') {
            const result = await pool.query(
                'SELECT 1 FROM recruiters WHERE user_id = $1',
                [userId]
            );
            profileExists = result.rowCount > 0;
        }

        if (!profileExists) {
            return next(new AppError('Profile completion required', 403));
        }

        next();
    } catch (error) {
        next(error);
    }
};

export default requireProfileCompleted;
