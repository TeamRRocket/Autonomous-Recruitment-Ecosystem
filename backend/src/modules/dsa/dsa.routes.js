import express from 'express';
import { protect, restrictTo } from '../../middleware/authMiddleware.js';
import requireProfileCompleted from '../../middleware/requireProfileCompleted.js';
import * as dsaController from './dsa.controller.js';

const router = express.Router();

router.use(protect);
router.use(requireProfileCompleted);

// Recruiter (configure/publish; problems remain immutable)
router.get('/bank', restrictTo('RECRUITER'), dsaController.listBankProblems);
router.get('/config', restrictTo('RECRUITER'), dsaController.getConfig);
router.post('/config', restrictTo('RECRUITER'), dsaController.upsertConfig);
router.post('/publish', restrictTo('RECRUITER'), dsaController.publishConfig);

// Candidate
router.post('/start', restrictTo('CANDIDATE'), dsaController.start);
router.post('/run', restrictTo('CANDIDATE'), dsaController.run);
router.post('/save', restrictTo('CANDIDATE'), dsaController.saveDraft);
router.post('/submit', restrictTo('CANDIDATE'), dsaController.submit);
router.get('/status', restrictTo('CANDIDATE'), dsaController.status);
router.get('/result', restrictTo('CANDIDATE'), dsaController.result);

export default router;
