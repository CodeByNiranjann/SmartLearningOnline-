import axios from 'axios';
import assert from 'assert';

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function runScrum48Tests() {
  console.log('🧪 Starting SCRUM-48 Quiz Management Acceptance Test Suite...\n');

  // 1. Authenticate Instructor and Admin
  console.log('1. Authenticating Instructor and Admin...');
  const instLogin = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'instructor@learnhub.com',
    password: 'instructor123',
  });
  assert(instLogin.status === 200 && instLogin.data.token, 'Instructor login succeeded');
  const instructorToken = instLogin.data.token;
  const instructorHeaders = { Authorization: `Bearer ${instructorToken}` };

  const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'admin@learnhub.com',
    password: 'admin123',
  });
  assert(adminLogin.status === 200 && adminLogin.data.token, 'Admin login succeeded');
  const adminHeaders = { Authorization: `Bearer ${adminLogin.data.token}` };

  // Create another instructor via admin to test cross-instructor access controls
  const otherInstEmail = `other_inst_${Date.now()}@learnhub.com`;
  const otherInstUserRes = await axios.post(
    `${BASE_URL}/admin/instructors`,
    {
      name: 'Other Instructor',
      email: otherInstEmail,
      password: 'password123',
    },
    { headers: adminHeaders }
  );
  assert(otherInstUserRes.status === 201, 'Second instructor created by admin');

  const otherInstLogin = await axios.post(`${BASE_URL}/auth/login`, {
    email: otherInstEmail,
    password: 'password123',
  });
  assert(otherInstLogin.status === 200 && otherInstLogin.data.token, 'Second instructor login succeeded');
  const otherInstHeaders = { Authorization: `Bearer ${otherInstLogin.data.token}` };

  // 2. Fetch instructor courses
  console.log('\n2. Fetching courses for Instructor...');
  const coursesRes = await axios.get(`${BASE_URL}/courses`, {
    headers: instructorHeaders,
    params: { instructor_id: instLogin.data.user._id },
  });
  assert(coursesRes.status === 200 && Array.isArray(coursesRes.data), 'Fetched instructor courses');
  const instructorCourse = coursesRes.data[0];
  assert(instructorCourse?._id, 'Instructor has at least one assigned course');
  console.log(`   Found Course: "${instructorCourse.title}" (ID: ${instructorCourse._id})`);

  // 3. Test Backend Validations (Requirement 6)
  console.log('\n3. Testing Backend Validations (Requirement 6)...');

  // 3.1 Missing Title
  try {
    await axios.post(
      `${BASE_URL}/quizzes`,
      {
        courseId: instructorCourse._id,
        questions: [{ questionText: 'Valid Q?', type: 'single_choice', options: ['A', 'B'], correctOptionIndex: 0 }],
      },
      { headers: instructorHeaders }
    );
    assert(false, 'Should reject missing title');
  } catch (err) {
    assert(err.response?.status === 400, 'Rejected missing title with status 400');
    console.log('   ✅ PASS: Missing title rejected (400)');
  }

  // 3.2 Missing Course
  try {
    await axios.post(
      `${BASE_URL}/quizzes`,
      {
        title: 'Quiz Without Course',
        questions: [{ questionText: 'Valid Q?', type: 'single_choice', options: ['A', 'B'], correctOptionIndex: 0 }],
      },
      { headers: instructorHeaders }
    );
    assert(false, 'Should reject missing courseId');
  } catch (err) {
    assert(err.response?.status === 400, 'Rejected missing courseId with status 400');
    console.log('   ✅ PASS: Missing course rejected (400)');
  }

  // 3.3 Missing Question Text
  try {
    await axios.post(
      `${BASE_URL}/quizzes`,
      {
        title: 'Quiz With Empty Question Text',
        courseId: instructorCourse._id,
        questions: [{ questionText: '', type: 'single_choice', options: ['A', 'B'], correctOptionIndex: 0 }],
      },
      { headers: instructorHeaders }
    );
    assert(false, 'Should reject missing question text');
  } catch (err) {
    assert(err.response?.status === 400, 'Rejected missing question text with status 400');
    console.log('   ✅ PASS: Missing question text rejected (400)');
  }

  // 3.4 MCQ Single Answer: < 2 options
  try {
    await axios.post(
      `${BASE_URL}/quizzes`,
      {
        title: 'Quiz With Invalid MCQ Single',
        courseId: instructorCourse._id,
        questions: [{ questionText: 'One option only?', type: 'single_choice', options: ['Only A'], correctOptionIndex: 0 }],
      },
      { headers: instructorHeaders }
    );
    assert(false, 'Should reject MCQ Single with < 2 options');
  } catch (err) {
    assert(err.response?.status === 400, 'Rejected MCQ Single with <2 options with status 400');
    console.log('   ✅ PASS: MCQ Single with < 2 options rejected (400)');
  }

  // 3.5 MCQ Single Answer: Invalid correctOptionIndex
  try {
    await axios.post(
      `${BASE_URL}/quizzes`,
      {
        title: 'Quiz With Out-of-bounds Index',
        courseId: instructorCourse._id,
        questions: [{ questionText: 'Valid text?', type: 'single_choice', options: ['A', 'B'], correctOptionIndex: 5 }],
      },
      { headers: instructorHeaders }
    );
    assert(false, 'Should reject invalid correctOptionIndex');
  } catch (err) {
    assert(err.response?.status === 400, 'Rejected invalid correctOptionIndex with status 400');
    console.log('   ✅ PASS: MCQ Single with invalid correctOptionIndex rejected (400)');
  }

  // 3.6 MCQ Multiple Answer: Missing correctOptions
  try {
    await axios.post(
      `${BASE_URL}/quizzes`,
      {
        title: 'Quiz With Empty Correct Multiple Choices',
        courseId: instructorCourse._id,
        questions: [{ questionText: 'Select multiple?', type: 'multiple_choice', options: ['A', 'B', 'C'], correctOptions: [] }],
      },
      { headers: instructorHeaders }
    );
    assert(false, 'Should reject MCQ Multiple with empty correctOptions');
  } catch (err) {
    assert(err.response?.status === 400, 'Rejected MCQ Multiple without correct answer with status 400');
    console.log('   ✅ PASS: MCQ Multiple with 0 correct answers rejected (400)');
  }

  // 3.7 True / False: Missing correct value
  try {
    await axios.post(
      `${BASE_URL}/quizzes`,
      {
        title: 'Quiz With Invalid True/False',
        courseId: instructorCourse._id,
        questions: [{ questionText: 'Is the sky blue?', type: 'true_false' }],
      },
      { headers: instructorHeaders }
    );
    assert(false, 'Should reject True/False without correct value');
  } catch (err) {
    assert(err.response?.status === 400, 'Rejected True/False without correct value with status 400');
    console.log('   ✅ PASS: True/False without correct value rejected (400)');
  }

  // 3.8 Short Answer: Missing accepted answer
  try {
    await axios.post(
      `${BASE_URL}/quizzes`,
      {
        title: 'Quiz With Empty Short Answer',
        courseId: instructorCourse._id,
        questions: [{ questionText: 'Name the keyword:', type: 'short_answer', acceptedAnswers: [] }],
      },
      { headers: instructorHeaders }
    );
    assert(false, 'Should reject Short Answer without accepted answer');
  } catch (err) {
    assert(err.response?.status === 400, 'Rejected Short Answer without accepted answer with status 400');
    console.log('   ✅ PASS: Short Answer without accepted answer rejected (400)');
  }

  // 4. Test Role & Ownership Restrictions (Requirement 7)
  console.log('\n4. Testing Access Controls & Ownership (Requirement 7)...');

  // 4.1 Second Instructor cannot create quiz for first instructor's course
  try {
    await axios.post(
      `${BASE_URL}/quizzes`,
      {
        title: 'Unauthorized Cross-Course Quiz',
        courseId: instructorCourse._id,
        questions: [{ questionText: 'Q1?', type: 'true_false', correctBoolean: true }],
      },
      { headers: otherInstHeaders }
    );
    assert(false, 'Other instructor should not create quiz for unowned course');
  } catch (err) {
    assert(err.response?.status === 403, 'Cross-course quiz creation rejected with 403');
    console.log('   ✅ PASS: Cross-instructor quiz creation blocked (403 Forbidden)');
  }

  // 5. Create a Full Quiz with all 4 Question Types (Requirements 3 & 4)
  console.log('\n5. Creating Valid Quiz with all 4 Question Types...');
  const newQuizPayload = {
    title: 'Comprehensive Software Architecture & Testing Quiz',
    description: 'Verifies understanding of REST APIs, Docker, React, and Microservices design patterns.',
    courseId: instructorCourse._id,
    timeLimit: 25,
    status: 'published',
    passingScore: 75,
    questions: [
      {
        questionText: 'Which HTTP header is utilized by client applications to transmit a Bearer JWT token?',
        type: 'single_choice',
        options: ['Accept', 'Authorization', 'Content-Type', 'X-Token'],
        correctOptionIndex: 1,
        explanation: 'The Authorization header holds Bearer tokens for authentication.',
      },
      {
        questionText: 'Which of the following status codes signify successful operations? (Select all that apply)',
        type: 'multiple_choice',
        options: ['200 OK', '201 Created', '204 No Content', '404 Not Found'],
        correctOptions: [0, 1, 2],
        explanation: '200, 201, and 204 are 2xx Success codes.',
      },
      {
        questionText: 'Node.js event loop runs single-threaded for non-blocking I/O operations.',
        type: 'true_false',
        correctBoolean: true,
        correctOptionIndex: 0,
        explanation: 'Node.js uses a single-threaded event loop architecture combined with libuv thread pool.',
      },
      {
        questionText: 'What HTTP method is used to remove an existing resource in a RESTful API? (e.g. GET, POST, DELETE)',
        type: 'short_answer',
        acceptedAnswers: ['DELETE', 'delete'],
        explanation: 'DELETE is the standard HTTP method for removing resources.',
      },
    ],
  };

  const createRes = await axios.post(`${BASE_URL}/quizzes`, newQuizPayload, {
    headers: instructorHeaders,
  });
  assert(createRes.status === 201 && createRes.data.quiz?._id, 'Quiz created successfully');
  const createdQuiz = createRes.data.quiz;
  console.log(`   ✅ PASS: Quiz created with ID: ${createdQuiz._id} and ${createdQuiz.questions.length} questions`);

  // 6. List Quizzes & Verify Ownership Filtering
  console.log('\n6. Verifying List Quizzes Endpoint (Requirement 2 & 7)...');
  const instQuizzesRes = await axios.get(`${BASE_URL}/quizzes`, { headers: instructorHeaders });
  assert(instQuizzesRes.status === 200, 'Instructor fetched quizzes');
  const hasCreated = instQuizzesRes.data.quizzes.some((q) => q._id === createdQuiz._id);
  assert(hasCreated, 'Newly created quiz is listed in instructor quizzes');
  console.log(`   ✅ PASS: Instructor retrieved ${instQuizzesRes.data.quizzes.length} quiz(zes)`);

  // Other instructor sees 0 quizzes for this course
  const otherInstQuizzesRes = await axios.get(`${BASE_URL}/quizzes`, { headers: otherInstHeaders });
  assert(
    !otherInstQuizzesRes.data.quizzes.some((q) => q._id === createdQuiz._id),
    'Other instructor cannot see first instructor quiz'
  );
  console.log('   ✅ PASS: Quiz is strictly scoped to course instructor');

  // Admin can view all quizzes
  const adminQuizzesRes = await axios.get(`${BASE_URL}/quizzes`, { headers: adminHeaders });
  assert(
    adminQuizzesRes.data.quizzes.some((q) => q._id === createdQuiz._id),
    'Admin can view all quizzes across platform'
  );
  console.log(`   ✅ PASS: Admin successfully viewed all ${adminQuizzesRes.data.quizzes.length} quizzes`);

  // 7. Test Reordering & Updating Questions (Requirement 5)
  console.log('\n7. Testing Question Reordering and Quiz Updates (Requirement 5)...');
  // Swap Question 1 and Question 2
  const reorderedQuestions = [...createdQuiz.questions];
  const temp = reorderedQuestions[0];
  reorderedQuestions[0] = reorderedQuestions[1];
  reorderedQuestions[1] = temp;

  const updateRes = await axios.put(
    `${BASE_URL}/quizzes/${createdQuiz._id}`,
    {
      title: 'Comprehensive Software Architecture & Testing Quiz (Updated)',
      timeLimit: 30,
      questions: reorderedQuestions,
    },
    { headers: instructorHeaders }
  );
  assert(updateRes.status === 200, 'Quiz updated successfully');
  assert(updateRes.data.quiz.timeLimit === 30, 'Time limit updated to 30 mins');
  assert(
    updateRes.data.quiz.questions[0].questionText === reorderedQuestions[0].questionText,
    'Questions reordered successfully'
  );
  console.log('   ✅ PASS: Question reordering and quiz updates saved successfully');

  // 8. Test Cross-Instructor Update and Delete Blocked (Requirement 7)
  console.log('\n8. Testing Cross-Instructor Update and Delete Security...');
  try {
    await axios.put(
      `${BASE_URL}/quizzes/${createdQuiz._id}`,
      { title: 'Hacked Title' },
      { headers: otherInstHeaders }
    );
    assert(false, 'Unauthorized edit should be forbidden');
  } catch (err) {
    assert(err.response?.status === 403, 'Unauthorized edit rejected with 403');
    console.log('   ✅ PASS: Unauthorized quiz edit blocked (403)');
  }

  try {
    await axios.delete(`${BASE_URL}/quizzes/${createdQuiz._id}`, { headers: otherInstHeaders });
    assert(false, 'Unauthorized delete should be forbidden');
  } catch (err) {
    assert(err.response?.status === 403, 'Unauthorized delete rejected with 403');
    console.log('   ✅ PASS: Unauthorized quiz delete blocked (403)');
  }

  // 9. Delete Quiz (Requirement 2)
  console.log('\n9. Testing Quiz Deletion (Requirement 2)...');
  const deleteRes = await axios.delete(`${BASE_URL}/quizzes/${createdQuiz._id}`, {
    headers: instructorHeaders,
  });
  assert(deleteRes.status === 200, 'Quiz deleted successfully');
  console.log('   ✅ PASS: Quiz deleted cleanly');

  // Verify it is gone
  const verifyList = await axios.get(`${BASE_URL}/quizzes`, { headers: instructorHeaders });
  assert(!verifyList.data.quizzes.some((q) => q._id === createdQuiz._id), 'Deleted quiz no longer exists');

  // 10. Verify Seed Quizzes (Requirement 8)
  console.log('\n10. Verifying Seeded Sample Quizzes (Requirement 8)...');
  const seededRes = await axios.get(`${BASE_URL}/quizzes`, { headers: adminHeaders });
  const sampleQuizzes = seededRes.data.quizzes;
  assert(sampleQuizzes.length >= 2, `At least 2 sample quizzes seeded (Found: ${sampleQuizzes.length})`);

  for (const sq of sampleQuizzes) {
    console.log(`   Sample Quiz: "${sq.title}" (Course: ${sq.courseId?.title}, Questions: ${sq.questions?.length})`);
    assert(sq.title, 'Sample quiz has a title');
    assert(sq.courseId, 'Sample quiz is attached to a course');
    assert(sq.questions?.length >= 3, 'Sample quiz has comprehensive questions');
  }
  console.log('   ✅ PASS: 2 Sample quizzes verified in database');

  console.log('\n========================================');
  console.log('🏁 SCRUM-48 Test Suite: ALL TESTS PASSED!');
  console.log('========================================\n');
}

runScrum48Tests().catch((err) => {
  console.error('\n❌ SCRUM-48 Test Failure:', err.response?.data || err.message);
  process.exit(1);
});
