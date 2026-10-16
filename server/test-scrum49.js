import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING SCRUM-49 TEST SUITE ---');
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
    // 1. Authenticate Instructor and Student
    console.log('\n1. Logging in accounts...');
    const instLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'instructor@learnhub.com',
      password: 'instructor123'
    });
    const instToken = instLogin.data.token;
    assert(!!instToken, 'Instructor logged in successfully');

    const studentLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'student@learnhub.com',
      password: 'student123'
    });
    const studentToken = studentLogin.data.token;
    assert(!!studentToken, 'Student logged in successfully');

    // Create a secondary student to test unauthorized attempt access
    let student2Token;
    try {
      const regRes = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Second Student',
        email: `student2_${Date.now()}@test.com`,
        password: 'Password123!',
        role: 'student'
      });
      student2Token = regRes.data.token;
      assert(!!student2Token, 'Second student registered for isolation test');
    } catch (e) {
      console.log('Registration info:', e.response?.data?.message || e.message);
    }

    // 2. Fetch instructor's courses and create a specific test quiz
    console.log('\n2. Creating a dedicated test quiz with all 4 question types...');
    const coursesRes = await axios.get(`${BASE_URL}/courses`, {
      headers: { Authorization: `Bearer ${instToken}` }
    });
    const courses = coursesRes.data.courses || coursesRes.data;
    const course = Array.isArray(courses) ? courses[0] : courses.courses[0];
    const courseId = course._id || course.id;
    assert(!!courseId, `Found course for test: ${courseId}`);

    // Ensure student is enrolled in this course
    try {
      await axios.post(`${BASE_URL}/courses/${courseId}/enroll`, {}, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
    } catch (e) {
      // already enrolled is fine
    }

    const testQuizPayload = {
      title: 'Automated Scoring Verification Quiz ' + Date.now(),
      description: 'Comprehensive test for single, multiple, tf and short answer scoring',
      courseId: courseId,
      timeLimit: 15,
      passingScore: 60,
      maxAttempts: 3,
      status: 'published',
      questions: [
        {
          questionText: 'Which keyword defines a constant in JavaScript?',
          type: 'single_choice',
          points: 10,
          options: ['var', 'let', 'const', 'define'],
          correctOptionIndex: 2,
          explanation: 'const defines a block-scoped constant.'
        },
        {
          questionText: 'Select all valid HTTP methods for state change in REST:',
          type: 'multiple_choice',
          points: 15,
          options: ['GET', 'POST', 'PUT', 'DELETE'],
          correctOptions: [1, 2, 3], // POST, PUT, DELETE
          explanation: 'POST, PUT, DELETE modify server state.'
        },
        {
          questionText: 'Is Node.js single-threaded in its event loop?',
          type: 'true_false',
          points: 5,
          correctBoolean: true,
          explanation: 'Node.js uses a single-threaded event loop.'
        },
        {
          questionText: 'What CSS layout property defines flexible items?',
          type: 'short_answer',
          points: 10,
          acceptedAnswers: ['flexbox', 'flex', 'display: flex'],
          explanation: 'Flexbox or flex is the layout system.'
        }
      ]
    };

    const quizRes = await axios.post(`${BASE_URL}/quizzes`, testQuizPayload, {
      headers: { Authorization: `Bearer ${instToken}` }
    });
    const quizId = quizRes.data.quiz._id;
    assert(quizRes.status === 201 && !!quizId, 'Test quiz created with 4 question types');

    // 3. Learner fetches quiz details - verify question sanitization
    console.log('\n3. Verifying quiz sanitization for learner...');
    const detailsRes = await axios.get(`${BASE_URL}/quizzes/${quizId}/details`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(detailsRes.status === 200, 'Student retrieved quiz details');
    const sanitizedQuestions = detailsRes.data.quiz.questions;
    assert(sanitizedQuestions.length === 4, 'Quiz has 4 questions');
    assert(sanitizedQuestions[0].correctOptionIndex === undefined, 'Question 0 does not leak correctOptionIndex');
    assert(sanitizedQuestions[1].correctOptions === undefined, 'Question 1 does not leak correctOptions');
    assert(sanitizedQuestions[2].correctBoolean === undefined, 'Question 2 does not leak correctBoolean');
    assert(sanitizedQuestions[3].acceptedAnswers === undefined, 'Question 3 does not leak acceptedAnswers');
    assert(sanitizedQuestions[0].explanation === undefined, 'Explanation is hidden before submission');

    // 4. Learner starts an attempt
    console.log('\n4. Starting quiz attempt...');
    const startRes = await axios.post(`${BASE_URL}/quizzes/${quizId}/attempts/start`, {}, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(startRes.status === 201 || startRes.status === 200, 'Quiz attempt started/resumed');
    const attemptId = startRes.data.attemptId;
    assert(!!attemptId, `Got attempt ID: ${attemptId}`);

    // Verify starting again returns the exact same in-progress attempt (atomic resume)
    const resumeRes = await axios.post(`${BASE_URL}/quizzes/${quizId}/attempts/start`, {}, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(resumeRes.data.attemptId === attemptId, 'Starting again returned existing attempt (idempotent resume)');
    assert(resumeRes.data.isResumed === true, 'isResumed flag is true');

    // 5. Submit attempt with known answers:
    // Q0 (single): 'const' -> index 2 -> CORRECT (10/10)
    // Q1 (multiple): [1, 2] -> missing 3 -> INCORRECT (0/15, all-or-nothing)
    // Q2 (true_false): true -> CORRECT (5/5)
    // Q3 (short): '  FLEXBOX  ' -> trimmed, case-normalized -> CORRECT (10/10)
    // Expected Total: 10 + 0 + 5 + 10 = 25 out of 40 total points -> 62.5% -> Passed (passingScore 60%)
    console.log('\n5. Submitting attempt with precise answers...');
    const answersPayload = [
      { questionId: sanitizedQuestions[0]._id, selectedOptionIndex: 2 },
      { questionId: sanitizedQuestions[1]._id, selectedOptions: [1, 2] }, // partially correct = 0
      { questionId: sanitizedQuestions[2]._id, selectedBoolean: true },
      { questionId: sanitizedQuestions[3]._id, textAnswer: '   FLEXBOX   ' }
    ];

    const submitRes = await axios.post(`${BASE_URL}/attempts/${attemptId}/submit`, {
      answers: answersPayload
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(submitRes.status === 200, 'Attempt submitted successfully');
    const result = submitRes.data.attempt;
    assert(result.status === 'submitted', 'Attempt status is submitted');
    assert(result.score === 25, `Score is 25 (got: ${result.score})`);
    assert(result.maxScore === 40, `Max score is 40 (got: ${result.maxScore})`);
    assert(result.percentage === 63 || result.percentage === 62.5, `Percentage is 63% or 62.5% (got: ${result.percentage}%)`);
    assert(result.passed === true, 'Attempt is marked passed (63% >= 60%)');

    // 6. Test Idempotent Double Submission
    console.log('\n6. Testing double submission idempotency...');
    const doubleSubmitRes = await axios.post(`${BASE_URL}/attempts/${attemptId}/submit`, {
      answers: [{ questionId: sanitizedQuestions[0]._id, selectedOptionIndex: 0 }]
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(doubleSubmitRes.status === 200, 'Double submit responded with 200');
    assert(doubleSubmitRes.data.attempt.score === 25, 'Score remains unchanged on resubmit');
    assert(doubleSubmitRes.data.message.includes('already submitted'), 'Resubmit informs attempt was already submitted');

    // 7. Check Attempt Review & Answer Disclosures
    console.log('\n7. Reviewing completed attempt...');
    const reviewRes = await axios.get(`${BASE_URL}/attempts/${attemptId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(reviewRes.status === 200, 'Review endpoint responded 200');
    const reviewData = reviewRes.data.attempt;
    assert(reviewData.answers.length === 4, 'Review includes all 4 answers');
    assert(reviewData.answers[0].isCorrect === true, 'Question 0 is marked correct');
    assert(reviewData.answers[1].isCorrect === false, 'Question 1 is marked false (all-or-nothing)');
    assert(reviewData.answers[2].isCorrect === true, 'Question 2 is marked correct');
    assert(reviewData.answers[3].isCorrect === true, 'Question 3 normalized string is marked correct');

    // 8. Isolation: Another student cannot access this attempt
    if (student2Token) {
      console.log('\n8. Testing attempt isolation between students...');
      try {
        await axios.get(`${BASE_URL}/attempts/${attemptId}`, {
          headers: { Authorization: `Bearer ${student2Token}` }
        });
        assert(false, 'Should have blocked unauthorized student from viewing attempt');
      } catch (err) {
        assert(err.response?.status === 403, `Unauthorized student blocked with 403 (got: ${err.response?.status})`);
      }
    }

    console.log(`\n========================================`);
    console.log(`ALL SCRUM-49 TESTS PASSED: ${passed}/${total}`);
    console.log(`========================================\n`);

  } catch (error) {
    console.error('\nTest suite failed with error:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTests();
