import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app.js';
import User from './models/User.js';
import Course from './models/Course.js';
import Module from './models/Module.js';
import Lesson from './models/Lesson.js';
import Enrollment from './models/Enrollment.js';
import Progress from './models/Progress.js';
import LessonProgress from './models/LessonProgress.js';

dotenv.config();

const PORT = process.env.TEST_PORT || 5003;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runLessonProgressTestSuite() {
  console.log('================================================================');
  console.log('   LESSON PROGRESS & PLAYBACK TRACKING AUTOMATED TEST SUITE');
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
    // Connect to MongoDB
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online-learning');
    }
    await LessonProgress.syncIndexes();
    console.log('[INIT] MongoDB connection and LessonProgress indexes confirmed.');

    // Start Server
    await new Promise((resolve) => {
      serverInstance = app.listen(PORT, () => {
        console.log(`[INIT] Test Server running on port ${PORT}\n`);
        resolve();
      });
    });

    const runId = Date.now();
    const student1Email = `student1_prog_${runId}@learnhub.test`;
    const student2Email = `student2_prog_${runId}@learnhub.test`;
    const password = 'Password@123';

    // ─────────────────────────────────────────────────────────────────────────
    // SETUP: Users, Courses, Modules, Lessons & Enrollments
    // ─────────────────────────────────────────────────────────────────────────
    console.log('--- 1. Test Setup: Register Students & Fetch Course Structure ---');

    // Student 1
    const s1Res = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Student One',
      email: student1Email,
      password,
    });
    const s1Token = s1Res.data.token;
    const s1Id = s1Res.data.user.id;
    const s1Headers = { Authorization: `Bearer ${s1Token}` };

    // Student 2
    const s2Res = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Student Two',
      email: student2Email,
      password,
    });
    const s2Token = s2Res.data.token;
    const s2Id = s2Res.data.user.id;
    const s2Headers = { Authorization: `Bearer ${s2Token}` };

    assert(Boolean(s1Token && s2Token), 'Registered two isolated test students successfully');

    // Create a dedicated course with 3 lessons
    const testCourse1 = await Course.create({
      title: `Full Stack Progress Test Course ${runId}`,
      description: 'Test course for persistent playback and completion tracking',
      category: 'Web Development',
      difficulty: 'Beginner',
      duration: '35 min',
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
      status: 'published',
      instructor: 'Test Lead',
    });

    const testModule1 = await Module.create({
      courseId: testCourse1._id,
      title: 'Module 1: Foundations',
      order: 1,
    });

    const lesson1 = await Lesson.create({
      courseId: testCourse1._id,
      moduleId: testModule1._id,
      title: 'Lesson 1: Introduction to Framework',
      content: 'Lesson 1 core concepts and overview',
      videoUrl: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
      duration: '10 min',
      order: 1,
    });

    const lesson2 = await Lesson.create({
      courseId: testCourse1._id,
      moduleId: testModule1._id,
      title: 'Lesson 2: State and Hooks',
      content: 'Lesson 2 state management instructions',
      videoUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
      duration: '10 min',
      order: 2,
    });

    const lesson3 = await Lesson.create({
      courseId: testCourse1._id,
      moduleId: testModule1._id,
      title: 'Lesson 3: API Integration',
      content: 'Lesson 3 async and api integration',
      videoUrl: 'https://www.youtube.com/watch?v=9SGDpanrc8U',
      duration: '15 min',
      order: 3,
    });

    // Create an un-enrolled course for relationship validation
    const testCourse2 = await Course.create({
      title: `Unenrolled Course ${runId}`,
      description: 'Course that student 1 is NOT enrolled in',
      category: 'Mobile Development',
      difficulty: 'Intermediate',
      duration: '15 min',
      thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5',
      status: 'published',
      instructor: 'Test Lead 2',
    });
    const testModule2 = await Module.create({
      courseId: testCourse2._id,
      title: 'Unenrolled Module',
      order: 1,
    });
    const foreignLesson = await Lesson.create({
      courseId: testCourse2._id,
      moduleId: testModule2._id,
      title: 'Foreign Lesson',
      content: 'Foreign content',
      order: 1,
    });

    // Enroll Student 1 in Course 1
    const enroll1Res = await axios.post(`${BASE_URL}/courses/${testCourse1._id}/enroll`, {}, { headers: s1Headers });
    const enrollment1 = enroll1Res.data.enrollment;
    const enrollment1Id = enrollment1._id;

    // Enroll Student 2 in Course 1 (separate enrollment)
    const enroll2Res = await axios.post(`${BASE_URL}/courses/${testCourse1._id}/enroll`, {}, { headers: s2Headers });
    const enrollment2 = enroll2Res.data.enrollment;
    const enrollment2Id = enrollment2._id;

    assert(Boolean(enrollment1Id && enrollment2Id), 'Both students enrolled with distinct enrollment IDs');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 2: DEFAULT PROGRESS RETRIEVAL
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 2. Default Progress Retrieval (NOT_STARTED state) ---');
    const defaultProgRes = await axios.get(
      `${BASE_URL}/enrollments/${enrollment1Id}/lessons/${lesson1._id}/progress`,
      { headers: s1Headers }
    );
    assert(defaultProgRes.status === 200, 'GET lesson progress returns 200');
    assert(defaultProgRes.data.status === 'NOT_STARTED', 'Initial status is NOT_STARTED');
    assert(defaultProgRes.data.last_position_seconds === 0, 'Initial last_position_seconds is 0');
    assert(defaultProgRes.data.progress_percentage === 0, 'Initial progress_percentage is 0');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 3: SECURITY, AUTHORIZATION & VALIDATION CHECKS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 3. Security, Authorization & Relationship Validation ---');

    // 3.1 Reject unauthenticated request (401)
    try {
      await axios.put(`${BASE_URL}/enrollments/${enrollment1Id}/lessons/${lesson1._id}/progress`, {
        last_position_seconds: 50,
      });
      assert(false, 'Unauthenticated PUT progress should be rejected');
    } catch (err) {
      assert(err.response?.status === 401, 'Unauthenticated progress request rejected with 401');
    }

    // 3.2 Prevent Student 2 from modifying Student 1 progress (403 Forbidden)
    try {
      await axios.put(
        `${BASE_URL}/enrollments/${enrollment1Id}/lessons/${lesson1._id}/progress`,
        { last_position_seconds: 50 },
        { headers: s2Headers }
      );
      assert(false, 'Cross-user enrollment progress update should be rejected');
    } catch (err) {
      assert(err.response?.status === 403, 'Cross-user enrollment modification rejected with 403 Forbidden');
    }

    // 3.3 Prevent Student 2 from viewing Student 1 progress (403 Forbidden)
    try {
      await axios.get(`${BASE_URL}/enrollments/${enrollment1Id}/lessons/${lesson1._id}/progress`, {
        headers: s2Headers,
      });
      assert(false, 'Cross-user enrollment progress read should be rejected');
    } catch (err) {
      assert(err.response?.status === 403, 'Cross-user enrollment progress read rejected with 403 Forbidden');
    }

    // 3.4 Reject lesson not belonging to enrolled course (400 Bad Request)
    try {
      await axios.put(
        `${BASE_URL}/enrollments/${enrollment1Id}/lessons/${foreignLesson._id}/progress`,
        { last_position_seconds: 50 },
        { headers: s1Headers }
      );
      assert(false, 'Lesson from another course should be rejected');
    } catch (err) {
      assert(err.response?.status === 400, 'Lesson not belonging to enrolled course rejected with 400');
      assert(
        err.response?.data?.message?.includes('Lesson does not belong'),
        `Returned clear error message: "${err.response?.data?.message}"`
      );
    }

    // 3.5 Reject negative playback position (400)
    try {
      await axios.put(
        `${BASE_URL}/enrollments/${enrollment1Id}/lessons/${lesson1._id}/progress`,
        { last_position_seconds: -20, duration_seconds: 600 },
        { headers: s1Headers }
      );
      assert(false, 'Negative playback position should be rejected');
    } catch (err) {
      assert(err.response?.status === 400, 'Negative playback position rejected with 400');
    }

    // 3.6 Reject negative duration (400)
    try {
      await axios.put(
        `${BASE_URL}/enrollments/${enrollment1Id}/lessons/${lesson1._id}/progress`,
        { last_position_seconds: 20, duration_seconds: -600 },
        { headers: s1Headers }
      );
      assert(false, 'Negative duration should be rejected');
    } catch (err) {
      assert(err.response?.status === 400, 'Negative duration rejected with 400');
    }

    // 3.7 Reject position exceeding total video duration (400)
    try {
      await axios.put(
        `${BASE_URL}/enrollments/${enrollment1Id}/lessons/${lesson1._id}/progress`,
        { last_position_seconds: 650, duration_seconds: 600 },
        { headers: s1Headers }
      );
      assert(false, 'Position exceeding duration should be rejected');
    } catch (err) {
      assert(err.response?.status === 400, 'Position exceeding duration rejected with 400');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 4: PERSISTENT PLAYBACK PROGRESS & RESUMING
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 4. Persistent Playback Progress & Session Survival ---');

    // Learner plays 145 seconds out of 600s
    const updateRes = await axios.put(
      `${BASE_URL}/enrollments/${enrollment1Id}/lessons/${lesson1._id}/progress`,
      {
        last_position_seconds: 145,
        duration_seconds: 600,
      },
      { headers: s1Headers }
    );
    assert(updateRes.status === 200, 'PUT playback progress returned 200');
    assert(updateRes.data.status === 'IN_PROGRESS', 'Status updated to IN_PROGRESS');
    assert(updateRes.data.last_position_seconds === 145, 'Saved last_position_seconds is 145');
    assert(updateRes.data.duration_seconds === 600, 'Saved duration_seconds is 600');
    assert(updateRes.data.progress_percentage === 24, 'Calculated accurate progress_percentage: 24%');
    assert(Boolean(updateRes.data.started_at), 'started_at timestamp was captured');

    // Verify session survival: re-fetch via fresh GET request
    const freshFetchRes = await axios.get(
      `${BASE_URL}/enrollments/${enrollment1Id}/lessons/${lesson1._id}/progress`,
      { headers: s1Headers }
    );
    assert(freshFetchRes.data.last_position_seconds === 145, 'Playback position persisted across request sessions');
    assert(freshFetchRes.data.status === 'IN_PROGRESS', 'IN_PROGRESS status survived request session');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 5: AUTOMATIC 90% COMPLETION THRESHOLD
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 5. Automatic Completion at 90% Threshold ---');

    // Learner watches Lesson 2 up to 550s out of 600s (91.6%)
    const thresholdRes = await axios.put(
      `${BASE_URL}/enrollments/${enrollment1Id}/lessons/${lesson2._id}/progress`,
      {
        last_position_seconds: 550,
        duration_seconds: 600,
      },
      { headers: s1Headers }
    );
    assert(thresholdRes.status === 200, 'Threshold update returned 200');
    assert(thresholdRes.data.status === 'COMPLETED', 'Status automatically set to COMPLETED at 90%+ threshold');
    assert(thresholdRes.data.progress_percentage === 100, 'Progress percentage is 100%');
    assert(Boolean(thresholdRes.data.completed_at), 'completed_at timestamp recorded');
    const firstCompletedAt = thresholdRes.data.completed_at;

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 6: PRESERVE COMPLETED STATUS ON REVISIT & CONTINUED PLAYBACK
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 6. Preserve Completed Status on Revisit & Rewind ---');

    // Learner returns to Lesson 2 and rewinds to 40 seconds
    const rewindRes = await axios.put(
      `${BASE_URL}/enrollments/${enrollment1Id}/lessons/${lesson2._id}/progress`,
      {
        last_position_seconds: 40,
        duration_seconds: 600,
      },
      { headers: s1Headers }
    );
    assert(rewindRes.status === 200, 'Rewind request returned 200');
    assert(rewindRes.data.status === 'COMPLETED', 'Status remains COMPLETED even when rewound to 40s');
    assert(rewindRes.data.last_position_seconds === 40, 'Position updated to 40s for smooth continuing');
    assert(rewindRes.data.completed_at === firstCompletedAt, 'Original completed_at timestamp was NOT reset');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 7: IDEMPOTENT MARK AS COMPLETE
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 7. Idempotent Lesson Completion Endpoint ---');

    // First explicit complete on Lesson 1
    const complete1Res = await axios.post(
      `${BASE_URL}/enrollments/${enrollment1Id}/lessons/${lesson1._id}/complete`,
      {},
      { headers: s1Headers }
    );
    assert(complete1Res.status === 200, 'Mark complete returned 200');
    assert(complete1Res.data.isAlreadyCompleted === false, 'First completion marked as not already completed');
    assert(complete1Res.data.progress.status === 'COMPLETED', 'Lesson 1 marked COMPLETED');
    const lesson1CompletedAt = complete1Res.data.progress.completed_at;

    // Second explicit complete on Lesson 1 (Duplicate call / retry)
    const completeDuplicateRes = await axios.post(
      `${BASE_URL}/enrollments/${enrollment1Id}/lessons/${lesson1._id}/complete`,
      {},
      { headers: s1Headers }
    );
    assert(completeDuplicateRes.status === 200, 'Duplicate complete returned 200 OK');
    assert(completeDuplicateRes.data.isAlreadyCompleted === true, 'Duplicate complete identified as already completed');
    assert(
      completeDuplicateRes.data.progress.completed_at === lesson1CompletedAt,
      'Original completion timestamp untouched by duplicate request'
    );

    // Verify database has exactly 1 progress record for (enrollment1Id, lesson1)
    const countRecords = await LessonProgress.countDocuments({ enrollmentId: enrollment1Id, lessonId: lesson1._id });
    assert(countRecords === 1, 'Strictly 1 record exists in database: duplicate records prevented');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 8: ENROLLMENT-SCOPED PROGRESS ISOLATION
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 8. Enrollment-Scoped Progress Isolation ---');

    // Check Student 2's progress on Lesson 1: should still be NOT_STARTED!
    const s2Lesson1Prog = await axios.get(
      `${BASE_URL}/enrollments/${enrollment2Id}/lessons/${lesson1._id}/progress`,
      { headers: s2Headers }
    );
    assert(s2Lesson1Prog.data.status === 'NOT_STARTED', "Student 2's progress is isolated and still NOT_STARTED");
    assert(s2Lesson1Prog.data.last_position_seconds === 0, "Student 2 has 0 playback seconds");

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 9: ENROLLMENT-WIDE PROGRESS & RESUME POINT CALCULATION
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 9. Enrollment-Wide Progress Summary & Resume Point ---');

    const enrollmentSummaryRes = await axios.get(
      `${BASE_URL}/enrollments/${enrollment1Id}/progress`,
      { headers: s1Headers }
    );
    assert(enrollmentSummaryRes.status === 200, 'GET /enrollments/:id/progress returned 200');
    assert(enrollmentSummaryRes.data.total_lessons === 3, 'Total lessons in course is 3');
    assert(enrollmentSummaryRes.data.completed_count === 2, 'Completed count is 2 (Lessons 1 & 2)');
    assert(enrollmentSummaryRes.data.progress_percentage === 67, 'Overall progress percentage is 67%');
    assert(
      enrollmentSummaryRes.data.resume_lesson_id.toString() === lesson3._id.toString(),
      `Calculated correct resume lesson (First uncompleted: Lesson 3)`
    );
    assert(enrollmentSummaryRes.data.status_summary.completed === 2, 'Status summary has 2 completed');
    assert(enrollmentSummaryRes.data.status_summary.not_started === 1, 'Status summary has 1 not started');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 10: CONCURRENT UPDATE SAFETY
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 10. Concurrent Updates Safety & Non-Duplication ---');

    // Fire 5 simultaneous progress updates on Lesson 3 for Student 1
    const concurrentPromises = [1, 2, 3, 4, 5].map((i) =>
      axios.put(
        `${BASE_URL}/enrollments/${enrollment1Id}/lessons/${lesson3._id}/progress`,
        {
          last_position_seconds: 10 * i,
          duration_seconds: 600,
        },
        { headers: s1Headers }
      )
    );

    const concurrentResults = await Promise.all(concurrentPromises);
    const allSuccessful = concurrentResults.every((r) => r.status === 200);
    assert(allSuccessful, 'All 5 concurrent requests succeeded with 200 status');

    const lesson3Count = await LessonProgress.countDocuments({
      enrollmentId: enrollment1Id,
      lessonId: lesson3._id,
    });
    assert(lesson3Count === 1, 'Exactly 1 progress record exists after concurrent updates');

    // ─────────────────────────────────────────────────────────────────────────
    // CLEANUP
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Cleanup: Purging Temporary Test Records ---');
    await LessonProgress.deleteMany({ enrollmentId: { $in: [enrollment1Id, enrollment2Id] } });
    await Enrollment.deleteMany({ _id: { $in: [enrollment1Id, enrollment2Id] } });
    await Progress.deleteMany({ userId: { $in: [s1Id, s2Id] } });
    await Lesson.deleteMany({ _id: { $in: [lesson1._id, lesson2._id, lesson3._id, foreignLesson._id] } });
    await Module.deleteMany({ _id: { $in: [testModule1._id, testModule2._id] } });
    await Course.deleteMany({ _id: { $in: [testCourse1._id, testCourse2._id] } });
    await User.deleteMany({ _id: { $in: [s1Id, s2Id] } });
    console.log('✓ Cleaned up all temporary test entities.');

    console.log(`\n================================================================`);
    console.log(`🏁 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`================================================================\n`);

    if (serverInstance) {
      serverInstance.close();
    }

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Unhandled test suite error:', err);
    if (serverInstance) serverInstance.close();
    process.exit(1);
  }
}

runLessonProgressTestSuite();
