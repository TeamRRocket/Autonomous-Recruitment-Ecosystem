import express from 'express';
import proctoringController from './proctoring.controller.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Start proctoring session
router.post('/start', proctoringController.startSession.bind(proctoringController));

// Record browser event
router.post('/event', proctoringController.recordEvent.bind(proctoringController));

// End proctoring session
router.post('/end', proctoringController.endSession.bind(proctoringController));

// Get session summary
router.get('/session/:sessionId', proctoringController.getSessionSummary.bind(proctoringController));

export default router;
