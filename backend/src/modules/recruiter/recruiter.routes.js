import express from 'express';
import * as recruiterController from './recruiter.controller.js';
import { protect, restrictTo } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('RECRUITER'));

router.post('/onboarding', recruiterController.onboardRecruiter);
router.get('/profile', recruiterController.getMyProfile);
router.put('/profile', recruiterController.updateProfile);

export default router;
