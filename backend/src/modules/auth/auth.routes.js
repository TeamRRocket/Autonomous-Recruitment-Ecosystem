import express from 'express';
import authController from './auth.controller.js';

import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', authController.signup);
router.get('/verify-email', authController.verifyEmail);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);

router.post('/set-password', protect, authController.setPassword);

export default router;
