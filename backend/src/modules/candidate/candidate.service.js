import { pool } from '../../config/db.js';

export const createCandidateProfile = async (userId, profileData) => {
    const {
        full_name,
        years_of_experience,
        primary_skills,
        secondary_skills,
        skill_levels = null,
        preferred_roles,
        preferred_locations
    } = profileData;

    const result = await pool.query(
        `INSERT INTO candidate_profiles (
      user_id, full_name, years_of_experience, primary_skills, secondary_skills, 
      skill_levels, preferred_roles, preferred_locations
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
    RETURNING *`,
        [
            userId,
            full_name,
            years_of_experience || 0,
            primary_skills || [],
            secondary_skills || [],
            skill_levels,
            preferred_roles || [],
            preferred_locations || []
        ]
    );
    return result.rows[0];
};

export const getCandidateProfileByUserId = async (userId) => {
    const result = await pool.query(
        `SELECT cp.*, u.email 
     FROM candidate_profiles cp 
     JOIN users u ON cp.user_id = u.id 
     WHERE cp.user_id = $1`,
        [userId]
    );
    return result.rows[0];
};

export const updateCandidateProfile = async (userId, profileData) => {
    const {
        full_name,
        years_of_experience,
        primary_skills,
        secondary_skills,
        skill_levels = null,
        preferred_roles,
        preferred_locations
    } = profileData;

    const result = await pool.query(
        `UPDATE candidate_profiles 
     SET full_name = COALESCE($2, full_name),
         years_of_experience = COALESCE($3, years_of_experience),
         primary_skills = COALESCE($4, primary_skills),
         secondary_skills = COALESCE($5, secondary_skills),
         skill_levels = COALESCE($6, skill_levels),
         preferred_roles = COALESCE($7, preferred_roles),
         preferred_locations = COALESCE($8, preferred_locations),
         updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $1
     RETURNING *`,
        [
            userId,
            full_name,
            years_of_experience,
            primary_skills,
            secondary_skills,
            skill_levels,
            preferred_roles,
            preferred_locations
        ]
    );
    return result.rows[0];
};
