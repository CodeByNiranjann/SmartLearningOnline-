import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from './models/Course.js';
import User from './models/User.js';
import Quiz from './models/Quiz.js';

dotenv.config();

export async function seedSampleQuizzes() {
  try {
    const quizCount = await Quiz.countDocuments();
    if (quizCount >= 2) {
      console.log(`[SeedQuizzes] Already found ${quizCount} quizzes. Skipping seed.`);
      return;
    }

    console.log('[SeedQuizzes] Seeding sample instructor quizzes...');

    const instructor = await User.findOne({ email: 'instructor@learnhub.com' }) ||
      await User.findOne({ role: 'instructor' });

    if (!instructor) {
      console.warn('[SeedQuizzes] No instructor found. Skipping quiz seed.');
      return;
    }

    // Find course 1: Full-Stack Web Development
    const course1 = await Course.findOne({
      title: { $regex: /Full-Stack Web Development/i }
    }) || await Course.findOne();

    // Find course 2: Cloud Infrastructure or second available course
    const course2 = await Course.findOne({
      title: { $regex: /Cloud Infrastructure|DevOps|Machine Learning/i },
      _id: { $ne: course1?._id }
    }) || await Course.findOne({ _id: { $ne: course1?._id } });

    if (!course1) {
      console.warn('[SeedQuizzes] No courses found to attach quizzes to.');
      return;
    }

    const quizzesToInsert = [];

    // Sample Quiz 1: Full-Stack React & Node Fundamentals
    quizzesToInsert.push({
      title: 'Full-Stack React & Node Fundamentals Quiz',
      description: 'Evaluate your core understanding of React components, state, hooks, and Node.js REST API patterns.',
      courseId: course1._id,
      instructorId: course1.instructorId || instructor._id,
      timeLimit: 15,
      maxAttempts: 3,
      status: 'published',
      passingScore: 50,
      questions: [
        {
          questionText: 'What React hook is used to perform side-effects such as data fetching and DOM mutations?',
          type: 'single_choice',
          options: ['useState', 'useEffect', 'useMemo', 'useContext'],
          correctOptionIndex: 1,
          correctOptions: [1],
          explanation: 'useEffect is specifically designed for side-effects and asynchronous lifecycle actions in functional components.',
          points: 1,
          order: 0,
        },
        {
          questionText: 'Which of the following HTTP status codes represent client-side errors? (Select all that apply)',
          type: 'multiple_choice',
          options: ['200 OK', '400 Bad Request', '401 Unauthorized', '500 Internal Server Error', '404 Not Found'],
          correctOptionIndex: 1,
          correctOptions: [1, 2, 4],
          explanation: '4xx status codes (400, 401, 404) are client-side errors. 500 is a server error, and 200 is successful.',
          points: 2,
          order: 1,
        },
        {
          questionText: 'In React, state updates scheduled via useState setter functions may be batched asynchronously.',
          type: 'true_false',
          options: ['True', 'False'],
          correctBoolean: true,
          correctOptionIndex: 0,
          explanation: 'React batches state updates inside event handlers to minimize re-renders and maximize UI responsiveness.',
          points: 1,
          order: 2,
        },
        {
          questionText: 'What HTTP method is standard for submitting data to a REST API to create a new resource? (e.g. GET, POST, PUT, DELETE)',
          type: 'short_answer',
          options: [],
          acceptedAnswers: ['POST', 'post'],
          explanation: 'POST is the standard HTTP method used to send payload data to create a new resource on a server.',
          points: 1,
          order: 3,
        },
      ],
    });

    // Sample Quiz 2: Cloud Infrastructure & DevOps Mastery
    const targetCourse2 = course2 || course1;
    quizzesToInsert.push({
      title: 'Docker Containerization & DevOps Mastery Quiz',
      description: 'Test your skills in container hygiene, multi-stage Docker builds, and cloud deployment fundamentals.',
      courseId: targetCourse2._id,
      instructorId: targetCourse2.instructorId || instructor._id,
      timeLimit: 20,
      maxAttempts: 2,
      status: 'published',
      passingScore: 50,
      questions: [
        {
          questionText: 'Which Docker instruction sets the working directory for subsequent instructions inside a Dockerfile?',
          type: 'single_choice',
          options: ['WORKDIR', 'DIR', 'CD', 'FOLDER'],
          correctOptionIndex: 0,
          correctOptions: [0],
          explanation: 'WORKDIR sets the working directory for any RUN, CMD, ENTRYPOINT, COPY, and ADD instructions.',
          points: 1,
          order: 0,
        },
        {
          questionText: 'Which of the following are recommended best practices for production Docker images? (Select all that apply)',
          type: 'multiple_choice',
          options: [
            'Use multi-stage builds to exclude build tools from the final image',
            'Run processes as the root user for maximum privileges',
            'Use specific base image version tags rather than "latest"',
            'Include .git directories and local cache in production image'
          ],
          correctOptionIndex: 0,
          correctOptions: [0, 2],
          explanation: 'Multi-stage builds and pinning explicit version tags are fundamental security and optimization practices.',
          points: 2,
          order: 1,
        },
        {
          questionText: 'Docker containers share the host operating system kernel rather than hypervisor hardware virtualization.',
          type: 'true_false',
          options: ['True', 'False'],
          correctBoolean: true,
          correctOptionIndex: 0,
          explanation: 'Containers use OS-level virtualization sharing the host kernel, which makes them much lighter than VMs.',
          points: 1,
          order: 2,
        },
        {
          questionText: 'What Docker CLI command is used to display currently running containers?',
          type: 'short_answer',
          options: [],
          acceptedAnswers: ['docker ps', 'docker container ls'],
          explanation: 'Both "docker ps" and "docker container ls" list active containers.',
          points: 1,
          order: 3,
        },
      ],
    });

    for (const q of quizzesToInsert) {
      await Quiz.create(q);
      console.log(`[SeedQuizzes] Created sample quiz: "${q.title}"`);
    }

    console.log('[SeedQuizzes] Successfully seeded 2 sample quizzes!');
  } catch (err) {
    console.error('[SeedQuizzes] Error seeding sample quizzes:', err);
  }
}

// If executed directly from command line
if (process.argv[1]?.endsWith('seed-quizzes.js')) {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online-learning';
  mongoose.connect(primaryUri)
    .then(async () => {
      console.log('Connected to MongoDB. Running seed...');
      await seedSampleQuizzes();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to connect to MongoDB:', err.message);
      process.exit(1);
    });
}
