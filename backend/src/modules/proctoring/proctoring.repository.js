import { pool } from '../../config/db.js';

class ProctoringRepository {
    /**
     * Create a new proctoring session
     */
    async createSession(candidateId, jobId, roundType, attemptId) {
        const query = `
            INSERT INTO proctoring_sessions (candidate_id, job_id, round_type, attempt_id, status)
            VALUES ($1, $2, $3, $4, 'ACTIVE')
            ON CONFLICT (attempt_id, round_type) 
            DO UPDATE SET status = 'ACTIVE', ended_at = NULL
            RETURNING *;
        `;
        const result = await pool.query(query, [candidateId, jobId, roundType, attemptId]);
        return result.rows[0];
    }

    /**
     * Get session by attempt ID and round type
     */
    async getSessionByAttempt(attemptId, roundType) {
        const query = `
            SELECT * FROM proctoring_sessions
            WHERE attempt_id = $1 AND round_type = $2;
        `;
        const result = await pool.query(query, [attemptId, roundType]);
        return result.rows[0];
    }

    /**
     * Get session by ID
     */
    async getSessionById(sessionId) {
        const query = `
            SELECT * FROM proctoring_sessions
            WHERE id = $1;
        `;
        const result = await pool.query(query, [sessionId]);
        return result.rows[0];
    }

    /**
     * End a proctoring session
     */
    async endSession(sessionId) {
        const query = `
            UPDATE proctoring_sessions
            SET ended_at = CURRENT_TIMESTAMP, status = 'COMPLETED'
            WHERE id = $1
            RETURNING *;
        `;
        const result = await pool.query(query, [sessionId]);
        return result.rows[0];
    }

    /**
     * Mark session as failed
     */
    async failSession(sessionId) {
        const query = `
            UPDATE proctoring_sessions
            SET status = 'FAILED', ended_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *;
        `;
        const result = await pool.query(query, [sessionId]);
        return result.rows[0];
    }

    /**
     * Create a proctoring event
     */
    async createEvent(sessionId, eventType, metadata = {}) {
        const query = `
            INSERT INTO proctoring_events (session_id, event_type, metadata)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const result = await pool.query(query, [sessionId, eventType, JSON.stringify(metadata)]);
        return result.rows[0];
    }

    /**
     * Get all events for a session
     */
    async getEventsBySession(sessionId) {
        const query = `
            SELECT * FROM proctoring_events
            WHERE session_id = $1
            ORDER BY timestamp ASC;
        `;
        const result = await pool.query(query, [sessionId]);
        return result.rows;
    }

    /**
     * Get event counts by type for a session
     */
    async getEventCountsByType(sessionId) {
        const query = `
            SELECT event_type, COUNT(*) as count
            FROM proctoring_events
            WHERE session_id = $1
            GROUP BY event_type;
        `;
        const result = await pool.query(query, [sessionId]);
        return result.rows;
    }

    /**
     * Create or update aggregated summary
     */
    async upsertAggregatedSummary(sessionId, summaryData) {
        const {
            total_no_face = 0,
            total_multiple_face = 0,
            total_looking_away = 0,
            total_tab_switch = 0,
            total_window_blur = 0,
            total_copy_paste = 0,
            total_phone_detected = 0,
            longest_looking_away_seconds = 0,
            risk_score = null,
            risk_level = null,
            llm_reason = null
        } = summaryData;

        const query = `
            INSERT INTO proctoring_aggregated_summaries (
                session_id, total_no_face, total_multiple_face, total_looking_away,
                total_tab_switch, total_window_blur, total_copy_paste, total_phone_detected,
                longest_looking_away_seconds, risk_score, risk_level, llm_reason,
                llm_evaluated_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 
                    ${risk_score !== null ? 'CURRENT_TIMESTAMP' : 'NULL'}, CURRENT_TIMESTAMP)
            ON CONFLICT (session_id) 
            DO UPDATE SET
                total_no_face = EXCLUDED.total_no_face,
                total_multiple_face = EXCLUDED.total_multiple_face,
                total_looking_away = EXCLUDED.total_looking_away,
                total_tab_switch = EXCLUDED.total_tab_switch,
                total_window_blur = EXCLUDED.total_window_blur,
                total_copy_paste = EXCLUDED.total_copy_paste,
                total_phone_detected = EXCLUDED.total_phone_detected,
                longest_looking_away_seconds = EXCLUDED.longest_looking_away_seconds,
                risk_score = EXCLUDED.risk_score,
                risk_level = EXCLUDED.risk_level,
                llm_reason = EXCLUDED.llm_reason,
                llm_evaluated_at = EXCLUDED.llm_evaluated_at,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;

        const result = await pool.query(query, [
            sessionId, total_no_face, total_multiple_face, total_looking_away,
            total_tab_switch, total_window_blur, total_copy_paste, total_phone_detected,
            longest_looking_away_seconds, risk_score, risk_level, llm_reason
        ]);
        return result.rows[0];
    }

    /**
     * Get aggregated summary for a session
     */
    async getAggregatedSummary(sessionId) {
        const query = `
            SELECT * FROM proctoring_aggregated_summaries
            WHERE session_id = $1;
        `;
        const result = await pool.query(query, [sessionId]);
        return result.rows[0];
    }

    /**
     * Update application with proctoring scores
     */
    async updateApplicationProctoring(jobId, candidateId, riskScore, riskLevel, reason) {
        const query = `
            UPDATE applications
            SET proctoring_risk_score = $3,
                proctoring_risk_level = $4,
                proctoring_reason = $5,
                updated_at = CURRENT_TIMESTAMP
            WHERE job_id = $1 AND candidate_id = $2
            RETURNING *;
        `;
        const result = await pool.query(query, [jobId, candidateId, riskScore, riskLevel, reason]);
        return result.rows[0];
    }

    /**
     * Get application by job and candidate
     */
    async getApplication(jobId, candidateId) {
        const query = `
            SELECT * FROM applications
            WHERE job_id = $1 AND candidate_id = $2;
        `;
        const result = await pool.query(query, [jobId, candidateId]);
        return result.rows[0];
    }
}

export default new ProctoringRepository();
