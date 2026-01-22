import express from 'express';
import * as roundController from './round.controller.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Round management routes
router.post('/:jobId/rounds', roundController.createOrUpdateRounds);
router.get('/:jobId/rounds', roundController.getRounds);
router.put('/:jobId/rounds/:roundId', roundController.updateRound);
router.delete('/:jobId/rounds/:roundId', roundController.deleteRound);

export default router;
