import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('================================================================');
  console.log('STARTING AUTOMATED TESTS: ADMIN & INSTRUCTOR ROLE-BASED ACCESS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 0. Setup: Log in as Admin and Instructor
    console.log('--- Phase 0: Authenticating Test Accounts ---');

    // Admin login
    const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@learnhub.com',
      password: 'admin123',
    });
    const adminToken = adminLoginRes.data.token;
    const adminSessionId = adminLoginRes.data.sessionId;
    const adminHeaders = {
      Authorization: `Bearer ${adminToken}`,
      'X-Session-ID': adminSessionId,
    };
    assert(adminLoginRes.data.user.role === 'admin', 'Admin authenticated with role "admin"');

    // Instructor 1 login
    const inst1LoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'instructor@learnhub.com',
      password: 'instructor123',
    });
    const inst1Token = inst1LoginRes.data.token;
    const inst1SessionId = inst1LoginRes.data.sessionId;
    const inst1Id = inst1LoginRes.data.user.id;
    const inst1Headers = {
      Authorization: `Bearer ${inst1Token}`,
      'X-Session-ID': inst1SessionId,
    };
    assert(inst1LoginRes.data.user.role === 'instructor', 'Instructor 1 authenticated with role "instructor"');

    // Instructor 2: Register a second instructor for cross-ownership testing
    const inst2Email = `instructor2_${Date.now()}@learnhub.com`;
    const inst2RegRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Instructor Two',
      email: inst2Email,
      password: 'password123',
    });
    // Promote Instructor 2 to instructor role using Admin API
    await axios.put(
      `${BASE_URL}/admin/users/${inst2RegRes.data.user.id}/role`,
      { role: 'instructor' },
      { headers: adminHeaders }
    );
    // Log in as Instructor 2
    const inst2LoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: inst2Email,
      password: 'password123',
    });
    const inst2Headers = {
      Authorization: `Bearer ${inst2LoginRes.data.token}`,
      'X-Session-ID': inst2LoginRes.data.sessionId,
    };
    assert(inst2LoginRes.data.user.role === 'instructor', 'Instructor 2 registered & verified');

    console.log('\n--- Running Section 9 Acceptance Criteria Scenarios ---');

    // Scenario 4: Instructor can create a course
    const courseRes1 = await axios.post(
      `${BASE_URL}/courses`,
      {
        title: `Test Course by Inst 1 ${Date.now()}`,
        description: 'Comprehensive test course',
        category: 'Software Engineering',
        difficulty: 'Intermediate',
        duration: '4 Weeks',
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
      },
      { headers: inst1Headers }
    );
    const course1Id = courseRes1.data.course._id;
    assert(courseRes1.status === 201 && course1Id, 'Scenario 4: Instructor 1 can create a course');

    // Scenario 5: Instructor can edit their own courses
    const updateCourseRes1 = await axios.put(
      `${BASE_URL}/courses/${course1Id}`,
      { title: `Updated Title ${Date.now()}` },
      { headers: inst1Headers }
    );
    assert(updateCourseRes1.status === 200, 'Scenario 5: Instructor 1 can edit their own course');

    // Scenario 6: Instructor can manage modules belonging to their own courses
    const modRes1 = await axios.post(
      `${BASE_URL}/courses/${course1Id}/modules`,
      { title: 'Module 1 Foundations', order: 1 },
      { headers: inst1Headers }
    );
    const mod1Id = modRes1.data.module._id;
    assert(modRes1.status === 201 && mod1Id, 'Scenario 6: Instructor 1 can create module in own course');

    // Scenario 7: Instructor can manage lessons belonging to their own courses
    const lessonRes1 = await axios.post(
      `${BASE_URL}/modules/${mod1Id}/lessons`,
      { title: 'Lesson 1.1 Intro', content: 'Sample lesson body', order: 1 },
      { headers: inst1Headers }
    );
    const lesson1Id = lessonRes1.data.lesson._id;
    assert(lessonRes1.status === 201 && lesson1Id, 'Scenario 7: Instructor 1 can create lesson in own module');

    // Scenario 8: Instructor cannot edit or delete another instructor's course
    try {
      await axios.put(
        `${BASE_URL}/courses/${course1Id}`,
        { title: 'Hacked by Instructor 2' },
        { headers: inst2Headers }
      );
      assert(false, 'Scenario 8: Instructor 2 was able to edit Instructor 1 course (Should fail)');
    } catch (err) {
      assert(err.response?.status === 403, 'Scenario 8: Instructor 2 rejected (403) from editing Instructor 1 course');
    }

    try {
      await axios.delete(`${BASE_URL}/courses/${course1Id}`, { headers: inst2Headers });
      assert(false, 'Scenario 8: Instructor 2 was able to delete Instructor 1 course (Should fail)');
    } catch (err) {
      assert(err.response?.status === 403, 'Scenario 8: Instructor 2 rejected (403) from deleting Instructor 1 course');
    }

    // Scenario 9: Instructor cannot manage another instructor's modules or lessons
    try {
      await axios.post(
        `${BASE_URL}/courses/${course1Id}/modules`,
        { title: 'Unauthorized Module' },
        { headers: inst2Headers }
      );
      assert(false, 'Scenario 9: Instructor 2 added module to Instructor 1 course (Should fail)');
    } catch (err) {
      assert(err.response?.status === 403, 'Scenario 9: Instructor 2 rejected (403) from adding module to other instructor course');
    }

    try {
      await axios.post(
        `${BASE_URL}/modules/${mod1Id}/lessons`,
        { title: 'Unauthorized Lesson', content: 'test' },
        { headers: inst2Headers }
      );
      assert(false, 'Scenario 9: Instructor 2 added lesson to Instructor 1 module (Should fail)');
    } catch (err) {
      assert(err.response?.status === 403, 'Scenario 9: Instructor 2 rejected (403) from adding lesson to other instructor module');
    }

    // Scenario 10: A module cannot be created with a nonexistent course ID
    try {
      await axios.post(
        `${BASE_URL}/courses/600000000000000000000000/modules`,
        { title: 'Ghost Module' },
        { headers: adminHeaders }
      );
      assert(false, 'Scenario 10: Module created on nonexistent course (Should fail)');
    } catch (err) {
      assert(err.response?.status === 404, 'Scenario 10: Nonexistent course rejected with 404 when creating module');
    }

    // Scenario 11: A lesson cannot be created with a nonexistent module ID
    try {
      await axios.post(
        `${BASE_URL}/modules/600000000000000000000000/lessons`,
        { title: 'Ghost Lesson', content: 'body' },
        { headers: adminHeaders }
      );
      assert(false, 'Scenario 11: Lesson created on nonexistent module (Should fail)');
    } catch (err) {
      assert(err.response?.status === 404, 'Scenario 11: Nonexistent module rejected with 404 when creating lesson');
    }

    // Scenario 12: A lesson cannot be attached to a module outside the instructor's ownership
    try {
      await axios.put(
        `${BASE_URL}/lessons/${lesson1Id}`,
        { moduleId: '600000000000000000000000' },
        { headers: inst1Headers }
      );
      assert(false, 'Scenario 12: Lesson moved to nonexistent target module (Should fail)');
    } catch (err) {
      assert(err.response?.status === 404 || err.response?.status === 403, 'Scenario 12: Invalid target module rejected with 404/403');
    }

    // Scenario 13: Updating parent relationships cannot bypass authorization
    try {
      await axios.put(
        `${BASE_URL}/modules/${mod1Id}`,
        { courseId: '600000000000000000000000' },
        { headers: inst1Headers }
      );
      assert(false, 'Scenario 13: Module parent course changed to invalid course (Should fail)');
    } catch (err) {
      assert(err.response?.status === 404 || err.response?.status === 403, 'Scenario 13: Moving module across unauthorized/invalid course rejected with 404/403');
    }

    // Scenario 14: Unauthenticated users cannot access protected operations
    try {
      await axios.post(`${BASE_URL}/courses`, { title: 'No auth course' });
      assert(false, 'Scenario 14: Unauthenticated user created course (Should fail)');
    } catch (err) {
      assert(err.response?.status === 401, 'Scenario 14: Unauthenticated request rejected with 401');
    }

    // Scenario 1: Admin can view and manage all courses
    const adminCoursesRes = await axios.get(`${BASE_URL}/courses`, { headers: adminHeaders });
    assert(adminCoursesRes.status === 200 && Array.isArray(adminCoursesRes.data), 'Scenario 1: Admin can view all courses');

    // Scenario 2: Admin can create, edit, and delete modules in any course
    const adminModRes = await axios.post(
      `${BASE_URL}/courses/${course1Id}/modules`,
      { title: 'Admin Created Module', order: 2 },
      { headers: adminHeaders }
    );
    assert(adminModRes.status === 201, 'Scenario 2: Admin can create module in any course');

    // Scenario 3: Admin can create, edit, and delete lessons in any module
    const adminLessonRes = await axios.post(
      `${BASE_URL}/modules/${adminModRes.data.module._id}/lessons`,
      { title: 'Admin Created Lesson', content: 'admin content', order: 1 },
      { headers: adminHeaders }
    );
    assert(adminLessonRes.status === 201, 'Scenario 3: Admin can create lesson in any module');

    // Clean up created test module & lesson
    await axios.delete(`${BASE_URL}/lessons/${adminLessonRes.data.lesson._id}`, { headers: adminHeaders });
    await axios.delete(`${BASE_URL}/modules/${adminModRes.data.module._id}`, { headers: adminHeaders });
    assert(true, 'Scenario 2 & 3: Admin can delete modules and lessons in any course');

    // Scenario 15: Existing login, registration, and student operations continue working
    const studentTestEmail = `student_test_${Date.now()}@example.com`;
    const studentRegRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Normal Student',
      email: studentTestEmail,
      password: 'password123',
    });
    assert(studentRegRes.status === 201 && studentRegRes.data.user.role === 'student', 'Scenario 15: Student registration works and defaults to "student" role');

    // Clean up test course and test user 2
    await axios.delete(`${BASE_URL}/courses/${course1Id}`, { headers: adminHeaders });
    await axios.delete(`${BASE_URL}/admin/users/${inst2LoginRes.data.user.id}`, { headers: adminHeaders });
    await axios.delete(`${BASE_URL}/admin/users/${studentRegRes.data.user.id}`, { headers: adminHeaders });
    assert(true, 'Cleanup: Test artifacts cleanly deleted from database');

    console.log('\n================================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (globalErr) {
    console.error('Fatal Test Runner Exception:', globalErr.response?.data || globalErr.message);
    process.exit(1);
  }
}

runTests();
