import express from 'express';
import { protect, restrictTo } from '../../middleware/authMiddleware.js';
import requireProfileCompleted from '../../middleware/requireProfileCompleted.js';
import * as codingController from './coding.controller.js';

const router = express.Router();

router.use(protect);
router.use(requireProfileCompleted);

// Recruiter
router.post('/round/:roundId/problem', restrictTo('RECRUITER'), codingController.upsertProblem);
router.get('/round/:roundId/problem', restrictTo('RECRUITER'), codingController.getProblemForRecruiter);
router.get('/round/:roundId/submissions', restrictTo('RECRUITER'), codingController.listSubmissionsForRound);

// Candidate
router.get('/round/:roundId', restrictTo('CANDIDATE'), codingController.getProblemForCandidate);
router.post('/round/:roundId/run', restrictTo('CANDIDATE'), codingController.runCode);
router.post('/round/:roundId/submit', restrictTo('CANDIDATE'), codingController.submitCode);
router.get('/submission/:submissionId', restrictTo('CANDIDATE'), codingController.getSubmission);

export default router;
