import AppError from '../../utils/AppError.js';
import { pool } from '../../config/db.js';
import technicalRepository from './technical.repository.js';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

class TechnicalService {
  async start(userId, body) {
    const { jobId } = body || {};
    if (!jobId) throw new AppError('jobId is required', 400);

    const candidateId = await technicalRepository.getCandidateIdByUserId(userId);
    if (!candidateId) throw new AppError('Candidate profile not found', 404);

    const applied = await technicalRepository.assertCandidateAppliedToJob(jobId, candidateId);
    if (!applied) throw new AppError('You are not assigned to this job', 403);

    // Check if interview window is active
    const win = await pool.query(
      'SELECT selection_lock_from, selection_lock_until FROM jobs WHERE id = $1',
      [jobId]
    );
    const fromRaw = win.rows[0]?.selection_lock_from;
    const untilRaw = win.rows[0]?.selection_lock_until;
    if (fromRaw && untilRaw) {
      const from = new Date(fromRaw);
      const until = new Date(untilRaw);
      if (!Number.isNaN(from.getTime()) && !Number.isNaN(until.getTime())) {
        const now = new Date();
        if (now < from) throw new AppError('Interview is not active yet. Please start within the interview window.', 403);
        if (now > until) throw new AppError('Interview window has ended.', 403);
      }
    }

    const jobCfg = await technicalRepository.getJobTechnicalConfig(jobId);
    if (!jobCfg || !jobCfg.technical_enabled) {
      throw new AppError('Technical interview is not enabled for this job', 403);
    }

    // Check if attempt already exists
    const existing = await technicalRepository.getAttempt(candidateId, jobId);
    if (existing) {
      if (existing.status === 'SUBMITTED') {
        throw new AppError('You have already submitted this technical interview', 403);
      }
      if (existing.status === 'EXPIRED') {
        throw new AppError('Your technical interview has expired', 403);
      }

      // Return existing attempt
      const questions = await technicalRepository.getQuestionsByIds(existing.question_ids);
      const responses = await technicalRepository.getResponses(existing.id);

      return {
        attemptId: existing.id,
        status: existing.status,
        startedAt: existing.started_at,
        endsAt: existing.ends_at,
        questions: questions.map(q => ({
          id: q.id,
          question: q.question_text,
          topic: q.topic,
          difficulty: q.difficulty,
          timeLimit: q.time_limit_seconds
        })),
        responses: responses.map(r => ({
          questionId: r.question_id,
          answer: r.answer,
          score: r.score,
          feedback: r.feedback
        }))
      };
    }

    // Create new attempt
    const duration = jobCfg.technical_duration_minutes || 30;
    const count = jobCfg.technical_question_count || 5;
    const topics = jobCfg.technical_topics || [];

    const endsAt = new Date(Date.now() + duration * 60 * 1000);
    const questionIds = await technicalRepository.getQuestionsForRound(topics, count);

    if (questionIds.length === 0) {
      throw new AppError('No questions available for this technical interview', 500);
    }

    let attempt;
    try {
      attempt = await technicalRepository.createAttempt(candidateId, jobId, endsAt, questionIds);
    } catch (err) {
      if (err.code === '23505') { // unique_violation
        return this.start(userId, body);
      }
      throw err;
    }

    const questions = await technicalRepository.getQuestionsByIds(questionIds);

    return {
      attemptId: attempt.id,
      status: attempt.status,
      startedAt: attempt.started_at,
      endsAt: attempt.ends_at,
      questions: questions.map(q => ({
        id: q.id,
        question: q.question_text,
        topic: q.topic,
        difficulty: q.difficulty,
        timeLimit: q.time_limit_seconds
      })),
      responses: []
    };
  }

