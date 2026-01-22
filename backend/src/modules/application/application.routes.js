import express from 'express';
import applicationController from './application.controller.js';
import { protect, restrictTo } from '../../middleware/authMiddleware.js';
import requireProfileCompleted from '../../middleware/requireProfileCompleted.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import catchAsync from '../../utils/catchAsync.js';
import AppError from '../../utils/AppError.js';

const router = express.Router();

// Configure multer for file uploads (PDF only)
const uploadDir = path.join(process.cwd(), 'uploads', 'resumes');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `resume-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        const error = new Error('Only PDF files are allowed');
        error.statusCode = 400;
        cb(error, false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

router.use(protect);
router.use(requireProfileCompleted);

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new AppError('File size must be less than 5MB', 400));
        }
        return next(new AppError(err.message, 400));
    }
    if (err) {
        return next(new AppError(err.message, err.statusCode || 400));
    }
    next();
};

// Candidate routes
router.post('/', restrictTo('CANDIDATE'), upload.single('resume'), handleMulterError, applicationController.create);
router.get('/my-applications', restrictTo('CANDIDATE'), applicationController.getMyApplications);
router.get('/check', restrictTo('CANDIDATE'), applicationController.checkApplication);

// Recruiter routes
router.get('/recruiter', restrictTo('RECRUITER'), applicationController.getByRecruiter);
router.get('/job/:jobId', restrictTo('RECRUITER'), applicationController.getByJob);
router.patch('/:id/status', restrictTo('RECRUITER'), applicationController.updateStatus);

// Shared routes
router.get('/:id', applicationController.getById);

export default router;
