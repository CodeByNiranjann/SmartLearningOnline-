import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import moduleRoutes from './routes/moduleRoutes.js';
import lessonRoutes from './routes/lessonRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import instructorRoutes from './routes/instructorRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import projectRoutes, { projectEnrollmentRoutes, projectSubmissionRoutes } from './routes/projectRoutes.js';
import exerciseRoutes from './routes/exerciseRoutes.js';

import enrollmentRoutes from './routes/enrollmentRoutes.js';

dotenv.config();

const app = express();

// Middleware
const corsOrigin = process.env.CLIENT_URL || '*';
app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api', resourceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/project-enrollments', projectEnrollmentRoutes);
app.use('/api/project-submissions', projectSubmissionRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api', exerciseRoutes);

// Health Check Endpoint (SLP-19)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/', (req, res) => {
  res.send('Student Learning Platform API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

export default app;
