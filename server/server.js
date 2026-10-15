import app from './app.js';
import { connectDB } from './config/db.js';
<<<<<<< HEAD

import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import moduleRoutes from './routes/moduleRoutes.js';
import lessonRoutes from './routes/lessonRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import instructorRoutes from './routes/instructorRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
=======
import dotenv from 'dotenv';
>>>>>>> origin/main

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

<<<<<<< HEAD
// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', resourceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/instructor', instructorRoutes);

app.get('/', (req, res) => {
  res.send('Student Learning Platform API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

app.listen(PORT, () => {
=======
const server = app.listen(PORT, () => {
>>>>>>> origin/main
  console.log(`Server running on port ${PORT}`);
});

export { app, server };
export default app;
