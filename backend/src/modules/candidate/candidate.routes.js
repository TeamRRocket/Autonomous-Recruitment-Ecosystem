import express from 'express';
import * as candidateController from './candidate.controller.js';
import { protect, restrictTo } from '../../middleware/authMiddleware.js'; // Assuming these exist from Phase 1

const router = express.Router();

router.use(protect);
router.use(restrictTo('CANDIDATE'));

router.post('/profile', candidateController.createProfile);
router.get('/profile', candidateController.getMyProfile);
router.put('/profile', candidateController.updateProfile);

export default router;
