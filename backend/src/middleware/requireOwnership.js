import { pool } from '../config/db.js';
import AppError from '../utils/AppError.js';

const requireOwnership = async (req, res, next) => {
    try {
        const jobId = req.params.id;
        const userId = req.user.id;

        // Find the job and check if the recruiter owns it.
        // We know users table connects to recruiters table via user_id.
        // Job has recruiter_id.

        const query = `
            SELECT j.* 
            FROM jobs j
            JOIN recruiters r ON j.recruiter_id = r.id
            WHERE j.id = $1 AND r.user_id = $2
        `;

        const result = await pool.query(query, [jobId, userId]);

        if (result.rowCount === 0) {
            return next(new AppError('You do not have permission to modify this job', 403));
        }

        req.job = result.rows[0]; // Attach job to request for downstream use
        next();
    } catch (error) {
        next(error);
    }
};

export default requireOwnership;
