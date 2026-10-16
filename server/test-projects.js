import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app.js';
import User from './models/User.js';
import Project from './models/Project.js';
import ProjectSubmission from './models/ProjectSubmission.js';

dotenv.config();

const PORT = process.env.TEST_PORT || 5003;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runProjectsTestSuite() {
  console.log('================================================================');
  console.log('   SLP-6: REAL-WORLD PROJECTS — AUTOMATED TEST SUITE');
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

    // 2. Start Test Server
    await new Promise((resolve) => {
      serverInstance = app.listen(PORT, () => {
        console.log(`[INIT] Test Server running on port ${PORT}\n`);
        resolve();
      });
    });

    const runId = Date.now();
    const studentEmail = `student_proj_${runId}@learnhub.test`;
    const instructorEmail = `inst_proj_${runId}@learnhub.test`;
    const password = 'Password@123';

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 1: Test Accounts Setup
    // ─────────────────────────────────────────────────────────────────────────
    console.log('--- 1. Authentication & Setup for Projects Testing ---');

    // Register Student
    const regStudentRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Project Test Student',
      email: studentEmail,
      password,
    });
    const studentToken = regStudentRes.data.token;
    const studentSessionId = regStudentRes.data.sessionId;
    const studentUser = regStudentRes.data.user;

    const studentHeaders = {
      Authorization: `Bearer ${studentToken}`,
      'X-Session-ID': studentSessionId,
    };

    // Register Instructor and promote to instructor role
    const regInstRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Project Test Instructor',
      email: instructorEmail,
      password,
    });
    const instructorUserId = regInstRes.data.user.id;
    await User.findByIdAndUpdate(instructorUserId, { role: 'instructor' });

    const instLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: instructorEmail,
      password,
    });
    const instToken = instLoginRes.data.token;
    const instSessionId = instLoginRes.data.sessionId;
    const instHeaders = {
      Authorization: `Bearer ${instToken}`,
      'X-Session-ID': instSessionId,
    };

    assert(studentToken && instToken, 'Student and Instructor tokens generated successfully');

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 2: Public / Student Project Discovery (SLP-6)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 2. Public / Student Project Discovery ---');

    const listRes = await axios.get(`${BASE_URL}/projects`);
    assert(listRes.status === 200, 'GET /api/projects returns status 200');
    assert(Array.isArray(listRes.data.projects), 'Response contains projects array');
    assert(listRes.data.projects.length >= 1, `Found ${listRes.data.projects.length} real-world projects`);

    const firstProject = listRes.data.projects[0];
    await Project.findByIdAndUpdate(firstProject._id, { instructorId: instructorUserId });
    assert(firstProject.title && firstProject.difficulty, 'Project contains title and difficulty level');
    assert(Array.isArray(firstProject.technologies), 'Project defines real-world technology stack');
    assert(Array.isArray(firstProject.rubric), 'Project includes grading rubric criteria');

    // Filtering by difficulty
    const filterRes = await axios.get(`${BASE_URL}/projects?difficulty=Beginner`);
    assert(filterRes.status === 200, 'GET /api/projects?difficulty=Beginner returns 200');
    const allBeginner = filterRes.data.projects.every((p) => p.difficulty === 'Beginner');
    assert(allBeginner, 'All filtered projects have Beginner difficulty');

    // Get Single Project Details
    const detailRes = await axios.get(`${BASE_URL}/projects/${firstProject._id}`);
    assert(detailRes.status === 200, 'GET /api/projects/:id returns 200');
    assert(detailRes.data.project._id === firstProject._id, 'Retrieved project matches requested ID');
    assert(detailRes.data.project.deliverables?.length > 0, 'Project details include deliverables specification');

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 3: Project Submission Flow (SLP-6)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 3. Student Project Submission Flow ---');

    // Test rejection of invalid GitHub URL
    try {
      await axios.post(
        `${BASE_URL}/projects/${firstProject._id}/submit`,
        { githubUrl: 'not-a-valid-url' },
        { headers: studentHeaders }
      );
      assert(false, 'Invalid GitHub URL rejected', 'Should have failed with 400');
    } catch (err) {
      assert(err.response?.status === 400, 'Invalid GitHub URL rejected with 400');
    }

    // Submit valid solution
    const submitRes = await axios.post(
      `${BASE_URL}/projects/${firstProject._id}/submit`,
      {
        githubUrl: 'https://github.com/student-learner/ecommerce-capstone',
        liveDemoUrl: 'https://ecommerce-capstone.vercel.app',
        notes: 'Implemented with React, Node.js, and MongoDB. Includes full responsive checkout.',
      },
      { headers: studentHeaders }
    );

    assert(submitRes.status === 201, 'Student successfully submits project (status 201)');
    assert(submitRes.data.submission.status === 'submitted', 'Submission status is initially "submitted"');
    assert(submitRes.data.submission.githubUrl.includes('github.com'), 'Stored GitHub repo URL verified');

    const submissionId = submitRes.data.submission._id;

    // Student retrieves personal submission
    const mySubRes = await axios.get(`${BASE_URL}/projects/${firstProject._id}/my-submission`, {
      headers: studentHeaders,
    });
    assert(mySubRes.status === 200, 'GET /api/projects/:id/my-submission returns 200');
    assert(mySubRes.data.submission._id === submissionId, 'Matches submitted ID');

    // Projects list with user session now attaches mySubmission
    const listWithSubRes = await axios.get(`${BASE_URL}/projects`, { headers: studentHeaders });
    const targetProjInList = listWithSubRes.data.projects.find((p) => p._id === firstProject._id);
    assert(targetProjInList?.mySubmission?.status === 'submitted', 'Project card displays student submission status');

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 4: Instructor Review & Rubric-Based Grading (SLP-6)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 4. Instructor Submissions Review & Grading ---');

    // Student forbidden from viewing all project submissions
    try {
      await axios.get(`${BASE_URL}/projects/${firstProject._id}/submissions`, {
        headers: studentHeaders,
      });
      assert(false, 'Student forbidden from viewing all submissions', 'Should have failed with 403');
    } catch (err) {
      assert(err.response?.status === 403, 'Student blocked from project submissions with 403');
    }

    // Instructor retrieves submissions
    const instSubListRes = await axios.get(`${BASE_URL}/projects/${firstProject._id}/submissions`, {
      headers: instHeaders,
    });
    assert(instSubListRes.status === 200, 'Instructor views project submissions (status 200)');
    assert(instSubListRes.data.submissions.length >= 1, 'Instructor sees student submission');

    // Instructor grades submission
    const gradeRes = await axios.put(
      `${BASE_URL}/projects/${firstProject._id}/submissions/${submissionId}/grade`,
      {
        grade: 95,
        feedback: 'Outstanding architecture! Clean error handling and responsive mobile experience.',
        rubricScores: [
          { criteria: 'Core Functionality & Checkout Flow', points: 35, feedback: 'Flawless checkout flow.' },
          { criteria: 'Code Architecture & State Management', points: 28, feedback: 'Well structured controllers.' },
          { criteria: 'UI/UX Polish & Mobile Responsiveness', points: 19, feedback: 'Great touch target sizing.' },
          { criteria: 'README Documentation & Test Suite', points: 13, feedback: 'Comprehensive README.' },
        ],
        status: 'graded',
      },
      { headers: instHeaders }
    );

    assert(gradeRes.status === 200, 'Instructor grades submission with 200 OK');
    assert(gradeRes.data.submission.grade === 95, 'Grade score recorded as 95');
    assert(gradeRes.data.submission.status === 'graded', 'Submission status updated to "graded"');

    // Student views updated grade and feedback
    const studentFeedbackRes = await axios.get(`${BASE_URL}/projects/${firstProject._id}/my-submission`, {
      headers: studentHeaders,
    });
    assert(studentFeedbackRes.data.submission.grade === 95, 'Student sees evaluated score 95/100');
    assert(studentFeedbackRes.data.submission.feedback.includes('Outstanding'), 'Student sees instructor feedback note');

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 5: Instructor Project Creation & Management
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 5. Instructor Project Creation & Management ---');

    const newProjectRes = await axios.post(
      `${BASE_URL}/projects`,
      {
        title: `Automated Test Project ${runId}`,
        description: 'Test project description for CI validation.',
        category: 'Web Development',
        difficulty: 'Beginner',
        estimatedHours: 8,
        technologies: ['React', 'Express'],
        deliverables: ['Build user login', 'Build dashboard'],
      },
      { headers: instHeaders }
    );

    assert(newProjectRes.status === 201, 'Instructor successfully creates new project (201)');
    const createdProjectId = newProjectRes.data.project._id;

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 6: SLP-6 Project Enrollment, Milestones, Deliverables & Review
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 6. SLP-6: Enrollment, Milestones, Deliverables & Review ---');

    // 1. Create a dedicated test project with milestones
    const slp6ProjectRes = await axios.post(
      `${BASE_URL}/projects`,
      {
        title: `SLP-6 Capstone Project ${runId}`,
        description: 'End-to-end full stack capstone project.',
        category: 'Full-Stack Development',
        difficulty: 'Intermediate',
        estimatedHours: 20,
        technologies: ['React', 'Node.js', 'MongoDB', 'Docker'],
        requiredSkills: ['REST APIs', 'Frontend Architecture'],
        prerequisites: ['Basic JavaScript', 'HTML/CSS'],
        deliverables: ['Database Schema', 'Backend API', 'Frontend UI'],
      },
      { headers: instHeaders }
    );
    assert(slp6ProjectRes.status === 201, 'Instructor creates SLP-6 Capstone Project');
    const slp6ProjectId = slp6ProjectRes.data.project._id;

    // 2. Instructor adds ordered milestones
    const milestone1Res = await axios.post(
      `${BASE_URL}/projects/${slp6ProjectId}/milestones`,
      {
        title: 'Milestone 1: Database & Architecture Setup',
        description: 'Set up MongoDB schemas and Express routing architecture.',
        sequenceOrder: 1,
        requiredDeliverables: ['Schema design document', 'Initial repository link'],
      },
      { headers: instHeaders }
    );
    assert(milestone1Res.status === 201, 'Instructor creates Milestone 1 (order 1)');
    const milestone1Id = milestone1Res.data.milestone._id;

    const milestone2Res = await axios.post(
      `${BASE_URL}/projects/${slp6ProjectId}/milestones`,
      {
        title: 'Milestone 2: Frontend Integration & Live Deployment',
        description: 'Connect React frontend with API and deploy to production.',
        sequenceOrder: 2,
        requiredDeliverables: ['Live demo URL', 'Automated test suite'],
      },
      { headers: instHeaders }
    );
    assert(milestone2Res.status === 201, 'Instructor creates Milestone 2 (order 2)');
    const milestone2Id = milestone2Res.data.milestone._id;

    // 3. Verify public milestones listing
    const milestoneListRes = await axios.get(`${BASE_URL}/projects/${slp6ProjectId}/milestones`);
    assert(milestoneListRes.status === 200, 'GET /api/projects/:projectId/milestones returns 200');
    assert(milestoneListRes.data.milestones.length === 2, 'Project has 2 ordered milestones');
    assert(
      milestoneListRes.data.milestones[0].sequenceOrder <= milestoneListRes.data.milestones[1].sequenceOrder,
      'Milestones are sorted in ascending sequence order'
    );

    // 4. Student project enrollment
    const enrollRes = await axios.post(
      `${BASE_URL}/projects/${slp6ProjectId}/enroll`,
      {},
      { headers: studentHeaders }
    );
    assert(enrollRes.status === 201, 'Student successfully joins project (201 Created)');
    assert(enrollRes.data.enrollment.status === 'not_started', 'Initial enrollment status is "not_started"');
    const enrollmentId = enrollRes.data.enrollment._id;

    // 5. Prevent duplicate active enrollments
    try {
      await axios.post(
        `${BASE_URL}/projects/${slp6ProjectId}/enroll`,
        {},
        { headers: studentHeaders }
      );
      assert(false, 'Duplicate enrollment rejected', 'Should return 400');
    } catch (err) {
      assert(err.response?.status === 400, 'Duplicate enrollment prevented with 400 Bad Request');
    }

    // 6. Student views My Projects dashboard
    const myProjectsRes = await axios.get(`${BASE_URL}/projects/my`, {
      headers: studentHeaders,
    });
    assert(myProjectsRes.status === 200, 'GET /api/projects/my returns 200');
    const myProj = myProjectsRes.data.enrolledProjects.find(
      (ep) => ep.project._id === slp6ProjectId
    );
    assert(myProj !== undefined, 'Student sees newly enrolled project in My Projects');
    assert(myProj.enrollment.status === 'not_started', 'My Projects reports status "not_started"');

    // 7. Reject invalid milestone-project relationship update
    try {
      await axios.put(
        `${BASE_URL}/project-enrollments/${enrollmentId}/milestones/${firstProject._id}`,
        { status: 'in_progress' },
        { headers: studentHeaders }
      );
      assert(false, 'Invalid milestone relationship rejected', 'Should return 400 or 404');
    } catch (err) {
      assert(
        err.response?.status === 400 || err.response?.status === 404,
        'Invalid milestone update rejected with 400/404'
      );
    }

    // 8. Update milestone 1 progress to in_progress
    const updateMilestoneRes = await axios.put(
      `${BASE_URL}/project-enrollments/${enrollmentId}/milestones/${milestone1Id}`,
      { status: 'in_progress' },
      { headers: studentHeaders }
    );
    assert(updateMilestoneRes.status === 200, 'Milestone 1 updated to in_progress');
    assert(updateMilestoneRes.data.enrollmentStatus === 'in_progress', 'Overall project status transitioned to in_progress');

    // 9. Submit Milestone 1 deliverable
    const deliverableSubmitRes = await axios.post(
      `${BASE_URL}/project-enrollments/${enrollmentId}/submissions`,
      {
        milestoneId: milestone1Id,
        repositoryUrl: 'https://github.com/student/slp6-capstone',
        demoUrl: 'https://slp6-capstone.vercel.app',
        description: 'Milestone 1 deliverables submitted: Express REST endpoints & MongoDB models.',
      },
      { headers: studentHeaders }
    );
    assert(deliverableSubmitRes.status === 201, 'Student submits milestone deliverable (201 Created)');
    assert(deliverableSubmitRes.data.submission.status === 'submitted', 'Submission marked as "submitted"');
    const milestoneSubmissionId = deliverableSubmitRes.data.submission._id;

    // 10. Student retrieves authorized submission history
    const historyRes = await axios.get(
      `${BASE_URL}/project-enrollments/${enrollmentId}/submissions`,
      { headers: studentHeaders }
    );
    assert(historyRes.status === 200, 'GET submission history returns 200');
    assert(historyRes.data.submissions.length >= 1, 'History contains student submission');

    // 11. Instructor reviews submission and provides feedback
    const reviewRes = await axios.patch(
      `${BASE_URL}/project-submissions/${milestoneSubmissionId}/review`,
      {
        marksAwarded: 92,
        feedback: 'Superb architecture! Milestones are clearly organized and API contracts are clean.',
        status: 'graded',
      },
      { headers: instHeaders }
    );
    assert(reviewRes.status === 200, 'Instructor reviews and grades submission (200 OK)');
    assert(reviewRes.data.submission.marksAwarded === 92, 'Marks awarded recorded as 92');
    assert(reviewRes.data.submission.status === 'graded', 'Submission status updated to "graded"');

    // 12. Unauthorized student cannot review submissions
    try {
      await axios.patch(
        `${BASE_URL}/project-submissions/${milestoneSubmissionId}/review`,
        { marksAwarded: 100 },
        { headers: studentHeaders }
      );
      assert(false, 'Student blocked from reviewing submissions', 'Should return 403');
    } catch (err) {
      assert(err.response?.status === 403, 'Student blocked from reviewing submissions with 403');
    }

    // 13. Instructor views project participants
    const participantsRes = await axios.get(
      `${BASE_URL}/projects/${slp6ProjectId}/participants`,
      { headers: instHeaders }
    );
    assert(participantsRes.status === 200, 'Instructor views project participants (200 OK)');
    assert(participantsRes.data.participants.length >= 1, 'Participants list contains enrolled student');

    // Clean up created capstone project
    await axios.delete(`${BASE_URL}/projects/${slp6ProjectId}`, { headers: instHeaders });
    await axios.delete(`${BASE_URL}/projects/${createdProjectId}`, { headers: instHeaders });

    // Clean up temporary student submission
    await ProjectSubmission.findByIdAndDelete(submissionId);
    await User.findByIdAndDelete(studentUser.id || studentUser._id);
    await User.findOneAndDelete({ email: instructorEmail });

    console.log('\n================================================================');
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('================================================================');

    if (failed === 0) {
      console.log('\n🎉 ALL REAL-WORLD PROJECT TESTS PASSED 100%!');
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

runProjectsTestSuite();
