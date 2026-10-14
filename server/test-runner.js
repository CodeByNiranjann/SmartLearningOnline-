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

const PORT = process.env.TEST_PORT || 5002;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTestSuite() {
  console.log('================================================================');
  console.log('   SMART LEARNING PLATFORM — COMPREHENSIVE AUTOMATED TEST SUITE');
  console.log('================================================================\n');

  let serverInstance;
  let passed = 0;
  let failed = 0;
  const failureDetails = [];

  function assert(condition, testName, errorMsg = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} ${errorMsg ? '--> ' + errorMsg : ''}`);
      failed++;
      failureDetails.push(`${testName} ${errorMsg ? '--> ' + errorMsg : ''}`);
    }
  }

  try {
    // 1. Connect to MongoDB
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online-learning');
    }
    console.log('[INIT] MongoDB connection confirmed.');

    // 2. Start Server on test port
    await new Promise((resolve) => {
      serverInstance = app.listen(PORT, () => {
        console.log(`[INIT] Test Server running on port ${PORT}\n`);
        resolve();
      });
    });

    // Generate unique run identifiers
    const runId = Date.now();
    const adminEmail = `admin_test_${runId}@learnhub.test`;
    const inst1Email = `inst1_test_${runId}@learnhub.test`;
    const inst2Email = `inst2_test_${runId}@learnhub.test`;
    const studentEmail = `student_test_${runId}@learnhub.test`;
    const password = 'Password@123';

    // ─────────────────────────────────────────────────────────────────────────
    // MODULE 1: AUTHENTICATION & SESSION VALIDATION
    // ─────────────────────────────────────────────────────────────────────────
    console.log('--- 1. Authentication & Active Session Validation ---');

    // 1.1 Student Registration
    const studentReg = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Student Learner',
      email: studentEmail,
      password,
    });
    const studentToken = studentReg.data.token;
    const studentSessionId = studentReg.data.sessionId;
    const studentId = studentReg.data.user.id;
    assert(studentReg.status === 201 && studentToken && studentSessionId, 'Register student returns JWT token and Session ID');
    assert(studentReg.data.user.role === 'student', 'Default registered role is "student"');

    const studentHeaders = {
      Authorization: `Bearer ${studentToken}`,
      'X-Session-ID': studentSessionId,
    };

    // 1.2 Instructor 1 Registration & Role Promotion
    const inst1Reg = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Lead Instructor',
      email: inst1Email,
      password,
    });
    await User.findByIdAndUpdate(inst1Reg.data.user.id, { role: 'instructor' });
    const inst1Login = await axios.post(`${BASE_URL}/auth/login`, { email: inst1Email, password });
    const inst1Token = inst1Login.data.token;
    const inst1SessionId = inst1Login.data.sessionId;
    const inst1Id = inst1Login.data.user.id;
    const inst1Headers = {
      Authorization: `Bearer ${inst1Token}`,
      'X-Session-ID': inst1SessionId,
    };
    assert(inst1Login.data.user.role === 'instructor', 'Instructor 1 logged in with "instructor" role');

    // 1.3 Instructor 2 Registration & Role Promotion (for cross-ownership tests)
    const inst2Reg = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Secondary Instructor',
      email: inst2Email,
      password,
    });
    await User.findByIdAndUpdate(inst2Reg.data.user.id, { role: 'instructor' });
    const inst2Login = await axios.post(`${BASE_URL}/auth/login`, { email: inst2Email, password });
    const inst2Token = inst2Login.data.token;
    const inst2SessionId = inst2Login.data.sessionId;
    const inst2Id = inst2Login.data.user.id;
    const inst2Headers = {
      Authorization: `Bearer ${inst2Token}`,
      'X-Session-ID': inst2SessionId,
    };
    assert(inst2Login.data.user.role === 'instructor', 'Instructor 2 logged in for ownership testing');

    // 1.4 Admin Registration
    const adminReg = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Site Administrator',
      email: adminEmail,
      password,
    });
    await User.findByIdAndUpdate(adminReg.data.user.id, { role: 'admin' });
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, { email: adminEmail, password });
    const adminToken = adminLogin.data.token;
    const adminSessionId = adminLogin.data.sessionId;
    const adminId = adminLogin.data.user.id;
    const adminHeaders = {
      Authorization: `Bearer ${adminToken}`,
      'X-Session-ID': adminSessionId,
    };
    assert(adminLogin.data.user.role === 'admin', 'Admin logged in with "admin" role');

    // 1.5 Validate Active Sessions & Profile
    const meRes = await axios.get(`${BASE_URL}/auth/me`, { headers: studentHeaders });
    assert(meRes.status === 200 && meRes.data.user.email === studentEmail, 'GET /api/auth/me validates session');

    const sessionsRes = await axios.get(`${BASE_URL}/auth/sessions`, { headers: studentHeaders });
    assert(sessionsRes.status === 200 && Array.isArray(sessionsRes.data.activeSessions), 'GET /api/auth/sessions lists active sessions');

    // 1.6 Unauthenticated / Invalid Session Rejection
    try {
      await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${studentToken}`, 'X-Session-ID': 'invalid-session-xyz' },
      });
      assert(false, 'Request with invalid X-Session-ID rejected');
    } catch (err) {
      assert(err.response?.status === 401, 'Request with invalid X-Session-ID rejected with 401');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MODULE 2: COURSE CREATION, UPDATE & DELETION
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 2. Course Creation, Updates, & Curriculum ---');

    // 2.1 Instructor 1 creates a course
    const courseRes = await axios.post(
      `${BASE_URL}/courses`,
      {
        title: `Node.js Architecture ${runId}`,
        description: 'Deep dive into event-driven design',
        category: 'Backend Development',
        difficulty: 'Intermediate',
        duration: '6 Weeks',
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
        status: 'published',
      },
      { headers: inst1Headers }
    );
    const course1 = courseRes.data.course;
    assert(courseRes.status === 201 && course1?._id, 'Instructor creates published course');

    // 2.2 Instructor creates draft course (verify public filtering)
    const draftRes = await axios.post(
      `${BASE_URL}/courses`,
      {
        title: `Draft Unreleased Course ${runId}`,
        description: 'Not yet ready for public',
        category: 'Backend Development',
        difficulty: 'Advanced',
        duration: '2 Weeks',
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
        status: 'draft',
      },
      { headers: inst1Headers }
    );
    const draftCourse = draftRes.data.course;

    const publicCoursesRes = await axios.get(`${BASE_URL}/courses`);
    const containsDraft = publicCoursesRes.data.some((c) => c._id === draftCourse._id);
    assert(!containsDraft, 'Public learners cannot view unpublished / draft courses');

    // 2.3 Instructor updates course
    const updateRes = await axios.put(
      `${BASE_URL}/courses/${course1._id}`,
      { title: `Node.js Architecture & Patterns ${runId}` },
      { headers: inst1Headers }
    );
    assert(updateRes.status === 200 && updateRes.data.course.title.includes('Patterns'), 'Instructor updates course title');

    // 2.4 Instructor creates module
    const modRes = await axios.post(
      `${BASE_URL}/courses/${course1._id}/modules`,
      { title: 'Module 1: Event Loop Mechanics', order: 1 },
      { headers: inst1Headers }
    );
    const module1 = modRes.data.module;
    assert(modRes.status === 201 && module1?._id, 'Instructor creates module for course');

    // 2.5 Instructor creates lesson
    const lessonRes = await axios.post(
      `${BASE_URL}/modules/${module1._id}/lessons`,
      {
        title: 'Lesson 1.1: Microtasks vs Macrotasks',
        content: 'Comprehensive explanation of libuv, event queue, process.nextTick, and Promises.',
        order: 1,
      },
      { headers: inst1Headers }
    );
    const lesson1 = lessonRes.data.lesson;
    assert(lessonRes.status === 201 && lesson1?._id, 'Instructor creates lesson for module');

    // ─────────────────────────────────────────────────────────────────────────
    // MODULE 3: ROLE & COURSE OWNERSHIP BOUNDARIES
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 3. Role & Course-Ownership Boundaries ---');

    // 3.1 Student forbidden from creating course
    try {
      await axios.post(
        `${BASE_URL}/courses`,
        {
          title: 'Hacked Course',
          description: 'test',
          category: 'test',
          duration: '1 Week',
          thumbnail: 'http://example.com/pic.jpg',
        },
        { headers: studentHeaders }
      );
      assert(false, 'Student blocked from creating course');
    } catch (err) {
      assert(err.response?.status === 403, 'Student blocked from creating course with 403');
    }

    // 3.2 Instructor 2 cannot edit Instructor 1 course
    try {
      await axios.put(
        `${BASE_URL}/courses/${course1._id}`,
        { title: 'Vandalized Title' },
        { headers: inst2Headers }
      );
      assert(false, 'Cross-instructor course edit blocked');
    } catch (err) {
      assert(err.response?.status === 403, 'Instructor 2 forbidden from editing Instructor 1 course (403)');
    }

    // 3.3 Instructor 2 cannot add module to Instructor 1 course
    try {
      await axios.post(
        `${BASE_URL}/courses/${course1._id}/modules`,
        { title: 'Unauthorized Module' },
        { headers: inst2Headers }
      );
      assert(false, 'Cross-instructor module creation blocked');
    } catch (err) {
      assert(err.response?.status === 403, 'Instructor 2 forbidden from adding module to Instructor 1 course (403)');
    }

    // 3.4 Admin can manage any course
    const adminModRes = await axios.post(
      `${BASE_URL}/courses/${course1._id}/modules`,
      { title: 'Admin Oversight Module', order: 2 },
      { headers: adminHeaders }
    );
    assert(adminModRes.status === 201, 'Admin can create module in any course');

    // ─────────────────────────────────────────────────────────────────────────
    // MODULE 4: COURSE ENROLLMENT & DUPLICATE PREVENTION
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 4. Course Enrollment & Duplicate Prevention ---');

    // 4.1 Student enrolls in published course
    const enrollRes = await axios.post(
      `${BASE_URL}/courses/${course1._id}/enroll`,
      {},
      { headers: studentHeaders }
    );
    assert(enrollRes.status === 201 && enrollRes.data.isEnrolled === true, 'Student successfully enrolls in published course');

    // 4.2 Duplicate enrollment rejection
    try {
      await axios.post(
        `${BASE_URL}/courses/${course1._id}/enroll`,
        {},
        { headers: studentHeaders }
      );
      assert(false, 'Duplicate enrollment blocked');
    } catch (err) {
      assert(err.response?.status === 400, 'Duplicate enrollment rejected with 400');
    }

    // 4.3 Check enrollment status
    const statusRes = await axios.get(`${BASE_URL}/courses/${course1._id}/enrollment-status`, {
      headers: studentHeaders,
    });
    assert(statusRes.status === 200 && statusRes.data.isEnrolled === true, 'Enrollment status confirmed active');

    // ─────────────────────────────────────────────────────────────────────────
    // MODULE 5: LESSON PROGRESS TRACKING
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 5. Lesson Progress Tracking ---');

    // 5.1 Mark lesson complete
    const completeRes = await axios.post(
      `${BASE_URL}/progress/complete-lesson`,
      { courseId: course1._id, lessonId: lesson1._id },
      { headers: studentHeaders }
    );
    assert(completeRes.status === 200, 'Student marks lesson as complete');
    assert(completeRes.data.progress.completedLessons.includes(lesson1._id), 'Lesson stored in completedLessons');

    // 5.2 Fetch course progress
    const progressRes = await axios.get(`${BASE_URL}/progress/${course1._id}`, { headers: studentHeaders });
    assert(progressRes.status === 200 && progressRes.data.progressPercentage > 0, 'Course progress percentage accurately calculated');

    // 5.3 Fetch student summary
    const summaryRes = await axios.get(`${BASE_URL}/progress`, { headers: studentHeaders });
    assert(summaryRes.data.summary.coursesStarted >= 1, 'Overall student progress summary reflects started courses');

    // ─────────────────────────────────────────────────────────────────────────
    // MODULE 6: ASSESSMENT & QUIZ API (SLP-17)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 6. Assessment & Quiz APIs ---');

    // 6.1 Instructor 2 forbidden from attaching quiz to Instructor 1 course
    try {
      await axios.post(
        `${BASE_URL}/quizzes`,
        {
          lessonId: lesson1._id,
          courseId: course1._id,
          title: 'Unauthorized Quiz',
          questions: [
            {
              questionText: 'Test question?',
              options: ['A', 'B'],
              correctOptionIndex: 0,
            },
          ],
        },
        { headers: inst2Headers }
      );
      assert(false, 'Cross-instructor quiz creation blocked');
    } catch (err) {
      assert(err.response?.status === 403, 'Instructor 2 forbidden from creating quiz for Instructor 1 course (403)');
    }

    // 6.2 Instructor 1 creates assessment quiz
    const quizRes = await axios.post(
      `${BASE_URL}/quizzes`,
      {
        lessonId: lesson1._id,
        courseId: course1._id,
        title: 'Event Loop Knowledge Check',
        passingScore: 70,
        questions: [
          {
            questionText: 'Where do Promise callback resolutions execute?',
            options: ['Timer Phase', 'Microtask Queue', 'Macrotask Queue', 'Poll Phase'],
            correctOptionIndex: 1,
            explanation: 'Promise callbacks are microtasks processed immediately after current operation.',
          },
          {
            questionText: 'Which Node.js internal library implements the event loop?',
            options: ['V8', 'libuv', 'OpenSSL', 'zlib'],
            correctOptionIndex: 1,
            explanation: 'libuv provides the event loop and asynchronous I/O primitives.',
          },
        ],
      },
      { headers: inst1Headers }
    );
    const quiz1 = quizRes.data.quiz;
    assert(quizRes.status === 201 && quiz1?._id, 'Instructor 1 creates quiz assessment with questions and passing score');

    // 6.3 Public / Learner GET Quiz hides answer keys
    const learnerQuizRes = await axios.get(`${BASE_URL}/quizzes/lesson/${lesson1._id}`, {
      headers: studentHeaders,
    });
    assert(learnerQuizRes.status === 200, 'Student retrieves quiz for lesson');
    const firstQ = learnerQuizRes.data.quiz.questions[0];
    assert(firstQ.correctOptionIndex === undefined, 'Learner view does NOT leak correctOptionIndex');
    assert(firstQ.options.length === 4, 'Learner view includes all options for questions');

    // 6.4 Student submits quiz (Passing Attempt: 100%)
    const passSubmitRes = await axios.post(
      `${BASE_URL}/quizzes/${quiz1._id}/submit`,
      {
        answers: [
          { questionId: quiz1.questions[0]._id, selectedOptionIndex: 1 },
          { questionId: quiz1.questions[1]._id, selectedOptionIndex: 1 },
        ],
      },
      { headers: studentHeaders }
    );
    assert(passSubmitRes.status === 200, 'Quiz submission evaluated successfully');
    assert(passSubmitRes.data.score === 100, 'Student scored 100% on correct answers');
    assert(passSubmitRes.data.passed === true, 'Quiz passed flag is true');
    assert(passSubmitRes.data.feedback.length === 2, 'Feedback includes answer explanations');

    // 6.5 Student submits quiz (Failing Attempt: 0%)
    const failSubmitRes = await axios.post(
      `${BASE_URL}/quizzes/${quiz1._id}/submit`,
      {
        answers: [
          { questionId: quiz1.questions[0]._id, selectedOptionIndex: 0 },
          { questionId: quiz1.questions[1]._id, selectedOptionIndex: 0 },
        ],
      },
      { headers: studentHeaders }
    );
    assert(failSubmitRes.data.score === 0, 'Incorrect answers score 0%');
    assert(failSubmitRes.data.passed === false, 'Score below passing threshold marks passed as false');

    // 6.6 Student forbidden from deleting quiz
    try {
      await axios.delete(`${BASE_URL}/quizzes/${quiz1._id}`, { headers: studentHeaders });
      assert(false, 'Student blocked from deleting quiz');
    } catch (err) {
      assert(err.response?.status === 403, 'Student rejected from deleting quiz with 403');
    }

    // 6.7 Instructor 1 updates quiz
    const quizUpdateRes = await axios.put(
      `${BASE_URL}/quizzes/${quiz1._id}`,
      { title: 'Updated Event Loop Assessment', passingScore: 80 },
      { headers: inst1Headers }
    );
    assert(quizUpdateRes.status === 200 && quizUpdateRes.data.quiz.passingScore === 80, 'Instructor updates quiz passingScore');

    // ─────────────────────────────────────────────────────────────────────────
    // CLEANUP TEST ARTIFACTS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Cleanup: Purging Temporary Test Records ---');
    await Quiz.deleteMany({ courseId: course1._id });
    await Lesson.deleteMany({ courseId: course1._id });
    await Module.deleteMany({ courseId: course1._id });
    await Enrollment.deleteMany({ courseId: course1._id });
    await Progress.deleteMany({ courseId: course1._id });
    await Course.deleteMany({ _id: { $in: [course1._id, draftCourse._id] } });
    await User.deleteMany({ _id: { $in: [studentId, inst1Id, inst2Id, adminId] } });
    console.log('✓ Temporary test records cleanly removed.');

    // ─────────────────────────────────────────────────────────────────────────
    // SUMMARY REPORT
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n================================================================');
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('================================================================');

    if (failed > 0) {
      console.error('\nFAILED TEST SUMMARY:');
      failureDetails.forEach((d) => console.error(`  ❌ ${d}`));
      process.exit(1);
    } else {
      console.log('\n🎉 ALL REPEATABLE AUTOMATED INTEGRATION TESTS PASSED 100%!');
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal Test Suite Runner Exception:', err.response?.data || err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
  }
}

runTestSuite();
