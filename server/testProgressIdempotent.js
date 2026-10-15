
const BASE_URL = 'http://127.0.0.1:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, options);
  let data;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, headers: res.headers, data };
}

async function runTests() {
  console.log('🚀 Starting Acceptance Criteria Test Suite: Progress, Idempotence, Resuming & Enrollment Scoping...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Register a fresh test student
    console.log('1. Registering Fresh Student...');
    const studentEmail = `prog_test_${Date.now()}@learnhub.com`;
    const regRes = await request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Progress Test Student',
        email: studentEmail,
        password: 'password123',
      }),
    });
    assert(regRes.status === 201 && regRes.data.token, 'Test Student registered successfully');
    const studentToken = regRes.data.token;

    // 2. Fetch published course with multiple lessons
    console.log('\n2. Fetching Course & Lessons...');
    const coursesRes = await request('/courses');
    const course = coursesRes.data.find((c) => c.title.includes('React & Node.js')) || coursesRes.data[0];
    assert(Boolean(course), `Found course: "${course.title}" (ID: ${course._id})`);

    const modRes = await request(`/courses/${course._id}/modules`);
    const allLessons = modRes.data.flatMap((m) => m.lessons);
    assert(allLessons.length >= 2, `Course has ${allLessons.length} lessons`);
    const lesson1 = allLessons[0];
    const lesson2 = allLessons[1];

    // 3. Acceptance Criterion: Scoped to Enrollment (Must reject non-enrolled user)
    console.log('\n3. Testing Scope to Enrollment (Unenrolled access must be forbidden)...');
    const unenrolledCompleteRes = await request('/progress/complete-lesson', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ courseId: course._id, lessonId: lesson1._id }),
    });
    assert(
      unenrolledCompleteRes.status === 403,
      `Unenrolled complete-lesson rejected with 403 (Received: ${unenrolledCompleteRes.status})`
    );
    assert(
      typeof unenrolledCompleteRes.data.message === 'string' &&
        unenrolledCompleteRes.data.message.includes('enrolled in this course'),
      `Returned clear enrollment scoping message: "${unenrolledCompleteRes.data.message}"`
    );

    const unenrolledPlaybackRes = await request('/progress/playback', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseId: course._id,
        lessonId: lesson1._id,
        playedSeconds: 45,
      }),
    });
    assert(
      unenrolledPlaybackRes.status === 403,
      `Unenrolled playback tracking rejected with 403 (Received: ${unenrolledPlaybackRes.status})`
    );

    // 4. Enroll student in course
    console.log('\n4. Enrolling Student in Course...');
    const enrollRes = await request(`/courses/${course._id}/enroll`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(enrollRes.status === 201, 'Student enrolled successfully in course');

    // 5. Acceptance Criterion: Progress Tracking & Survives Sessions
    console.log('\n5. Testing Progress Recording & Session Survival...');
    const complete1Res = await request('/progress/complete-lesson', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ courseId: course._id, lessonId: lesson1._id }),
    });
    assert(complete1Res.status === 200, 'Lesson 1 marked complete with status 200');
    assert(complete1Res.data.progress?.completedLessons.length === 1, 'Completed count is 1');
    const initialPercent = complete1Res.data.progress?.progressPercentage;
    assert(initialPercent > 0, `Progress percentage calculated accurately: ${initialPercent}%`);

    // Verify progress survives across sessions (re-fetch via fresh GET request)
    const getProgRes = await request(`/progress/${course._id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(getProgRes.status === 200, 'Progress re-fetched from database across session');
    assert(getProgRes.data.completedLessons.length === 1, 'Persisted completed lessons survived session');
    assert(getProgRes.data.progressPercentage === initialPercent, 'Persisted percentage survived session');

    // 6. Acceptance Criterion: Completion is Idempotent
    console.log('\n6. Testing Idempotence of Lesson Completion...');
    // Second completion request for same lesson (simulating duplicate click or network retry)
    const completeDuplicateRes1 = await request('/progress/complete-lesson', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ courseId: course._id, lessonId: lesson1._id }),
    });
    assert(completeDuplicateRes1.status === 200, 'Duplicate request returned 200 OK');
    assert(completeDuplicateRes1.data.isAlreadyCompleted === true, 'Detected already completed state');
    assert(
      completeDuplicateRes1.data.progress?.completedLessons.length === 1,
      'No duplicate entry added: count remains 1'
    );
    assert(
      completeDuplicateRes1.data.progress?.progressPercentage === initialPercent,
      'Percentage did not inflate: remains exactly the same'
    );

    // Third duplicate request
    const completeDuplicateRes2 = await request('/progress/complete-lesson', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ courseId: course._id, lessonId: lesson1._id }),
    });
    assert(
      completeDuplicateRes2.data.progress?.completedLessons.length === 1,
      'Third duplicate request remains strictly idempotent'
    );

    // 7. Acceptance Criterion: Learners Can Resume (Course & Video Playback)
    console.log('\n7. Testing Resuming (Playback position & resume point calculation)...');
    // Learner starts watching Lesson 2 up to 142 seconds
    const playbackRes = await request('/progress/playback', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseId: course._id,
        lessonId: lesson2._id,
        playedSeconds: 142,
        durationSeconds: 600,
      }),
    });
    assert(playbackRes.status === 200, 'Playback progress recorded successfully');
    assert(playbackRes.data.playedSeconds === 142, 'Recorded exact played seconds: 142s');

    // Fetch progress and check resume calculations
    const resumeCheckRes = await request(`/progress/${course._id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(resumeCheckRes.status === 200, 'Course progress fetched for resume check');
    assert(
      resumeCheckRes.data.resumeLessonId === lesson2._id,
      `Calculated correct resume lesson (Expected: ${lesson2._id}, Got: ${resumeCheckRes.data.resumeLessonId})`
    );
    assert(
      resumeCheckRes.data.resumePlaybackSeconds === 142,
      `Calculated correct resume playback timestamp (Expected: 142s, Got: ${resumeCheckRes.data.resumePlaybackSeconds}s)`
    );

    console.log(`\n========================================`);
    console.log(`🏁 Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Unhandled error during test run:', err);
    process.exit(1);
  }
}

runTests();
