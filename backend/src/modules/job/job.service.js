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
        preferred_qualifications,
        aptitude_enabled,
        aptitude_level,
        aptitude_duration_minutes,
        aptitude_question_count
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
      experience_level, responsibilities, degree, preferred_qualifications,
      aptitude_enabled, aptitude_level, aptitude_duration_minutes, aptitude_question_count
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
            preferred_qualifications || [],
            aptitude_enabled ?? false,
            aptitude_level || null,
            aptitude_duration_minutes ?? null,
            aptitude_question_count ?? null
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
        preferred_qualifications,
        aptitude_enabled,
        aptitude_level,
        aptitude_duration_minutes,
        aptitude_question_count
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

    if (aptitude_enabled !== undefined) {
        updates.push(`aptitude_enabled = $${++paramCount}`);
        values.push(!!aptitude_enabled);
    }
    if (aptitude_level !== undefined) {
        updates.push(`aptitude_level = $${++paramCount}`);
        values.push(aptitude_level);
    }
    if (aptitude_duration_minutes !== undefined) {
        updates.push(`aptitude_duration_minutes = $${++paramCount}`);
        values.push(aptitude_duration_minutes);
    }
    if (aptitude_question_count !== undefined) {
        updates.push(`aptitude_question_count = $${++paramCount}`);
        values.push(aptitude_question_count);
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

export const getJobScores = async (jobId) => {
    if (!jobId) {
        throw new AppError('jobId is required', 400);
    }

    // requireOwnership middleware already ensures recruiter owns job for the route.
    // We keep this function scoped to jobId and return aggregated results.

    const candidatesRes = await pool.query(
        `SELECT a.id AS application_id,
                a.status AS application_status,
                a.created_at AS applied_at,
                c.id AS candidate_id,
                c.full_name AS candidate_name,
                c.years_of_experience,
                c.primary_skills,
                c.secondary_skills
         FROM applications a
         JOIN candidate_profiles c ON a.candidate_id = c.id
         WHERE a.job_id = $1
         ORDER BY a.created_at DESC`,
        [jobId]
    );

    const candidateIds = candidatesRes.rows.map((r) => r.candidate_id);
    if (candidateIds.length === 0) {
        return { job_id: jobId, candidates: [] };
    }

    const resumeRes = await pool.query(
        `SELECT candidate_id, final_score, created_at
         FROM resume_scores
         WHERE job_id = $1 AND candidate_id = ANY($2::uuid[])`,
        [jobId, candidateIds]
    );
    const resumeByCandidate = new Map(resumeRes.rows.map((r) => [r.candidate_id, r]));

    const aptitudeRes = await pool.query(
        `SELECT a.candidate_id,
                a.status,
                a.score,
                a.started_at,
                a.ends_at,
                a.submitted_at,
                COUNT(r.question_id)::int AS total_questions,
                SUM(CASE WHEN r.selected_option = q.correct_option THEN 1 ELSE 0 END)::int AS correct_questions
         FROM candidate_aptitude_attempts a
         LEFT JOIN candidate_aptitude_responses r ON r.attempt_id = a.id
         LEFT JOIN aptitude_questions q ON q.id = r.question_id
         WHERE a.job_id = $1 AND a.candidate_id = ANY($2::uuid[])
         GROUP BY a.candidate_id, a.status, a.score, a.started_at, a.ends_at, a.submitted_at`,
        [jobId, candidateIds]
    );
    const aptitudeByCandidate = new Map(aptitudeRes.rows.map((r) => [r.candidate_id, r]));

    const dsaRes = await pool.query(
        `SELECT candidate_id, status, final_score, started_at, ends_at, submitted_at
         FROM dsa_round_attempts
         WHERE job_id = $1 AND candidate_id = ANY($2::uuid[])`,
        [jobId, candidateIds]
    );
    const dsaByCandidate = new Map(dsaRes.rows.map((r) => [r.candidate_id, r]));

    // Coding (non-DSA) rounds: compute per-candidate latest submission aggregate across CODING rounds for this job.
    // Score definition: percentage = average(pass_rate) across coding rounds that have a submission.
    const codingRoundsRes = await pool.query(
        `SELECT id
         FROM interview_rounds
         WHERE job_id = $1 AND round_type = 'CODING'`,
        [jobId]
    );
    const codingRoundIds = codingRoundsRes.rows.map((r) => r.id);

    const codingAggByCandidate = new Map();
    if (codingRoundIds.length > 0) {
        const codingSubsRes = await pool.query(
            `SELECT cp.round_id,
                    cs.candidate_id,
                    cs.passed_tests,
                    cs.total_tests,
                    cs.status,
                    cs.created_at,
                    ROW_NUMBER() OVER (
                        PARTITION BY cp.round_id, cs.candidate_id
                        ORDER BY cs.created_at DESC
                    ) AS rn
             FROM coding_submissions cs
             JOIN coding_problems cp ON cp.id = cs.problem_id
             WHERE cp.round_id = ANY($1::uuid[])
               AND cs.candidate_id = ANY($2::uuid[])`,
            [codingRoundIds, candidateIds]
        );

        const latest = codingSubsRes.rows.filter((r) => Number(r.rn) === 1);
        for (const row of latest) {
            const passRate = row.total_tests > 0 ? Math.round((Number(row.passed_tests) / Number(row.total_tests)) * 100) : 0;
            const prev = codingAggByCandidate.get(row.candidate_id) || { rounds: [], avg_score: null };
            prev.rounds.push({
                round_id: row.round_id,
                status: row.status,
                passed_tests: row.passed_tests,
                total_tests: row.total_tests,
                score_percent: passRate,
                submitted_at: row.created_at
            });
            codingAggByCandidate.set(row.candidate_id, prev);
        }

        for (const [cid, v] of codingAggByCandidate.entries()) {
            if (v.rounds.length === 0) {
                v.avg_score = null;
                continue;
            }
            const sum = v.rounds.reduce((acc, r) => acc + (Number(r.score_percent) || 0), 0);
            v.avg_score = Math.round(sum / v.rounds.length);
        }
    }

    const candidates = candidatesRes.rows.map((r) => {
        const resume = resumeByCandidate.get(r.candidate_id) || null;
        const apt = aptitudeByCandidate.get(r.candidate_id) || null;
        const dsa = dsaByCandidate.get(r.candidate_id) || null;
        const coding = codingAggByCandidate.get(r.candidate_id) || { rounds: [], avg_score: null };

        return {
            application: {
                id: r.application_id,
                status: r.application_status,
                applied_at: r.applied_at
            },
            candidate: {
                id: r.candidate_id,
                name: r.candidate_name,
                years_of_experience: r.years_of_experience,
                primary_skills: r.primary_skills || [],
                secondary_skills: r.secondary_skills || []
            },
            scores: {
                resume: resume
                    ? { score: resume.final_score, computed_at: resume.created_at }
                    : { score: null, computed_at: null },
                aptitude: apt
                    ? {
                        status: apt.status,
                        score: apt.score,
                        correct: apt.correct_questions,
                        total: apt.total_questions,
                        percent: apt.total_questions > 0 ? Math.round((Number(apt.correct_questions || 0) / Number(apt.total_questions)) * 100) : null,
                        started_at: apt.started_at,
                        ends_at: apt.ends_at,
                        submitted_at: apt.submitted_at
                    }
                    : { status: 'not_started', score: null, correct: null, total: null, percent: null, started_at: null, ends_at: null, submitted_at: null },
                dsa: dsa
                    ? { status: dsa.status, score: dsa.final_score, started_at: dsa.started_at, ends_at: dsa.ends_at, submitted_at: dsa.submitted_at }
                    : { status: 'not_started', score: null, started_at: null, ends_at: null, submitted_at: null },
                coding: {
                    avg_score_percent: coding.avg_score,
                    rounds: coding.rounds
                }
            }
        };
    });

    return { job_id: jobId, candidates };
};
