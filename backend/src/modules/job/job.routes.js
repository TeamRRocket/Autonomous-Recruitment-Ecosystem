import express from 'express';
import * as jobController from './job.controller.js';
import { protect, restrictTo } from '../../middleware/authMiddleware.js';
import requireProfileCompleted from '../../middleware/requireProfileCompleted.js';
import requireOwnership from '../../middleware/requireOwnership.js';

const router = express.Router();

// All routes require auth and profile completion
router.use(protect);
router.use(requireProfileCompleted);

// Public (Authenticated) Routes - Specific routes must come before parameterized routes
router.get('/published', jobController.getPublishedJobs); // Explicit published list
router.get('/search', jobController.searchJobs); // Search jobs
router.get('/', jobController.getPublishedJobs); // Default: published jobs

// Recruiter Only Routes - Specific routes before parameterized
router.post('/', restrictTo('RECRUITER'), jobController.createJob);
router.get('/recruiter/my-jobs', restrictTo('RECRUITER'), jobController.getMyJobs);
router.post('/:id/publish', restrictTo('RECRUITER'), requireOwnership, jobController.publishJob);
router.get('/:id/overview', restrictTo('RECRUITER'), requireOwnership, jobController.getJobOverview);

// Parameterized routes - Must come after specific routes
router.get('/:id', jobController.getJob);
router.patch('/:id', restrictTo('RECRUITER'), requireOwnership, jobController.updateJob);
router.delete('/:id', restrictTo('RECRUITER'), requireOwnership, jobController.deleteJob);

export default router;
