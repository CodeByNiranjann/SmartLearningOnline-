import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING VERIFICATION TEST SUITE (PARTS 4, 5, 6, 7) ---');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // 1. Log in as Student
    console.log('\n1. Student Authentication...');
    const studentLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'student@learnhub.com',
      password: 'student123'
    });
    const studentToken = studentLogin.data.token;
    assert(!!studentToken, 'Student logged in successfully');

    // 2. Part 4: Test GET /api/progress/summary
    console.log('\n2. Testing Part 4: Student Progress Summary...');
    const summaryRes = await axios.get(`${BASE_URL}/progress/summary`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(summaryRes.status === 200, 'Progress summary returned 200');
    assert(Array.isArray(summaryRes.data.enrolledCourses), 'Contains enrolledCourses array');
    assert(typeof summaryRes.data.overallPercent === 'number', `overallPercent is number (${summaryRes.data.overallPercent}%)`);
    assert(typeof summaryRes.data.completedCourses === 'number', `completedCourses is number (${summaryRes.data.completedCourses})`);
    assert(typeof summaryRes.data.quizStats === 'object', 'Contains quizStats summary object');
    console.log(`-> Student enrolled courses: ${summaryRes.data.enrolledCourses.length}`);

    // 3. Part 7: Test GET /api/progress/achievements
    console.log('\n3. Testing Part 7: Student Achievements...');
    const achRes = await axios.get(`${BASE_URL}/progress/achievements`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(achRes.status === 200, 'Achievements endpoint returned 200');
    assert(Array.isArray(achRes.data.achievements), 'Contains achievements array');
    assert(typeof achRes.data.summary === 'object', 'Contains achievements summary');
    assert(typeof achRes.data.summary.total === 'number', `Total achievements: ${achRes.data.summary.total}`);

    // 4. Instructor Authentication
    console.log('\n4. Instructor Authentication...');
    const instructorLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'instructor@learnhub.com',
      password: 'instructor123'
    });
    const instructorToken = instructorLogin.data.token;
    assert(!!instructorToken, 'Instructor logged in successfully');

    // 5. Part 5: Test Instructor Students with At-Risk Rules
    console.log('\n5. Testing Part 5: Instructor Students & At-Risk Status...');
    const studentsRes = await axios.get(`${BASE_URL}/instructor/students`, {
      headers: { Authorization: `Bearer ${instructorToken}` }
    });
    assert(studentsRes.status === 200, 'Instructor students returned 200');
    assert(Array.isArray(studentsRes.data), 'Returns list of enrolled students');
    if (studentsRes.data.length > 0) {
      const first = studentsRes.data[0];
      assert(first.hasOwnProperty('isAtRisk'), 'Student object has isAtRisk flag');
      assert(first.hasOwnProperty('progressPercentage'), 'Student object has progressPercentage');
      assert(first.hasOwnProperty('daysInactive'), 'Student object has daysInactive calculation');
    }

    // 6. Part 6: Practical Tasks & Assessment (SCRUM-67)
    console.log('\n6. Testing Part 6: Practical Tasks CRUD & Lifecycle...');
    
    // Get instructor's course to attach task to
    const coursesRes = await axios.get(`${BASE_URL}/courses?instructor=me`, {
      headers: { Authorization: `Bearer ${instructorToken}` }
    });
    const courses = coursesRes.data.courses || coursesRes.data;
    assert(Array.isArray(courses) && courses.length > 0, 'Found instructor courses');
    const targetCourse = courses[0];

    // Instructor creates a task
    const createTaskRes = await axios.post(`${BASE_URL}/tasks`, {
      title: 'Automated Test Task',
      description: 'Test task for SCRUM-67',
      instructions: 'Please submit your code repository link',
      courseId: targetCourse._id,
      maxPoints: 100,
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      taskType: 'mixed',
      status: 'published'
    }, {
      headers: { Authorization: `Bearer ${instructorToken}` }
    });
    assert(createTaskRes.status === 201, 'Instructor created task successfully (201)');
    const createdTask = createTaskRes.data.task;
    assert(createdTask.title === 'Automated Test Task', 'Task title matches');

    // Student lists published tasks
    const studentTasksRes = await axios.get(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(studentTasksRes.status === 200, 'Student listed tasks returned 200');
    assert(Array.isArray(studentTasksRes.data.tasks), 'Returns tasks array');

    // Student submits work for task
    const submitRes = await axios.post(`${BASE_URL}/tasks/${createdTask._id}/submit`, {
      textContent: 'Here is my solution implementation.',
      submissionLink: 'https://github.com/learnhub/test-solution'
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(submitRes.status === 201, 'Student submitted work (201)');
    const submissionId = submitRes.data.submission._id;
    assert(submitRes.data.submission.status === 'submitted', 'Submission status is "submitted"');

    // Instructor lists submissions for the task
    const listSubmissionsRes = await axios.get(`${BASE_URL}/tasks/${createdTask._id}/submissions`, {
      headers: { Authorization: `Bearer ${instructorToken}` }
    });
    assert(listSubmissionsRes.status === 200, 'Instructor fetched task submissions');
    assert(listSubmissionsRes.data.submissions.length >= 1, 'Found student submission');

    // Instructor grades the submission
    const gradeRes = await axios.post(`${BASE_URL}/tasks/submissions/${submissionId}/grade`, {
      score: 95,
      feedback: 'Excellent work on the automated submission!'
    }, {
      headers: { Authorization: `Bearer ${instructorToken}` }
    });
    assert(gradeRes.status === 200, 'Instructor graded submission successfully (200)');
    assert(gradeRes.data.submission.score === 95, 'Grade score is 95');
    assert(gradeRes.data.submission.status === 'graded', 'Submission status updated to "graded"');

    // Out-of-bounds score validation
    try {
      await axios.post(`${BASE_URL}/tasks/submissions/${submissionId}/grade`, {
        score: 150, // max is 100
        feedback: 'Invalid'
      }, {
        headers: { Authorization: `Bearer ${instructorToken}` }
      });
      assert(false, 'Should have rejected score > maxPoints');
    } catch (e) {
      assert(e.response?.status === 400, 'Score > maxPoints rejected with 400');
    }

    // Clean up created test task
    const deleteRes = await axios.delete(`${BASE_URL}/tasks/${createdTask._id}`, {
      headers: { Authorization: `Bearer ${instructorToken}` }
    });
    assert(deleteRes.status === 200, 'Cleaned up test task successfully');

    console.log(`\n========================================`);
    console.log(`ALL VERIFICATION TESTS PASSED: ${passed}/${total}`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('\nTest failed with error:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTests();
