import express from 'express';
import { protect, restrictTo } from '../../middleware/authMiddleware.js';
import requireProfileCompleted from '../../middleware/requireProfileCompleted.js';
import * as aptitudeController from './aptitude.controller.js';

const router = express.Router();

router.use(protect);
router.use(requireProfileCompleted);

router.post('/start', restrictTo('CANDIDATE'), aptitudeController.start);
router.post('/submit', restrictTo('CANDIDATE'), aptitudeController.submit);
router.get('/status', restrictTo('CANDIDATE'), aptitudeController.status);

export default router;
