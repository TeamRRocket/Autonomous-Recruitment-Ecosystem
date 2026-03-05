import axios from 'axios';
import { pool } from '../../config/db.js';
import AppError from '../../utils/AppError.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const MATCH_JOBS_ENDPOINT = `${AI_SERVICE_URL}/match-jobs`;

// Simple in-memory cache
const recommendationCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get job recommendations for a candidate based on their skills
 */
export const getJobRecommendations = async (userId) => {
    // Check cache
    const cachedData = recommendationCache.get(userId);
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
        return cachedData.recommendations;
    }


    // 1. Fetch candidate profile and skills
    const candidateResult = await pool.query(
        'SELECT primary_skills, secondary_skills FROM candidate_profiles WHERE user_id = $1',
        [userId]
    );

    if (candidateResult.rows.length === 0) {
        throw new AppError('Candidate profile not found', 404);
    }

    const { primary_skills, secondary_skills } = candidateResult.rows[0];
    const candidateSkills = [...(primary_skills || []), ...(secondary_skills || [])];

    if (candidateSkills.length === 0) {
        return []; // No skills, no recommendations
    }

    // 2. Fetch active published jobs - Limit to most recent 20 for performance
    const jobsResult = await pool.query(
        `SELECT id as job_id, title as job_title, requirements 
         FROM jobs 
         WHERE status = 'PUBLISHED' 
         AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
         ORDER BY created_at DESC
         LIMIT 20`
    );

    const activeJobs = jobsResult.rows;

    if (activeJobs.length === 0) {
        return [];
    }

    // 3. Call AI Service for matching
    try {
        const response = await axios.post(MATCH_JOBS_ENDPOINT, {
            candidate_skills: candidateSkills,
            jobs: activeJobs.map(job => ({
                job_id: job.job_id,
                job_title: job.job_title,
                required_skills: job.requirements || []
            }))
        });

        const recommendations = response.data.recommendations;

        // Update cache
        recommendationCache.set(userId, {
            recommendations,
            timestamp: Date.now()
        });

        return recommendations;
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('Failed to connect to AI Service: The Python service is likely not running on port 8000.');
        } else {
            console.error('AI Service Error:', error.response?.data || error.message);
        }
        throw new AppError('Unable to fetch recommendations at this time', 500);
    }
};

/**
 * Clear the recommendation cache for a user
 */
export const clearRecommendationCache = (userId) => {
    recommendationCache.delete(userId);
};
