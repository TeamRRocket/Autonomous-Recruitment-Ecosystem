import axios from 'axios';
import proctoringRepository from './proctoring.repository.js';
import AppError from '../../utils/AppError.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

class ProctoringService {
    /**
     * Start a new proctoring session or reuse existing
     */
    async startSession(userId, jobId, roundType, attemptId, existingSessionId = null) {
        try {
            // Get candidate profile
            const candidateQuery = `
                SELECT id FROM candidate_profiles WHERE user_id = $1;
            `;
            const { pool } = await import('../../config/db.js');
            const candidateResult = await pool.query(candidateQuery, [userId]);

            if (!candidateResult.rows[0]) {
                throw new AppError('Candidate profile not found', 404);
            }

            const candidateId = candidateResult.rows[0].id;

            // If existing session ID provided, check if it's valid and active
            if (existingSessionId) {
                const existingSession = await proctoringRepository.getSessionById(existingSessionId);
                if (existingSession && existingSession.status === 'ACTIVE') {
                    console.log(`✓ Reusing existing proctoring session: ${existingSessionId}`);
                    return existingSession;
                }
            }

            // Check if session already exists for this attempt
            const existingSession = await proctoringRepository.getSessionByAttempt(attemptId, roundType);
            if (existingSession) {
                return existingSession;
            }

            // Create new session
            const session = await proctoringRepository.createSession(
                candidateId,
                jobId,
                roundType,
                attemptId
            );

            console.log(`✓ Proctoring session started: ${session.id}`);
            return session;
        } catch (error) {
            console.error('Error starting proctoring session:', error);
            throw error;
        }
    }

    /**
     * Process a browser event (tab switch, blur, copy/paste)
     */
    async processBrowserEvent(sessionId, eventType, metadata = {}) {
        try {
            const event = await proctoringRepository.createEvent(sessionId, eventType, metadata);
            console.log(`✓ Browser event recorded: ${eventType} for session ${sessionId}`);
            return event;
        } catch (error) {
            console.error('Error processing browser event:', error);
            // Don't throw - proctoring failures should not block exam
            return null;
        }
    }

    /**
     * Process frame data from frontend
     * Sends to Python AI service for OpenCV processing
     */
    async processFrame(sessionId, frameData) {
        try {
            // Call Python AI service for OpenCV processing
            const response = await axios.post(
                `${AI_SERVICE_URL}/ai/proctoring/process-frame`,
                {
                    session_id: sessionId,
                    frame_data: frameData
                },
                { timeout: 5000 }
            );

            const { face_count, looking_away, phone_detected } = response.data;

            // Create events based on OpenCV analysis
            if (face_count === 0) {
                await proctoringRepository.createEvent(sessionId, 'FACE_ABSENT', { face_count });
            } else if (face_count > 1) {
                await proctoringRepository.createEvent(sessionId, 'MULTIPLE_FACE', { face_count });
            }

            if (looking_away) {
                await proctoringRepository.createEvent(sessionId, 'LOOKING_AWAY', {});
            }

            if (phone_detected) {
                await proctoringRepository.createEvent(sessionId, 'PHONE_DETECTED', {});
            }

            return response.data;
        } catch (error) {
            console.error('Error processing frame:', error.message);
            // Don't throw - proctoring failures should not block exam
            return null;
        }
    }

    /**
     * End proctoring session and trigger LLM evaluation (synchronous)
     */
    async endSession(sessionId) {
        try {
            // End the session
            const session = await proctoringRepository.endSession(sessionId);

            if (!session) {
                throw new AppError('Session not found', 404);
            }

            console.log(`✓ Proctoring session ended: ${sessionId}`);

            // Aggregate events (synchronous)
            await this.aggregateEvents(sessionId);

            // Trigger LLM evaluation (synchronous - wait for completion)
            try {
                await this.evaluateRiskWithLLM(sessionId);
            } catch (llmErr) {
                console.error('LLM evaluation failed, using fallback:', llmErr.message);
                // Fallback to rule-based risk calculation
                await this.calculateFallbackRiskScore(sessionId);
            }

            return session;
        } catch (error) {
            console.error('Error ending proctoring session:', error);
            throw error;
        }
    }

