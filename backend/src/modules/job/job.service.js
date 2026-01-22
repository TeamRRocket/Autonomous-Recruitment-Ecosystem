import { pool } from '../../config/db.js';
import AppError from '../../utils/AppError.js';

export const createJob = async (jobData) => {
    const {
        recruiter_id,
        organization_id,
        title,
        description,
        location,
        type,
        requirements,
        status,
        expires_at,
        department,
        experience_level,
        responsibilities,
        degree,
        preferred_qualifications
    } = jobData;

    if (!title || !description) {
        throw new AppError('Title and description are required', 400);
    }

    if (!requirements || !Array.isArray(requirements) || requirements.length === 0) {
        throw new AppError('At least one requirement is required', 400);
    }

    const result = await pool.query(
        `INSERT INTO jobs (
      recruiter_id, organization_id, title, description, location, 
      type, requirements, status, expires_at, department, 
      experience_level, responsibilities, degree, preferred_qualifications
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
        [
            recruiter_id,
            organization_id,
            title,
            description,
            location || null,
            type || null,
            requirements,
            status || 'DRAFT',
            expires_at || null,
            department || null,
            experience_level || null,
            responsibilities || null,
            degree || null,
            preferred_qualifications || []
        ]
    );
    const job = result.rows[0];
    return await getJobById(job.id);
};

export const updateJob = async (jobId, jobData) => {
    const {
        title,
        description,
        location,
        type,
        requirements,
        status,
        expires_at,
        department,
        experience_level,
        responsibilities,
        degree,
        preferred_qualifications
    } = jobData;

    // Build dynamic update query to handle null values properly
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
        updates.push(`title = $${++paramCount}`);
        values.push(title);
    }
    if (description !== undefined) {
        updates.push(`description = $${++paramCount}`);
        values.push(description);
    }
    if (location !== undefined) {
        updates.push(`location = $${++paramCount}`);
        values.push(location);
    }
    if (type !== undefined) {
        updates.push(`type = $${++paramCount}`);
        values.push(type);
    }
    if (requirements !== undefined) {
        updates.push(`requirements = $${++paramCount}`);
        values.push(requirements);
    }
    if (status !== undefined) {
        updates.push(`status = $${++paramCount}`);
        values.push(status);
    }
    if (expires_at !== undefined) {
        updates.push(`expires_at = $${++paramCount}`);
        values.push(expires_at);
    }
    if (department !== undefined) {
        updates.push(`department = $${++paramCount}`);
        values.push(department);
    }
    if (experience_level !== undefined) {
        updates.push(`experience_level = $${++paramCount}`);
        values.push(experience_level);
    }
    if (responsibilities !== undefined) {
        updates.push(`responsibilities = $${++paramCount}`);
        values.push(responsibilities);
    }
    if (degree !== undefined) {
        updates.push(`degree = $${++paramCount}`);
        values.push(degree);
    }
    if (preferred_qualifications !== undefined) {
        updates.push(`preferred_qualifications = $${++paramCount}`);
        values.push(preferred_qualifications);
    }

    if (updates.length === 0) {
        // No updates provided, just return the existing job
        return await getJobById(jobId);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.unshift(jobId); // jobId is $1

    const result = await pool.query(
        `UPDATE jobs
     SET ${updates.join(', ')}
     WHERE id = $1
     RETURNING id`,
        values
    );
    return await getJobById(jobId);
};

export const getJobById = async (jobId) => {
    const result = await pool.query(
        `SELECT j.*, o.name as organization_name, o.logo_url as organization_logo
     FROM jobs j
     LEFT JOIN organizations o ON j.organization_id = o.id
     WHERE j.id = $1`,
        [jobId]
    );
    return result.rows[0];
};

export const getJobsByRecruiter = async (recruiterId) => {
    const result = await pool.query(
        `SELECT j.*, o.name as organization_name, o.logo_url as organization_logo
     FROM jobs j
     LEFT JOIN organizations o ON j.organization_id = o.id
     WHERE j.recruiter_id = $1 
     ORDER BY j.created_at DESC`,
        [recruiterId]
    );
    return result.rows;
};

export const getPublishedJobs = async () => {
    const result = await pool.query(
        `SELECT j.*, o.name as organization_name, o.logo_url as organization_logo
     FROM jobs j
     LEFT JOIN organizations o ON j.organization_id = o.id
     WHERE j.status = 'PUBLISHED' 
     AND (j.expires_at IS NULL OR j.expires_at > CURRENT_TIMESTAMP)
     ORDER BY j.created_at DESC`
    );
    return result.rows;
};

export const searchJobs = async (searchQuery) => {
    const result = await pool.query(
        `SELECT j.*, o.name as organization_name, o.logo_url as organization_logo
     FROM jobs j
     LEFT JOIN organizations o ON j.organization_id = o.id
     WHERE j.status = 'PUBLISHED' 
     AND (j.expires_at IS NULL OR j.expires_at > CURRENT_TIMESTAMP)
     AND (
         j.title ILIKE $1 
         OR j.description ILIKE $1 
         OR j.location ILIKE $1
         OR o.name ILIKE $1
     )
     ORDER BY j.created_at DESC`,
        [`%${searchQuery}%`]
    );
    return result.rows;
};

export const deleteJob = async (jobId) => {
    const result = await pool.query('DELETE FROM jobs WHERE id = $1 RETURNING id', [jobId]);
    if (result.rowCount === 0) {
        throw new Error('Job not found');
    }
    return result.rows[0];
};

/**
 * Get job with all interview rounds
 * @param {string} jobId - Job UUID
 */
export const getJobWithRounds = async (jobId) => {
    const jobResult = await pool.query(
        'SELECT * FROM jobs WHERE id = $1',
        [jobId]
    );

    if (jobResult.rows.length === 0) {
        return null;
    }

    const job = jobResult.rows[0];

    const roundsResult = await pool.query(
        'SELECT * FROM interview_rounds WHERE job_id = $1 ORDER BY round_order ASC',
        [jobId]
    );

    return {
        ...job,
        rounds: roundsResult.rows
    };
};
