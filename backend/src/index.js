import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Check DB Connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

import authRoutes from './modules/auth/auth.routes.js';
import candidateRoutes from './modules/candidate/candidate.routes.js';
import recruiterRoutes from './modules/recruiter/recruiter.routes.js';
import jobRoutes from './modules/job/job.routes.js';
import applicationRoutes from './modules/application/application.routes.js';
import roundRoutes from './modules/round/round.routes.js';
import errorHandler from './middleware/errorHandler.js';
import AppError from './utils/AppError.js';
import path from 'path';

// ... (previous code above)

// Routes
app.use('/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/recruiters', recruiterRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/rounds', roundRoutes);

// Serve uploaded files
app.use('/uploads/resumes', express.static(path.join(process.cwd(), 'uploads', 'resumes')));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// 404 Handler
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
