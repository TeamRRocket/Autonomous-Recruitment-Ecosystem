import { pool } from '../../config/db.js';

class ApplicationRepository {
    async create(applicationData) {
        const { job_id, candidate_id, resume_file_path, status } = applicationData;

        const result = await pool.query(
            `INSERT INTO applications (job_id, candidate_id, resume_file_path, status)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [job_id, candidate_id, resume_file_path || null, status || 'PENDING']
        );

        return result.rows[0];
    }

    async findByJobAndCandidate(jobId, candidateId) {
        const result = await pool.query(
            `SELECT * FROM applications 
             WHERE job_id = $1 AND candidate_id = $2`,
            [jobId, candidateId]
        );

        return result.rows[0];
    }

    async findById(applicationId) {
        const result = await pool.query(
            `SELECT a.*, 
                    j.title as job_title, j.status as job_status,
                    cp.full_name as candidate_name, cp.user_id as candidate_user_id
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             JOIN candidate_profiles cp ON a.candidate_id = cp.id
             WHERE a.id = $1`,
            [applicationId]
        );

        return result.rows[0];
    }

    async findByJobId(jobId) {
        const result = await pool.query(
            `SELECT a.*, 
                    cp.full_name as candidate_name, 
                    cp.years_of_experience,
                    cp.primary_skills,
                    cp.user_id as candidate_user_id
             FROM applications a
             JOIN candidate_profiles cp ON a.candidate_id = cp.id
             WHERE a.job_id = $1
             ORDER BY a.created_at DESC`,
            [jobId]
        );

        return result.rows;
    }

    async findByRecruiterId(recruiterId) {
        const result = await pool.query(
            `SELECT a.*, 
                    j.title as job_title, 
                    cp.full_name as candidate_name, 
                    cp.years_of_experience,
                    cp.primary_skills,
                    cp.user_id as candidate_user_id
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             JOIN candidate_profiles cp ON a.candidate_id = cp.id
             WHERE j.recruiter_id = $1
             ORDER BY a.created_at DESC`,
            [recruiterId]
        );

        return result.rows;
    }

    async findByCandidateId(candidateId) {
        const result = await pool.query(
            `SELECT a.*, 
                    j.title as job_title, 
                    j.location,
                    j.status as job_status,
                    j.selection_lock_from,
                    j.selection_lock_until,
                    caa.status as aptitude_attempt_status,
                    dra.status as dsa_attempt_status,
                    j.created_at as job_created_at
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             LEFT JOIN candidate_aptitude_attempts caa
               ON caa.job_id = a.job_id AND caa.candidate_id = a.candidate_id
             LEFT JOIN dsa_round_attempts dra
               ON dra.job_id = a.job_id AND dra.candidate_id = a.candidate_id
             WHERE a.candidate_id = $1
             ORDER BY a.created_at DESC`,
            [candidateId]
        );

        return result.rows;
    }

    async update(applicationId, updateData) {
        const { status, resume_file_path } = updateData;

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (status !== undefined) {
            updates.push(`status = $${++paramCount}`);
            values.push(status);
        }

        if (resume_file_path !== undefined) {
            updates.push(`resume_file_path = $${++paramCount}`);
            values.push(resume_file_path);
        }

        if (updates.length === 0) {
            return await this.findById(applicationId);
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.unshift(applicationId);

        const result = await pool.query(
            `UPDATE applications
             SET ${updates.join(', ')}
             WHERE id = $1
             RETURNING *`,
            values
        );

        return result.rows[0];
    }
}

export default new ApplicationRepository();
