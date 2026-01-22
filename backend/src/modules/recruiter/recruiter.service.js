import { pool } from '../../config/db.js';

export const createRecruiter = async (recruiterData, client = pool) => {
    const { user_id, organization_id, full_name } = recruiterData;

    const result = await client.query(
        `INSERT INTO recruiters (user_id, organization_id, full_name)
     VALUES ($1, $2, $3)
     RETURNING *`,
        [user_id, organization_id, full_name]
    );
    return result.rows[0];
};

export const getRecruiterByUserId = async (userId) => {
    const result = await pool.query(
        `SELECT r.*, u.email
     FROM recruiters r
     JOIN users u ON r.user_id = u.id
     WHERE r.user_id = $1`,
        [userId]
    );
    return result.rows[0];
};

export const updateRecruiterProfile = async (userId, updateData) => {
    const { full_name } = updateData;
    const result = await pool.query(
        `UPDATE recruiters
         SET full_name = COALESCE($2, full_name),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1
         RETURNING *`,
        [userId, full_name]
    );
    return result.rows[0];
};
