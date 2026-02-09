import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always load backend/.env (works even if process is started from repo root)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

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
import codingRoutes from './modules/coding/coding.routes.js';
import dsaRoutes from './modules/dsa/dsa.routes.js';
import resumeRoutes from './routes/resume.routes.js';
import aiRoutes from './routes/ai.routes.js';
import errorHandler from './middleware/errorHandler.js';
import AppError from './utils/AppError.js';

// ... (previous code above)

// Routes
app.use('/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/recruiters', recruiterRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/rounds', roundRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/dsa', dsaRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/recruiter', aiRoutes);

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
