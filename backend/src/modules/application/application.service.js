import applicationRepository from './application.repository.js';
import AppError from '../../utils/AppError.js';
import { pool } from '../../config/db.js';
import { processApplicationResume } from '../resume/resumeProcessing.service.js';

class ApplicationService {
    async createApplication(userId, jobId, resumeFilePath) {
        // Get candidate profile for this user
        const candidateResult = await pool.query(
            'SELECT id FROM candidate_profiles WHERE user_id = $1',
            [userId]
        );

        if (candidateResult.rows.length === 0) {
            throw new AppError('Candidate profile not found', 404);
        }

        const candidateId = candidateResult.rows[0].id;

        // Check if application already exists
        const existing = await applicationRepository.findByJobAndCandidate(jobId, candidateId);
        if (existing) {
            throw new AppError('You have already applied to this job', 400);
        }

        // Verify job exists and is published
        const jobResult = await pool.query(
            'SELECT id, status FROM jobs WHERE id = $1',
            [jobId]
        );

        if (jobResult.rows.length === 0) {
            throw new AppError('Job not found', 404);
        }

        if (jobResult.rows[0].status !== 'PUBLISHED') {
            throw new AppError('Cannot apply to unpublished jobs', 400);
        }

        const application = await applicationRepository.create({
            job_id: jobId,
            candidate_id: candidateId,
            resume_file_path: resumeFilePath,
            status: 'PENDING'
        });

        // Process resume with AI scoring (non-blocking error handling)
        try {
            console.log(`[Resume Processing] Starting AI scoring for application ${application.id}`);
            await processApplicationResume({ applicationId: application.id });
            console.log(`[Resume Processing] ✓ AI scoring completed for application ${application.id}`);
        } catch (aiError) {
            console.error(`[Resume Processing] ✗ AI scoring failed for application ${application.id}:`, aiError.message);
            // Don't fail the entire application creation if AI scoring fails
            // The resume can be re-processed later
        }

        return await applicationRepository.findById(application.id);
    }

    async getApplicationById(applicationId) {
        const application = await applicationRepository.findById(applicationId);

        if (!application) {
            throw new AppError('Application not found', 404);
        }

        return application;
    }

    async getApplicationsByJob(jobId, recruiterUserId) {
        // Verify recruiter has access to this job
        const jobResult = await pool.query(
            `SELECT j.id FROM jobs j
             JOIN recruiters r ON j.recruiter_id = r.id
             WHERE j.id = $1 AND r.user_id = $2`,
            [jobId, recruiterUserId]
        );

        if (jobResult.rows.length === 0) {
            throw new AppError('Job not found or access denied', 404);
        }

        return await applicationRepository.findByJobId(jobId);
    }

    async getApplicationsByRecruiter(recruiterUserId) {
        // Verify recruiter exists
        const recruiterResult = await pool.query(
            'SELECT id FROM recruiters WHERE user_id = $1',
            [recruiterUserId]
        );

        if (recruiterResult.rows.length === 0) {
            throw new AppError('Recruiter profile not found', 404);
        }

        const recruiterId = recruiterResult.rows[0].id;
        return await applicationRepository.findByRecruiterId(recruiterId);
    }

    async getApplicationsByCandidate(userId) {
        const candidateResult = await pool.query(
            'SELECT id FROM candidate_profiles WHERE user_id = $1',
            [userId]
        );

        if (candidateResult.rows.length === 0) {
            throw new AppError('Candidate profile not found', 404);
        }

        const candidateId = candidateResult.rows[0].id;
        return await applicationRepository.findByCandidateId(candidateId);
    }

    async updateApplicationStatus(applicationId, recruiterUserId, status) {
        // Verify recruiter has access to this application's job
        const application = await applicationRepository.findById(applicationId);

        if (!application) {
            throw new AppError('Application not found', 404);
        }

        const jobResult = await pool.query(
            `SELECT j.id FROM jobs j
             JOIN recruiters r ON j.recruiter_id = r.id
             WHERE j.id = $1 AND r.user_id = $2`,
            [application.job_id, recruiterUserId]
        );

        if (jobResult.rows.length === 0) {
            throw new AppError('Access denied', 403);
        }

        return await applicationRepository.update(applicationId, { status });
    }

    async checkApplicationExists(userId, jobId) {
        const candidateResult = await pool.query(
            'SELECT id FROM candidate_profiles WHERE user_id = $1',
            [userId]
        );

        if (candidateResult.rows.length === 0) {
            return false;
        }

        const candidateId = candidateResult.rows[0].id;
        const existing = await applicationRepository.findByJobAndCandidate(jobId, candidateId);
        return !!existing;
    }
}

export default new ApplicationService();