    /**
     * Aggregate events into summary
     */
    async aggregateEvents(sessionId) {
        try {
            const eventCounts = await proctoringRepository.getEventCountsByType(sessionId);

            const summary = {
                total_no_face: 0,
                total_multiple_face: 0,
                total_looking_away: 0,
                total_tab_switch: 0,
                total_window_blur: 0,
                total_copy_paste: 0,
                total_phone_detected: 0,
                longest_looking_away_seconds: 0
            };

            eventCounts.forEach(({ event_type, count }) => {
                switch (event_type) {
                    case 'FACE_ABSENT':
                        summary.total_no_face = parseInt(count);
                        break;
                    case 'MULTIPLE_FACE':
                        summary.total_multiple_face = parseInt(count);
                        break;
                    case 'LOOKING_AWAY':
                        summary.total_looking_away = parseInt(count);
                        break;
                    case 'TAB_SWITCH':
                        summary.total_tab_switch = parseInt(count);
                        break;
                    case 'WINDOW_BLUR':
                        summary.total_window_blur = parseInt(count);
                        break;
                    case 'COPY_PASTE':
                        summary.total_copy_paste = parseInt(count);
                        break;
                    case 'PHONE_DETECTED':
                        summary.total_phone_detected = parseInt(count);
                        break;
                }
            });

            // Calculate longest looking away duration (simplified - count * 3 seconds average)
            summary.longest_looking_away_seconds = summary.total_looking_away * 3;

            const aggregatedSummary = await proctoringRepository.upsertAggregatedSummary(sessionId, summary);
            console.log(`✓ Events aggregated for session ${sessionId}`);

            return aggregatedSummary;
        } catch (error) {
            console.error('Error aggregating events:', error);
            throw error;
        }
    }

    /**
     * Evaluate risk using LLM (async, non-blocking)
     */
    async evaluateRiskWithLLM(sessionId) {
        try {
            const summary = await proctoringRepository.getAggregatedSummary(sessionId);

            if (!summary) {
                console.log(`No summary found for session ${sessionId}`);
                return;
            }

            // Call Python AI service for LLM evaluation
            const response = await axios.post(
                `${AI_SERVICE_URL}/ai/proctoring/evaluate-risk`,
                {
                    session_id: sessionId,
                    summary: {
                        total_no_face: summary.total_no_face,
                        total_multiple_face: summary.total_multiple_face,
                        total_looking_away: summary.total_looking_away,
                        total_tab_switch: summary.total_tab_switch,
                        total_window_blur: summary.total_window_blur,
                        total_copy_paste: summary.total_copy_paste,
                        total_phone_detected: summary.total_phone_detected,
                        longest_looking_away_seconds: summary.longest_looking_away_seconds
                    }
                },
                { timeout: 30000 }
            );

            const { risk_score, risk_level, reason } = response.data;

            // Update aggregated summary with LLM results
            await proctoringRepository.upsertAggregatedSummary(sessionId, {
                ...summary,
                risk_score,
                risk_level,
                llm_reason: reason
            });

            // Update application with combined proctoring scores from all sessions
            const session = await proctoringRepository.getSessionById(sessionId);
            if (session) {
                await this.updateApplicationOverallRisk(session.job_id, session.candidate_id);
                console.log(`✓ Application updated with combined proctoring scores`);
            }

            console.log(`✓ LLM risk evaluation completed for session ${sessionId}: ${risk_level} (${risk_score})`);

            return { risk_score, risk_level, reason };
        } catch (error) {
            console.error('Error evaluating risk with LLM:', error.message);

            // Fallback: Calculate basic risk score without LLM
            try {
                await this.calculateFallbackRiskScore(sessionId);
            } catch (fallbackError) {
                console.error('Fallback risk calculation also failed:', fallbackError.message);
            }
        }
    }

    /**
     * Calculate fallback risk score without LLM
     */
    async calculateFallbackRiskScore(sessionId) {
        const summary = await proctoringRepository.getAggregatedSummary(sessionId);

        if (!summary) return;

        // Simple rule-based scoring
        let riskScore = 0;

        riskScore += summary.total_no_face * 5;
        riskScore += summary.total_multiple_face * 10;
        riskScore += summary.total_looking_away * 2;
        riskScore += summary.total_tab_switch * 8;
        riskScore += summary.total_window_blur * 3;
        riskScore += summary.total_copy_paste * 15;
        riskScore += summary.total_phone_detected * 40;

        riskScore = Math.min(100, riskScore);

        let riskLevel = 'Low';
        if (riskScore >= 70) riskLevel = 'High';
        else if (riskScore >= 40) riskLevel = 'Medium';

        const reason = 'Risk assessment based on automated detection (LLM evaluation unavailable)';

        await proctoringRepository.upsertAggregatedSummary(sessionId, {
            ...summary,
            risk_score: riskScore,
            risk_level: riskLevel,
            llm_reason: reason
        });

        // Update application with combined risk from all sessions
        const session = await proctoringRepository.getSessionById(sessionId);
        if (session) {
            await this.updateApplicationOverallRisk(session.job_id, session.candidate_id);
        }

        console.log(`✓ Fallback risk score calculated for session ${sessionId}: ${riskLevel} (${riskScore})`);
    }

