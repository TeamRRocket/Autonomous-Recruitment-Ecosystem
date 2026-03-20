import express from 'express';
import { protect, restrictTo } from '../../middleware/authMiddleware.js';
import requireProfileCompleted from '../../middleware/requireProfileCompleted.js';
import * as technicalController from './technical.controller.js';

const router = express.Router();

router.use(protect);
router.use(requireProfileCompleted);

router.post('/start', restrictTo('CANDIDATE'), technicalController.start);
router.post('/submit-answer', restrictTo('CANDIDATE'), technicalController.submitAnswer);
router.post('/submit', restrictTo('CANDIDATE'), technicalController.submit);
router.get('/status', restrictTo('CANDIDATE'), technicalController.status);

export default router;
