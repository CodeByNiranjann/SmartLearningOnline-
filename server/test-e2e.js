import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app.js';
import User from './models/User.js';
import Course from './models/Course.js';
import Module from './models/Module.js';
import Lesson from './models/Lesson.js';
import Quiz from './models/Quiz.js';
import Enrollment from './models/Enrollment.js';
import Progress from './models/Progress.js';

dotenv.config();

const PORT = process.env.E2E_PORT || 5003;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runE2EValidation() {
  console.log('================================================================');
  console.log('  SMART LEARNING PLATFORM — END-TO-END CRITICAL JOURNEYS VALIDATION');
  console.log('================================================================\n');

  let serverInstance;
  let passed = 0;
  let failed = 0;

  function assert(condition, stepName, extra = '') {
    if (condition) {
      console.log(`  [E2E PASS] ${stepName}`);
      passed++;
    } else {
      console.error(`  [E2E FAIL] ${stepName} ${extra ? '--> ' + extra : ''}`);
      failed++;
    }
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online-learning');
    }
    console.log('[E2E INIT] Database connected.');

    await new Promise((resolve) => {
      serverInstance = app.listen(PORT, () => {
        console.log(`[E2E INIT] Server listening on port ${PORT}\n`);
        resolve();
      });
    });

    const runId = Date.now();
    const instEmail = `instructor_e2e_${runId}@learnhub.test`;
    const learnerEmail = `learner_e2e_${runId}@learnhub.test`;
    const adminEmail = `admin_e2e_${runId}@learnhub.test`;
    const password = 'Password@123';

    // ─────────────────────────────────────────────────────────────────────────
    // JOURNEY 1: INSTRUCTOR AUTHORING & CURRICULUM JOURNEY
    // ─────────────────────────────────────────────────────────────────────────
    console.log('--- Journey 1: Instructor Course Authoring & Assessment Setup ---');

    // 1.1 Instructor Registration & Role Setup
    const instReg = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Professor Ada Lovelace',
      email: instEmail,
      password,
    });
    await User.findByIdAndUpdate(instReg.data.user.id, { role: 'instructor' });
    const instLogin = await axios.post(`${BASE_URL}/auth/login`, { email: instEmail, password });
    const instHeaders = {
      Authorization: `Bearer ${instLogin.data.token}`,
      'X-Session-ID': instLogin.data.sessionId,
    };
    assert(instLogin.status === 200, 'Instructor successfully registers and logs in');

    // 1.2 Instructor Creates Course
    const courseRes = await axios.post(
      `${BASE_URL}/courses`,
      {
        title: `Full-Stack Cloud Architecture ${runId}`,
        description: 'End-to-end cloud applications using microservices and Docker.',
        category: 'Cloud Computing',
        difficulty: 'Advanced',
        duration: '8 Weeks',
        thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa',
        status: 'published',
      },
      { headers: instHeaders }
    );
    const courseId = courseRes.data.course._id;
    assert(courseRes.status === 201 && courseId, 'Instructor publishes new course');

    // 1.3 Instructor Adds Module
    const modRes = await axios.post(
      `${BASE_URL}/courses/${courseId}/modules`,
      { title: 'Module 1: Container Orchestration & Docker', order: 1 },
      { headers: instHeaders }
    );
    const moduleId = modRes.data.module._id;
    assert(modRes.status === 201 && moduleId, 'Instructor structures Module 1');

    // 1.4 Instructor Adds Lesson
    const lessonRes = await axios.post(
      `${BASE_URL}/modules/${moduleId}/lessons`,
      {
        title: 'Lesson 1.1: Multi-Stage Docker Builds',
        content: 'Learn how to reduce image sizes from 1GB to 50MB using multi-stage builds.',
        order: 1,
      },
      { headers: instHeaders }
    );
    const lessonId = lessonRes.data.lesson._id;
    assert(lessonRes.status === 201 && lessonId, 'Instructor publishes Lesson 1.1');

    // 1.5 Instructor Attaches Knowledge Check Assessment Quiz
    const quizRes = await axios.post(
      `${BASE_URL}/quizzes`,
      {
        lessonId,
        courseId,
        title: 'Docker Knowledge Assessment',
        passingScore: 75,
        questions: [
          {
            questionText: 'What is the primary benefit of multi-stage Docker builds?',
            options: ['Faster networks', 'Drastically reduced production image footprint', 'Automatic SSL', 'Runs on bare metal'],
            correctOptionIndex: 1,
            explanation: 'Multi-stage builds leave compiler toolchains behind, keeping production images lean.',
          },
        ],
      },
      { headers: instHeaders }
    );
    const quizId = quizRes.data.quiz._id;
    assert(quizRes.status === 201 && quizId, 'Instructor creates assessment quiz with automated grading rules');

    // ─────────────────────────────────────────────────────────────────────────
    // JOURNEY 2: LEARNER DISCOVERY, ENROLLMENT & COMPLETION JOURNEY
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Journey 2: Learner Catalog Discovery, Enrollment, Quiz & Completion ---');

    // 2.1 Learner Registration
    const learnerReg = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Alan Turing',
      email: learnerEmail,
      password,
    });
    const learnerHeaders = {
      Authorization: `Bearer ${learnerReg.data.token}`,
      'X-Session-ID': learnerReg.data.sessionId,
    };
    assert(learnerReg.status === 201, 'Learner registers new student account');

    // 2.2 Learner Browses Catalog & Views Details
    const catalogRes = await axios.get(`${BASE_URL}/courses`);
    const foundInCatalog = catalogRes.data.some((c) => c._id === courseId);
    assert(foundInCatalog, 'Learner discovers newly published course in course catalog');

    const courseDetailRes = await axios.get(`${BASE_URL}/courses/${courseId}`);
    assert(courseDetailRes.status === 200 && courseDetailRes.data.title.includes('Cloud Architecture'), 'Learner views detailed course syllabus');

    // 2.3 Learner Enrolls
    const enrollRes = await axios.post(`${BASE_URL}/courses/${courseId}/enroll`, {}, { headers: learnerHeaders });
    assert(enrollRes.status === 201 && enrollRes.data.isEnrolled === true, 'Learner successfully enrolls in course');

    // 2.4 Learner Views Lesson & Fetches Quiz
    const lessonViewRes = await axios.get(`${BASE_URL}/lessons/${lessonId}`);
    assert(lessonViewRes.status === 200, 'Learner accesses Lesson 1.1 workspace');

    const quizViewRes = await axios.get(`${BASE_URL}/quizzes/lesson/${lessonId}`, { headers: learnerHeaders });
    assert(quizViewRes.status === 200 && quizViewRes.data.quiz.questions[0].correctOptionIndex === undefined, 'Learner loads sanitized assessment quiz without answer leaks');

    // 2.5 Learner Submits Quiz and Passes
    const submitQuizRes = await axios.post(
      `${BASE_URL}/quizzes/${quizId}/submit`,
      {
        answers: [{ questionId: quizViewRes.data.quiz.questions[0]._id, selectedOptionIndex: 1 }],
      },
      { headers: learnerHeaders }
    );
    assert(submitQuizRes.status === 200 && submitQuizRes.data.passed === true && submitQuizRes.data.score === 100, 'Learner passes quiz assessment with 100%');

    // 2.6 Learner Marks Lesson Complete
    const completeLessonRes = await axios.post(
      `${BASE_URL}/progress/complete-lesson`,
      { courseId, lessonId },
      { headers: learnerHeaders }
    );
    assert(completeLessonRes.status === 200 && completeLessonRes.data.progress.progressPercentage === 100, 'Learner completes lesson and hits 100% course progress');

    // 2.7 Learner Checks Dashboard
    const dashboardProgress = await axios.get(`${BASE_URL}/progress`, { headers: learnerHeaders });
    assert(dashboardProgress.data.summary.coursesCompleted >= 1, 'Learner dashboard accurately updates completed course metrics');

    // ─────────────────────────────────────────────────────────────────────────
    // JOURNEY 3: INSTRUCTOR ENROLLMENT TRACKING & ADMIN GOVERNANCE JOURNEY
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Journey 3: Instructor Analytics & Admin Governance ---');

    // 3.1 Instructor Views Enrolled Students
    const instructorStudentsRes = await axios.get(`${BASE_URL}/instructor/students`, { headers: instHeaders });
    assert(instructorStudentsRes.status === 200 && Array.isArray(instructorStudentsRes.data), 'Instructor views active students enrolled in their course');

    // 3.2 Admin Oversight
    const adminReg = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'System Admin',
      email: adminEmail,
      password,
    });
    await User.findByIdAndUpdate(adminReg.data.user.id, { role: 'admin' });
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, { email: adminEmail, password });
    const adminHeaders = {
      Authorization: `Bearer ${adminLogin.data.token}`,
      'X-Session-ID': adminLogin.data.sessionId,
    };

    const adminStatsRes = await axios.get(`${BASE_URL}/admin/stats`, { headers: adminHeaders });
    assert(adminStatsRes.status === 200 && adminStatsRes.data.totalCourses >= 1, 'Admin console displays platform analytics');

    // ─────────────────────────────────────────────────────────────────────────
    // CLEANUP
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Cleanup E2E Test Records ---');
    await Quiz.deleteMany({ courseId });
    await Lesson.deleteMany({ courseId });
    await Module.deleteMany({ courseId });
    await Enrollment.deleteMany({ courseId });
    await Progress.deleteMany({ courseId });
    await Course.deleteOne({ _id: courseId });
    await User.deleteMany({ email: { $in: [instEmail, learnerEmail, adminEmail] } });
    console.log('✓ E2E artifacts cleanly removed from database.');

    console.log('\n================================================================');
    console.log(`E2E VALIDATION RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('🎉 ALL CRITICAL USER JOURNEYS VALIDATED END-TO-END!');
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal E2E Validation Error:', err.response?.data || err.message);
    process.exit(1);
  } finally {
    if (serverInstance) serverInstance.close();
    await mongoose.disconnect();
  }
}

runE2EValidation();
