import { pool } from '../../config/db.js';

/**
 * Create or update interview rounds for a job
 * @param {string} jobId - Job UUID
 * @param {Array} rounds - Array of round configurations
 */
export const createOrUpdateRounds = async (jobId, rounds) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Delete existing rounds for this job
        await client.query('DELETE FROM interview_rounds WHERE job_id = $1', [jobId]);

        // Insert new rounds
        for (const round of rounds) {
            await client.query(
                `INSERT INTO interview_rounds (
                    job_id, round_name, round_type, round_order, 
                    duration_minutes, num_questions, difficulty_level, passing_criteria
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    jobId,
                    round.round_name,
                    round.round_type,
                    round.round_order,
                    round.duration_minutes,
                    round.num_questions || null,
                    round.difficulty_level || null,
                    round.passing_criteria ? JSON.stringify(round.passing_criteria) : null
                ]
            );
        }

        await client.query('COMMIT');
        return await getRoundsByJobId(jobId);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Get all rounds for a specific job
 * @param {string} jobId - Job UUID
 */
export const getRoundsByJobId = async (jobId) => {
    const result = await pool.query(
        `SELECT * FROM interview_rounds 
         WHERE job_id = $1 
         ORDER BY round_order ASC`,
        [jobId]
    );
    return result.rows;
};

/**
 * Get a specific round by ID
 * @param {string} roundId - Round UUID
 */
export const getRoundById = async (roundId) => {
    const result = await pool.query(
        'SELECT * FROM interview_rounds WHERE id = $1',
        [roundId]
    );
    return result.rows[0];
};

/**
 * Update a specific round
 * @param {string} roundId - Round UUID
 * @param {Object} updateData - Fields to update
 */
export const updateRound = async (roundId, updateData) => {
    const {
        round_name,
        round_type,
        round_order,
        duration_minutes,
        num_questions,
        difficulty_level,
        passing_criteria
    } = updateData;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (round_name !== undefined) {
        updates.push(`round_name = $${++paramCount}`);
        values.push(round_name);
    }
    if (round_type !== undefined) {
        updates.push(`round_type = $${++paramCount}`);
        values.push(round_type);
    }
    if (round_order !== undefined) {
        updates.push(`round_order = $${++paramCount}`);
        values.push(round_order);
    }
    if (duration_minutes !== undefined) {
        updates.push(`duration_minutes = $${++paramCount}`);
        values.push(duration_minutes);
    }
    if (num_questions !== undefined) {
        updates.push(`num_questions = $${++paramCount}`);
        values.push(num_questions);
    }
    if (difficulty_level !== undefined) {
        updates.push(`difficulty_level = $${++paramCount}`);
        values.push(difficulty_level);
    }
    if (passing_criteria !== undefined) {
        updates.push(`passing_criteria = $${++paramCount}`);
        values.push(passing_criteria ? JSON.stringify(passing_criteria) : null);
    }

    if (updates.length === 0) {
        return await getRoundById(roundId);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.unshift(roundId);

    const result = await pool.query(
        `UPDATE interview_rounds
         SET ${updates.join(', ')}
         WHERE id = $1
         RETURNING *`,
        values
    );
    return result.rows[0];
};

/**
 * Delete a specific round
 * @param {string} roundId - Round UUID
 */
export const deleteRound = async (roundId) => {
    const result = await pool.query(
        'DELETE FROM interview_rounds WHERE id = $1 RETURNING id',
        [roundId]
    );
    if (result.rowCount === 0) {
        throw new Error('Round not found');
    }
    return result.rows[0];
};

/**
 * Delete all rounds for a job
 * @param {string} jobId - Job UUID
 */
export const deleteRoundsByJobId = async (jobId) => {
    await pool.query('DELETE FROM interview_rounds WHERE job_id = $1', [jobId]);
};
