import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FormData from 'form-data';
import app from './app.js';
import User from './models/User.js';
import Course from './models/Course.js';
import Module from './models/Module.js';
import Lesson from './models/Lesson.js';
import Enrollment from './models/Enrollment.js';
import PracticalExercise from './models/PracticalExercise.js';
import ExerciseSubmission from './models/ExerciseSubmission.js';

dotenv.config();

const PORT = process.env.TEST_PORT || 5004;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runExercisesTestSuite() {
  console.log('================================================================');
  console.log('   SPRINT 2: PRACTICAL EXERCISES — AUTOMATED TEST SUITE');
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
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online-learning');
    }
    console.log('[INIT] MongoDB connection confirmed.');

    await new Promise((resolve) => {
      serverInstance = app.listen(PORT, () => {
        console.log(`[INIT] Test Server running on port ${PORT}\n`);
        resolve();
      });
    });

    const runId = Date.now();
    const student1Email = `student1_ex_${runId}@learnhub.test`;
    const student2Email = `student2_ex_${runId}@learnhub.test`;
    const inst1Email = `inst1_ex_${runId}@learnhub.test`;
    const inst2Email = `inst2_ex_${runId}@learnhub.test`;
    const adminEmail = `admin_ex_${runId}@learnhub.test`;
    const password = 'Password@123';

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 1: Authentication & Test Accounts Setup
    // ─────────────────────────────────────────────────────────────────────────
    console.log('--- 1. Authentication & Role-Based Accounts Setup ---');

    // Register Student 1
    const regStudent1 = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Enrolled Student',
      email: student1Email,
      password,
    });
    const s1Token = regStudent1.data.token;
    const s1Session = regStudent1.data.sessionId;
    const s1Id = regStudent1.data.user.id || regStudent1.data.user._id;
    const s1Headers = { Authorization: `Bearer ${s1Token}`, 'X-Session-ID': s1Session };

    // Register Student 2 (Unenrolled)
    const regStudent2 = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Unenrolled Student',
      email: student2Email,
      password,
    });
    const s2Token = regStudent2.data.token;
    const s2Session = regStudent2.data.sessionId;
    const s2Id = regStudent2.data.user.id || regStudent2.data.user._id;
    const s2Headers = { Authorization: `Bearer ${s2Token}`, 'X-Session-ID': s2Session };

    // Register Instructor 1
    const regInst1 = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Lead Instructor 1',
      email: inst1Email,
      password,
    });
    const inst1Id = regInst1.data.user.id || regInst1.data.user._id;
    await User.findByIdAndUpdate(inst1Id, { role: 'instructor' });
    const loginInst1 = await axios.post(`${BASE_URL}/auth/login`, { email: inst1Email, password });
    const inst1Token = loginInst1.data.token;
    const inst1Session = loginInst1.data.sessionId;
    const inst1Headers = { Authorization: `Bearer ${inst1Token}`, 'X-Session-ID': inst1Session };

    // Register Instructor 2 (Other instructor for ownership tests)
    const regInst2 = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Other Instructor 2',
      email: inst2Email,
      password,
    });
    const inst2Id = regInst2.data.user.id || regInst2.data.user._id;
    await User.findByIdAndUpdate(inst2Id, { role: 'instructor' });
    const loginInst2 = await axios.post(`${BASE_URL}/auth/login`, { email: inst2Email, password });
    const inst2Token = loginInst2.data.token;
    const inst2Session = loginInst2.data.sessionId;
    const inst2Headers = { Authorization: `Bearer ${inst2Token}`, 'X-Session-ID': inst2Session };

    // Register Admin
    const regAdmin = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Platform Admin',
      email: adminEmail,
      password,
    });
    const adminId = regAdmin.data.user.id || regAdmin.data.user._id;
    await User.findByIdAndUpdate(adminId, { role: 'admin' });
    const loginAdmin = await axios.post(`${BASE_URL}/auth/login`, { email: adminEmail, password });
    const adminToken = loginAdmin.data.token;
    const adminSession = loginAdmin.data.sessionId;
    const adminHeaders = { Authorization: `Bearer ${adminToken}`, 'X-Session-ID': adminSession };

    assert(s1Token && inst1Token && inst2Token && adminToken, 'All role-based test tokens generated');

    // Create Test Courses, Modules, and Lessons
    const testCourse1 = await Course.create({
      title: `Test Course 1 ${runId}`,
      description: 'Test course for exercises',
      category: 'Web Development',
      difficulty: 'Beginner',
      duration: '4 Weeks',
      instructor: 'Lead Instructor 1',
      instructorId: inst1Id,
      thumbnail: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613',
    });

    const testCourse2 = await Course.create({
      title: `Test Course 2 ${runId}`,
      description: 'Second course owned by Instructor 2',
      category: 'Cloud & DevOps',
      difficulty: 'Intermediate',
      duration: '2 Weeks',
      instructor: 'Other Instructor 2',
      instructorId: inst2Id,
      thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9',
    });

    const mod1 = await Module.create({
      courseId: testCourse1._id,
      title: 'Module 1 for Course 1',
      order: 1,
    });

    const lesson1 = await Lesson.create({
      courseId: testCourse1._id,
      moduleId: mod1._id,
      title: 'Lesson 1.1 for Course 1',
      content: 'Sample content',
      order: 1,
    });

    // Enroll Student 1 in Course 1
    const enrollment1 = await Enrollment.create({
      userId: s1Id,
      courseId: testCourse1._id,
      status: 'active',
    });

    assert(testCourse1 && testCourse2 && enrollment1, 'Test courses and enrollment records initialized');

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 2: Instructor Exercise Creation & Relationship Validation
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 2. Exercise Creation & Course-Module-Lesson Validation ---');

    // 2.1 Unauthorized student blocked from creating exercise
    try {
      await axios.post(
        `${BASE_URL}/courses/${testCourse1._id}/exercises`,
        { title: 'Bad Exercise', description: 'desc', instructions: 'inst' },
        { headers: s1Headers }
      );
      assert(false, 'Student blocked from creating exercise', 'Should have failed with 403');
    } catch (err) {
      assert(err.response?.status === 403, 'Student rejected from creating exercise (403)');
    }

    // 2.2 Instructor 2 forbidden from creating exercise on Instructor 1 course
    try {
      await axios.post(
        `${BASE_URL}/courses/${testCourse1._id}/exercises`,
        { title: 'Bad Exercise', description: 'desc', instructions: 'inst' },
        { headers: inst2Headers }
      );
      assert(false, 'Instructor 2 forbidden from Course 1', 'Should have failed with 403');
    } catch (err) {
      assert(err.response?.status === 403, 'Instructor 2 forbidden from creating exercise on Course 1 (403)');
    }

    // 2.3 Reject lesson that does NOT belong to the course
    try {
      await axios.post(
        `${BASE_URL}/courses/${testCourse2._id}/exercises`,
        {
          title: 'Mismatched Exercise',
          description: 'desc',
          instructions: 'inst',
          lessonId: lesson1._id, // lesson1 belongs to Course 1, not Course 2!
        },
        { headers: inst2Headers }
      );
      assert(false, 'Mismatched lesson rejected', 'Should have failed with 400');
    } catch (err) {
      assert(err.response?.status === 400, 'Invalid course-lesson relationship rejected with 400');
      assert(err.response?.data?.message.includes('does not belong'), 'Clear actionable error message returned');
    }

    // 2.4 Instructor 1 creates valid Coding Exercise
    const createRes = await axios.post(
      `${BASE_URL}/courses/${testCourse1._id}/exercises`,
      {
        title: 'Async API Handler Exercise',
        description: 'Build an Express async handler with error handling',
        learningObjectives: ['Master async/await in Express', 'Proper HTTP status codes'],
        instructions: 'Implement the handler function and return status 200 with result payload.',
        exerciseType: 'Coding Exercise',
        difficulty: 'Intermediate',
        estimatedMinutes: 30,
        maximumMarks: 100,
        passingMarks: 70,
        moduleId: mod1._id,
        lessonId: lesson1._id,
        referenceMaterials: [{ title: 'Express Docs', url: 'https://expressjs.com' }],
        status: 'Published',
      },
      { headers: inst1Headers }
    );

    assert(createRes.status === 201, 'Instructor 1 successfully creates practical exercise (201)');
    const createdExId = createRes.data.exercise._id;
    assert(createRes.data.exercise.exerciseType === 'Coding Exercise', 'Exercise type stored correctly');

    // 2.5 Instructor 1 creates a File Upload Exercise
    const createFileExRes = await axios.post(
      `${BASE_URL}/courses/${testCourse1._id}/exercises`,
      {
        title: 'Architecture Diagram & Report Upload',
        description: 'Upload system architecture diagram in PDF or TXT format',
        instructions: 'Submit a verified PDF or TXT diagram explanation.',
        exerciseType: 'File Upload',
        difficulty: 'Beginner',
        estimatedMinutes: 20,
        maximumMarks: 50,
        passingMarks: 35,
        status: 'Published',
      },
      { headers: inst1Headers }
    );
    const fileExId = createFileExRes.data.exercise._id;
    assert(createFileExRes.status === 201, 'File upload exercise created successfully');

    // 2.6 Admin can create exercise on any course
    const adminCreateRes = await axios.post(
      `${BASE_URL}/courses/${testCourse2._id}/exercises`,
      {
        title: 'Admin Created Cloud Exercise',
        description: 'Created by administrator',
        instructions: 'Complete container analysis.',
        exerciseType: 'Text Answer',
        difficulty: 'Advanced',
        status: 'Published',
      },
      { headers: adminHeaders }
    );
    assert(adminCreateRes.status === 201, 'Admin can create exercise on any course');

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 3: Learner Discovery & Filtering
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 3. Learner Exercise Discovery & Filtering ---');

    const listRes = await axios.get(`${BASE_URL}/exercises`, { headers: s1Headers });
    assert(listRes.status === 200, 'GET /api/exercises returns 200');
    assert(Array.isArray(listRes.data.exercises), 'Response contains exercises array');
    assert(listRes.data.exercises.length >= 2, 'Exercises found in listing');

    // Filter by exerciseType
    const filterTypeRes = await axios.get(`${BASE_URL}/exercises?exerciseType=File Upload`, {
      headers: s1Headers,
    });
    assert(filterTypeRes.status === 200, 'GET /api/exercises?exerciseType=File Upload returns 200');
    const allFileTypes = filterTypeRes.data.exercises.every((e) => e.exerciseType === 'File Upload');
    assert(allFileTypes, 'All filtered items have File Upload exerciseType');

    // Get exercise details
    const detailRes = await axios.get(`${BASE_URL}/exercises/${createdExId}`, { headers: s1Headers });
    assert(detailRes.status === 200, 'GET /api/exercises/:exerciseId returns 200');
    assert(detailRes.data.exercise.title === 'Async API Handler Exercise', 'Retrieved exercise matches title');
    assert(detailRes.data.isEnrolled === true, 'Learner enrollment status confirmed true');

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 4: Learner Submission Workflows & Enrollment Check
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 4. Learner Submission Workflows & Enrollment Check ---');

    // 4.1 Unenrolled learner rejected with 403
    try {
      await axios.post(
        `${BASE_URL}/exercises/${createdExId}/submissions`,
        { textAnswer: 'My solution' },
        { headers: s2Headers }
      );
      assert(false, 'Unenrolled student rejected', 'Should have failed with 403');
    } catch (err) {
      assert(err.response?.status === 403, 'Unenrolled learner submission rejected with 403');
      assert(err.response?.data?.message.includes('enrolled'), 'Returns actionable enrollment message');
    }

    // 4.2 Enrolled student saves draft as "In Progress"
    const draftRes = await axios.post(
      `${BASE_URL}/exercises/${createdExId}/submissions`,
      { textAnswer: 'Working on solution...', saveAsDraft: true },
      { headers: s1Headers }
    );
    assert(draftRes.status === 200 || draftRes.status === 201, 'Student saves work as In Progress');
    assert(draftRes.data.submission.submissionStatus === 'In Progress', 'Submission status is "In Progress"');

    // 4.3 Enrolled student submits final code answer (Attempt 1)
    const submit1Res = await axios.post(
      `${BASE_URL}/exercises/${createdExId}/submissions`,
      {
        textAnswer: 'const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);',
        saveAsDraft: false,
      },
      { headers: s1Headers }
    );
    assert(submit1Res.status === 200 || submit1Res.status === 201, 'Student submits solution (Attempt 1)');
    assert(submit1Res.data.submission.submissionStatus === 'Submitted', 'Status updated to "Submitted"');
    assert(submit1Res.data.submission.attemptNumber === 1, 'Attempt number is 1');

    const subId = submit1Res.data.submission._id;

    // Student retrieves personal submission
    const mySubRes = await axios.get(`${BASE_URL}/exercises/${createdExId}/submissions/me`, {
      headers: s1Headers,
    });
    assert(mySubRes.status === 200, 'GET /api/exercises/:id/submissions/me returns 200');
    assert(mySubRes.data.submission._id === subId, 'Matches submitted record');

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 5: File Upload & Security Validation
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 5. File Upload & Security Validation ---');

    // 5.1 Reject unsupported file extension (e.g. .exe)
    const badForm = new FormData();
    badForm.append('file', Buffer.from('malicious content'), {
      filename: 'exploit.exe',
      contentType: 'application/octet-stream',
    });

    try {
      await axios.post(`${BASE_URL}/exercises/${fileExId}/submissions`, badForm, {
        headers: { ...s1Headers, ...badForm.getHeaders() },
      });
      assert(false, 'Unsupported file extension rejected', 'Should have failed with 400');
    } catch (err) {
      assert(err.response?.status === 400, 'Unsupported file format rejected with 400');
      assert(err.response?.data?.message.includes('Supported formats'), 'Error describes allowed formats');
    }

    // 5.2 Upload valid text file (.txt)
    const validForm = new FormData();
    validForm.append('file', Buffer.from('System Architecture Component Specs\n- Client: React\n- API: Express'), {
      filename: 'architecture_diagram.txt',
      contentType: 'text/plain',
    });

    const fileSubRes = await axios.post(`${BASE_URL}/exercises/${fileExId}/submissions`, validForm, {
      headers: { ...s1Headers, ...validForm.getHeaders() },
    });
    assert(fileSubRes.status === 200 || fileSubRes.status === 201, 'Valid file uploaded successfully');
    assert(fileSubRes.data.submission.fileReference?.originalName.includes('architecture_diagram.txt'), 'Original filename safely stored');
    const fileSubId = fileSubRes.data.submission._id;

    // 5.3 Secure File Download
    const fileDownloadRes = await axios.get(`${BASE_URL}/submissions/${fileSubId}/file`, {
      headers: s1Headers,
    });
    assert(fileDownloadRes.status === 200, 'Student can securely download submitted file');
    assert(fileDownloadRes.data.includes('System Architecture'), 'File contents match uploaded buffer');

    // 5.4 Other student forbidden from downloading file
    try {
      await axios.get(`${BASE_URL}/submissions/${fileSubId}/file`, {
        headers: s2Headers,
      });
      assert(false, 'Other student forbidden from downloading file', 'Should have failed with 403');
    } catch (err) {
      assert(err.response?.status === 403, 'Unauthorized student blocked from file download (403)');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 6: Instructor Review & Resubmission History Preservation
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 6. Instructor Review & Resubmission History ---');

    // 6.1 Student blocked from reviewing submission
    try {
      await axios.patch(
        `${BASE_URL}/submissions/${subId}/review`,
        { marksAwarded: 100, reviewerFeedback: 'Fraudulent review' },
        { headers: s1Headers }
      );
      assert(false, 'Student blocked from reviewing submission', 'Should have failed with 403');
    } catch (err) {
      assert(err.response?.status === 403, 'Learner forbidden from reviewing submission (403)');
    }

    // 6.2 Instructor 1 reviews submission with feedback (Requests Revision)
    const reviewRes = await axios.patch(
      `${BASE_URL}/submissions/${subId}/review`,
      {
        marksAwarded: 60,
        reviewerFeedback: 'Good start! Please handle custom error subclasses and async rejection edge cases.',
        submissionStatus: 'Needs Revision',
      },
      { headers: inst1Headers }
    );
    assert(reviewRes.status === 200, 'Instructor reviews submission (200 OK)');
    assert(reviewRes.data.submission.marksAwarded === 60, 'Marks awarded recorded as 60');
    assert(reviewRes.data.submission.submissionStatus === 'Needs Revision', 'Status updated to "Needs Revision"');

    // 6.3 Student Resubmits (Attempt 2) — Preserving Attempt 1 in history!
    const resubmitRes = await axios.post(
      `${BASE_URL}/exercises/${createdExId}/submissions`,
      {
        textAnswer: 'const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(err => next(err));',
        saveAsDraft: false,
      },
      { headers: s1Headers }
    );

    assert(resubmitRes.status === 200, 'Student resubmits revised solution');
    const updatedSub = resubmitRes.data.submission;
    assert(updatedSub.attemptNumber === 2, 'Attempt number incremented to 2');
    assert(Array.isArray(updatedSub.history) && updatedSub.history.length === 1, 'Previous attempt stored in history array');
    assert(updatedSub.history[0].marksAwarded === 60, 'Historical attempt preserves previous marks (60)');
    assert(updatedSub.history[0].reviewerFeedback.includes('Good start'), 'Historical attempt preserves reviewer feedback');
    assert(updatedSub.submissionStatus === 'Submitted', 'New attempt reset to "Submitted"');

    // 6.4 Instructor Reviews Attempt 2 and Accepts
    const acceptReviewRes = await axios.patch(
      `${BASE_URL}/submissions/${subId}/review`,
      {
        marksAwarded: 95,
        reviewerFeedback: 'Excellent revision! Full error handling satisfied.',
        submissionStatus: 'Accepted',
      },
      { headers: inst1Headers }
    );

    assert(acceptReviewRes.status === 200, 'Instructor accepts revised attempt (status 200)');
    assert(acceptReviewRes.data.submission.submissionStatus === 'Accepted', 'Final submission status is "Accepted"');
    assert(acceptReviewRes.data.submission.marksAwarded === 95, 'Final marks awarded is 95/100');

    // Clean up temporary test data
    await ExerciseSubmission.deleteMany({ learnerId: s1Id });
    await PracticalExercise.findByIdAndDelete(createdExId);
    await PracticalExercise.findByIdAndDelete(fileExId);
    await PracticalExercise.findByIdAndDelete(adminCreateRes.data.exercise._id);
    await Enrollment.findByIdAndDelete(enrollment1._id);
    await Lesson.findByIdAndDelete(lesson1._id);
    await Module.findByIdAndDelete(mod1._id);
    await Course.findByIdAndDelete(testCourse1._id);
    await Course.findByIdAndDelete(testCourse2._id);
    await User.findByIdAndDelete(s1Id);
    await User.findByIdAndDelete(s2Id);
    await User.findByIdAndDelete(inst1Id);
    await User.findByIdAndDelete(inst2Id);
    await User.findByIdAndDelete(adminId);

    console.log('\n================================================================');
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('================================================================');

    if (failed === 0) {
      console.log('\n🎉 ALL PRACTICAL EXERCISES TESTS PASSED 100%!');
    } else {
      console.error('\n❌ SOME TESTS FAILED:');
      failureDetails.forEach((f) => console.error('  - ' + f));
    }
  } catch (error) {
    console.error('Fatal Test Exception:', error.response?.data || error.message);
    failed++;
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
    await mongoose.disconnect();
  }

  process.exit(failed > 0 ? 1 : 0);
}

runExercisesTestSuite();
