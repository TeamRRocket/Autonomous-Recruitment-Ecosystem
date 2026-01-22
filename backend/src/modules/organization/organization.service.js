import { pool } from '../../config/db.js';

export const createOrganization = async (orgData, client = pool) => {
    const { name, website, industry, size, location } = orgData;

    const result = await client.query(
        `INSERT INTO organizations (name, website, industry, size, location)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
        [name, website, industry, size, location]
    );
    return result.rows[0];
};

export const getOrganizationById = async (id) => {
    const result = await pool.query('SELECT * FROM organizations WHERE id = $1', [id]);
    return result.rows[0];
};
