import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import requireProfileCompleted from '../middleware/requireProfileCompleted.js';
import { resumeUpload, handleMulterError } from '../middleware/upload.middleware.js';
import { uploadResume } from '../controllers/resume.controller.js';

const router = express.Router();

router.use(protect);
router.use(requireProfileCompleted);

router.post(
  '/upload',
  restrictTo('CANDIDATE'),
  resumeUpload.single('resume'),
  handleMulterError,
  uploadResume
);

export default router;