  async submitAnswer(userId, body) {
    const { attemptId, questionId, answer } = body || {};
    
    if (!attemptId) throw new AppError('attemptId is required', 400);
    if (!questionId) throw new AppError('questionId is required', 400);
    if (!answer || typeof answer !== 'string') throw new AppError('answer is required', 400);

    const candidateId = await technicalRepository.getCandidateIdByUserId(userId);
    if (!candidateId) throw new AppError('Candidate profile not found', 404);

    const attempt = await technicalRepository.getAttemptById(attemptId);
    if (!attempt) throw new AppError('Attempt not found', 404);
    if (attempt.candidate_id !== candidateId) throw new AppError('Unauthorized', 403);
    if (attempt.status !== 'IN_PROGRESS') throw new AppError('Interview is not active', 403);

    // Check if time expired
    if (new Date() > new Date(attempt.ends_at)) {
      await technicalRepository.updateAttemptStatus(attemptId, 'EXPIRED', new Date(), null);
      throw new AppError('Interview time has expired', 403);
    }

    // Get question details
    const questions = await technicalRepository.getQuestionsByIds([questionId]);
    if (questions.length === 0) throw new AppError('Question not found', 404);
    const question = questions[0];

    // Call AI service for evaluation
    let evaluationData;
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/ai/technical/evaluate`, {
        question: question.question_text,
        answer: answer,
        expectedConcepts: question.expected_concepts || [],
        topic: question.topic
      }, {
        timeout: 30000
      });

      evaluationData = response.data;
    } catch (err) {
      console.error('AI evaluation error:', err.message);
      // Fallback evaluation if AI service fails
      evaluationData = {
        score: 5,
        feedback: 'Answer recorded. Evaluation pending.',
        correctness: 5,
        depth: 5,
        clarity: 5
      };
    }

    // Save response
    const savedResponse = await technicalRepository.saveResponse(
      attemptId,
      questionId,
      answer,
      evaluationData
    );

    return {
      questionId: savedResponse.question_id,
      score: savedResponse.score,
      feedback: savedResponse.feedback,
      correctness: savedResponse.correctness,
      depth: savedResponse.depth,
      clarity: savedResponse.clarity
    };
  }

  async submit(userId, body) {
    const { attemptId } = body || {};
    if (!attemptId) throw new AppError('attemptId is required', 400);

    const candidateId = await technicalRepository.getCandidateIdByUserId(userId);
    if (!candidateId) throw new AppError('Candidate profile not found', 404);

    const attempt = await technicalRepository.getAttemptById(attemptId);
    if (!attempt) throw new AppError('Attempt not found', 404);
    if (attempt.candidate_id !== candidateId) throw new AppError('Unauthorized', 403);
    if (attempt.status === 'SUBMITTED') throw new AppError('Already submitted', 403);

    // Get all responses and calculate final score
    const responses = await technicalRepository.getResponses(attemptId);
    
    let totalScore = 0;
    let count = 0;
    responses.forEach(r => {
      if (r.score !== null && r.score !== undefined) {
        totalScore += r.score;
        count++;
      }
    });

    const finalScore = count > 0 ? Math.round(totalScore / count) : 0;

    // Update attempt status
    await technicalRepository.updateAttemptStatus(
      attemptId,
      'SUBMITTED',
      new Date(),
      finalScore
    );

    // Update application score
    await technicalRepository.updateApplicationTechnicalScore(
      attempt.job_id,
      candidateId,
      finalScore
    );

    return {
      status: 'SUBMITTED',
      finalScore,
      submittedAt: new Date()
    };
  }

  async status(userId, query) {
    const { jobId } = query || {};
    if (!jobId) throw new AppError('jobId is required', 400);

    const candidateId = await technicalRepository.getCandidateIdByUserId(userId);
    if (!candidateId) throw new AppError('Candidate profile not found', 404);

    const attempt = await technicalRepository.getAttempt(candidateId, jobId);
    if (!attempt) {
      return { status: 'NOT_STARTED' };
    }

    const responses = await technicalRepository.getResponses(attempt.id);
    
    return {
      status: attempt.status,
      startedAt: attempt.started_at,
      endsAt: attempt.ends_at,
      submittedAt: attempt.submitted_at,
      finalScore: attempt.final_score,
      answeredCount: responses.filter(r => r.answer).length,
      totalQuestions: attempt.question_ids.length
    };
  }
}

export default new TechnicalService();
