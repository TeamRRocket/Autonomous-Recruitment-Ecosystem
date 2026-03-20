import { pool } from '../../config/db.js';

class TechnicalRepository {
  async getCandidateIdByUserId(userId) {
    const res = await pool.query(
      'SELECT id FROM candidate_profiles WHERE user_id = $1',
      [userId]
    );
    return res.rows[0]?.id || null;
  }

  async assertCandidateAppliedToJob(jobId, candidateId) {
    const res = await pool.query(
      'SELECT 1 FROM applications WHERE job_id = $1 AND candidate_id = $2',
      [jobId, candidateId]
    );
    return res.rows.length > 0;
  }

  async getJobTechnicalConfig(jobId) {
    const res = await pool.query(
      `SELECT 
        id, 
        technical_enabled, 
        technical_duration_minutes,
        technical_question_count,
        technical_topics
      FROM jobs 
      WHERE id = $1`,
      [jobId]
    );
    
    let config = res.rows[0] || null;
    if (!config) return null;

    // Check for interview_rounds that might override/enable this
    const roundsRes = await pool.query(
      `SELECT 
         id,
         duration_minutes,
         num_questions,
         round_name
       FROM interview_rounds 
       WHERE job_id = $1 
       AND (round_type = 'TECHNICAL' OR round_name ILIKE '%Technical%')
       ORDER BY round_order ASC 
       LIMIT 1`,
      [jobId]
    );

    if (roundsRes.rows.length > 0) {
      const round = roundsRes.rows[0];
      
      // If we found a round, we consider technical assessment enabled
      config.technical_enabled = true;

      // Sync settings from round config if available
      if (round.duration_minutes) {
        config.technical_duration_minutes = round.duration_minutes;
      }
      
      if (round.num_questions) {
        config.technical_question_count = round.num_questions;
      }
    }

    return config;
  }

  async createAttempt(candidateId, jobId, endsAt, questionIds) {
    const res = await pool.query(
      `INSERT INTO technical_interview_attempts 
        (candidate_id, job_id, ends_at, question_ids, status)
      VALUES ($1, $2, $3, $4, 'IN_PROGRESS')
      RETURNING *`,
      [candidateId, jobId, endsAt, questionIds]
    );
    return res.rows[0];
  }

  async getAttempt(candidateId, jobId) {
    const res = await pool.query(
      `SELECT * FROM technical_interview_attempts 
       WHERE candidate_id = $1 AND job_id = $2`,
      [candidateId, jobId]
    );
    return res.rows[0] || null;
  }

  async getAttemptById(attemptId) {
    const res = await pool.query(
      'SELECT * FROM technical_interview_attempts WHERE id = $1',
      [attemptId]
    );
    return res.rows[0] || null;
  }

  async getQuestionsByIds(questionIds) {
    const res = await pool.query(
      `SELECT id, question_text, topic, difficulty, expected_concepts, time_limit_seconds
       FROM technical_questions 
       WHERE id = ANY($1::uuid[])
       ORDER BY ARRAY_POSITION($1::uuid[], id)`,
      [questionIds]
    );
    return res.rows;
  }

  async getQuestionsForRound(topics, count, difficulty = 'medium') {
    const topicsArray = Array.isArray(topics) ? topics : [topics];
    
    const res = await pool.query(
      `SELECT id FROM technical_questions
       WHERE difficulty = $1 
       AND (topic = ANY($2::text[]) OR $2 = '{}')
       ORDER BY RANDOM()
       LIMIT $3`,
      [difficulty, topicsArray, count]
    );
    return res.rows.map(r => r.id);
  }

  async saveResponse(attemptId, questionId, answer, evaluationData) {
    const res = await pool.query(
      `INSERT INTO technical_interview_responses 
        (attempt_id, question_id, answer, score, feedback, correctness, depth, clarity)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (attempt_id, question_id)
      DO UPDATE SET 
        answer = EXCLUDED.answer,
        score = EXCLUDED.score,
        feedback = EXCLUDED.feedback,
        correctness = EXCLUDED.correctness,
        depth = EXCLUDED.depth,
        clarity = EXCLUDED.clarity,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        attemptId,
        questionId,
        answer,
        evaluationData.score,
        evaluationData.feedback,
        evaluationData.correctness,
        evaluationData.depth,
        evaluationData.clarity
      ]
    );
    return res.rows[0];
  }

  async getResponses(attemptId) {
    const res = await pool.query(
      `SELECT * FROM technical_interview_responses 
       WHERE attempt_id = $1
       ORDER BY created_at`,
      [attemptId]
    );
    return res.rows;
  }

  async updateAttemptStatus(attemptId, status, submittedAt, finalScore) {
    const res = await pool.query(
      `UPDATE technical_interview_attempts 
       SET status = $2, submitted_at = $3, final_score = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [attemptId, status, submittedAt, finalScore]
    );
    return res.rows[0];
  }

  async updateApplicationTechnicalScore(jobId, candidateId, score) {
    await pool.query(
      `UPDATE applications 
       SET technical_score = $3
       WHERE job_id = $1 AND candidate_id = $2`,
      [jobId, candidateId, score]
    );
  }

  async getAllQuestions() {
    const res = await pool.query(
      'SELECT * FROM technical_questions ORDER BY topic, difficulty, created_at'
    );
    return res.rows;
  }

  async addQuestion(questionData) {
    const res = await pool.query(
      `INSERT INTO technical_questions 
        (question_text, topic, difficulty, expected_concepts, time_limit_seconds)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        questionData.question_text,
        questionData.topic,
        questionData.difficulty,
        questionData.expected_concepts || [],
        questionData.time_limit_seconds || 300
      ]
    );
    return res.rows[0];
  }
}

export default new TechnicalRepository();