    /**
     * Update application with combined risk from all sessions
     */
    async updateApplicationOverallRisk(jobId, candidateId) {
        try {
            // Get all sessions for this application
            const { pool } = await import('../../config/db.js');
            const sessionsQuery = `
                SELECT ps.id, pas.total_no_face, pas.total_multiple_face, pas.total_looking_away,
                       pas.total_tab_switch, pas.total_window_blur, pas.total_copy_paste,
                       pas.total_phone_detected, pas.risk_score, pas.risk_level, pas.llm_reason
                FROM proctoring_sessions ps
                LEFT JOIN proctoring_aggregated_summaries pas ON pas.session_id = ps.id
                WHERE ps.job_id = $1 AND ps.candidate_id = $2 AND ps.status = 'COMPLETED'
            `;
            const result = await pool.query(sessionsQuery, [jobId, candidateId]);
            
            if (result.rows.length === 0) {
                console.log('No completed sessions found for combined risk calculation');
                return;
            }

            // Combine all event counts from all sessions
            const combined = {
                total_no_face: 0,
                total_multiple_face: 0,
                total_looking_away: 0,
                total_tab_switch: 0,
                total_window_blur: 0,
                total_copy_paste: 0,
                total_phone_detected: 0
            };

            for (const row of result.rows) {
                combined.total_no_face += Number(row.total_no_face || 0);
                combined.total_multiple_face += Number(row.total_multiple_face || 0);
                combined.total_looking_away += Number(row.total_looking_away || 0);
                combined.total_tab_switch += Number(row.total_tab_switch || 0);
                combined.total_window_blur += Number(row.total_window_blur || 0);
                combined.total_copy_paste += Number(row.total_copy_paste || 0);
                combined.total_phone_detected += Number(row.total_phone_detected || 0);
            }

            // Calculate combined risk score (using increased weights)
            let overallRiskScore = 0;
            const concerns = [];

            if (combined.total_no_face > 0) {
                overallRiskScore += combined.total_no_face * 8;
                concerns.push(`face absent ${combined.total_no_face} times`);
            }
            if (combined.total_multiple_face > 0) {
                overallRiskScore += combined.total_multiple_face * 15;
                concerns.push(`multiple faces ${combined.total_multiple_face} times`);
            }
            if (combined.total_looking_away > 0) {
                overallRiskScore += combined.total_looking_away * 3;
                concerns.push(`looking away ${combined.total_looking_away} times`);
            }
            if (combined.total_tab_switch > 0) {
                overallRiskScore += combined.total_tab_switch * 10;
                concerns.push(`${combined.total_tab_switch} tab switches`);
            }
            if (combined.total_window_blur > 0) {
                overallRiskScore += combined.total_window_blur * 4;
                concerns.push(`${combined.total_window_blur} window blur events`);
            }
            if (combined.total_copy_paste > 0) {
                overallRiskScore += combined.total_copy_paste * 20;
                concerns.push(`${combined.total_copy_paste} copy/paste attempts`);
            }
            if (combined.total_phone_detected > 0) {
                overallRiskScore += combined.total_phone_detected * 50;
                concerns.push(`phone detected ${combined.total_phone_detected} times`);
            }

            overallRiskScore = Math.min(100, overallRiskScore);

            let overallRiskLevel = 'Low';
            if (overallRiskScore >= 70) overallRiskLevel = 'High';
            else if (overallRiskScore >= 40) overallRiskLevel = 'Medium';

            const overallReason = concerns.length === 0
                ? 'No violations were detected based on the provided behavioral indicators. The candidate did not leave, avoid the camera, look away, switch tabs, attempt copy/paste, or have a phone detected.'
                : `Overall assessment across all exam rounds: ${concerns.join(', ')}. Combined risk evaluation based on cumulative violations.`;

            // Update application table with combined risk
            await proctoringRepository.updateApplicationProctoring(
                jobId,
                candidateId,
                overallRiskScore,
                overallRiskLevel,
                overallReason
            );

            console.log(`✓ Combined proctoring risk updated: ${overallRiskLevel} (${overallRiskScore}/100) - Sessions: ${result.rows.length}`);
        } catch (error) {
            console.error('Error updating application overall risk:', error);
        }
    }

    /**
     * Get session summary with all details
     */
    async getSessionSummary(sessionId) {
        try {
            const session = await proctoringRepository.getSessionById(sessionId);
            if (!session) {
                throw new AppError('Session not found', 404);
            }

            const events = await proctoringRepository.getEventsBySession(sessionId);
            const summary = await proctoringRepository.getAggregatedSummary(sessionId);

            return {
                session,
                events,
                summary
            };
        } catch (error) {
            console.error('Error getting session summary:', error);
            throw error;
        }
    }
}

export default new ProctoringService();
