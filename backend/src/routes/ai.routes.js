import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import requireProfileCompleted from '../middleware/requireProfileCompleted.js';
import { rankCandidates } from '../controllers/ai.controller.js';

const router = express.Router();

router.use(protect);
router.use(requireProfileCompleted);

router.post('/job/:jobId/rank-candidates', restrictTo('RECRUITER'), rankCandidates);

export default router;
