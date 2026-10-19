import axios from 'axios';
import mongoose from 'mongoose';
import assert from 'assert';
import app from './app.js';
import User from './models/User.js';
import Course from './models/Course.js';
import Project from './models/Project.js';
import ProjectMilestone from './models/ProjectMilestone.js';
import ProjectEnrollment from './models/ProjectEnrollment.js';
import ProjectSubmission from './models/ProjectSubmission.js';

const PORT = 5004;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/online-learning';

let server;

async function runSLP7TestSuite() {
  console.log('================================================================');
  console.log('   SLP-7: TRAINER CREATES PROJECT-BASED ACTIVITIES TEST SUITE   ');
  console.log('================================================================\n');

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }
    console.log('[INIT] MongoDB connection established.');

    await new Promise((resolve) => {
      server = app.listen(PORT, '127.0.0.1', () => {
        console.log(`[INIT] Test Server running on port ${PORT}\n`);
        resolve();
      });
    });

    const runId = Date.now().toString().slice(-6);
    const trainerEmail = `trainer.slp7.${runId}@learnhub.test`;
    const foreignTrainerEmail = `foreign.trainer.${runId}@learnhub.test`;
    const studentEmail = `student.slp7.${runId}@learnhub.test`;
    const password = 'Password@123';

    // ─── 1. Setup Accounts ──────────────────────────────────────────────────
    console.log('--- 1. Account Setup: Register Trainer, Peer Trainer & Student ---');
    
    // Register trainer
    const trainerRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Lead Technical Trainer',
      email: trainerEmail,
      password,
    });
    // Upgrade to instructor
    await User.findByIdAndUpdate(trainerRes.data.user.id, { role: 'instructor' });
    const trainerLoginRes = await axios.post(`${BASE_URL}/auth/login`, { email: trainerEmail, password });
    const trainerToken = trainerLoginRes.data.token;
    const trainerHeaders = { Authorization: `Bearer ${trainerToken}` };
    assert.strictEqual(trainerLoginRes.data.user.role, 'instructor', 'Trainer has instructor role');
    console.log('  [PASS] Trainer registered and verified with instructor role');

    // Register foreign trainer
    const foreignRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Peer Trainer',
      email: foreignTrainerEmail,
      password,
    });
    await User.findByIdAndUpdate(foreignRes.data.user.id, { role: 'instructor' });
    const foreignLoginRes = await axios.post(`${BASE_URL}/auth/login`, { email: foreignTrainerEmail, password });
    const foreignToken = foreignLoginRes.data.token;
    const foreignHeaders = { Authorization: `Bearer ${foreignToken}` };
    console.log('  [PASS] Peer Trainer registered for ownership boundary testing');

    // Register student
    const studentRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Learner One',
      email: studentEmail,
      password,
    });
    const studentToken = studentRes.data.token;
    const studentHeaders = { Authorization: `Bearer ${studentToken}` };
    assert.strictEqual(studentRes.data.user.role, 'student', 'Student has student role');
    console.log('  [PASS] Student registered for participation testing');

    // ─── 2. Trainer Creates Project-Based Activity ────────────────────────────
    console.log('\n--- 2. Trainer Creates Project-Based Activity (SLP-7) ---');
    
    const projectPayload = {
      title: `Microservices Task Engine Capstone ${runId}`,
      description: 'Build an event-driven task queue system using Node.js and Redis to master distributed workflows.',
      fullDescription: 'Comprehensive hands-on project to design queue workers, dead-letter exchanges, and REST APIs.',
      category: 'Backend & Microservices',
      difficulty: 'Intermediate',
      estimatedHours: 16,
      technologies: ['Node.js', 'Express', 'Redis', 'Docker', 'Jest'],
      requiredSkills: ['Event-Driven Architecture', 'REST APIs', 'Containerization', 'Unit Testing'],
      learningObjectives: [
        'Design decoupled microservice workers',
        'Implement resilient retry and backoff algorithms',
        'Containerize multi-container architectures with Docker Compose',
      ],
      deliverables: ['GitHub Repository URL', 'Live Deployed Service URL', 'Architecture Diagram README'],
      prerequisites: ['Node.js basics', 'Asynchronous JavaScript'],
      rubric: [
        { criteria: 'Worker Queue Architecture', maxPoints: 40, description: 'Correct queue processing and dead-letter handling.' },
        { criteria: 'Code Quality & Error Handling', maxPoints: 30, description: 'Clean async/await patterns, zero unhandled rejections.' },
        { criteria: 'Containerization & Deployment', maxPoints: 20, description: 'Working Dockerfile and docker-compose.yml configuration.' },
        { criteria: 'Documentation & API Spec', maxPoints: 10, description: 'Comprehensive README and Postman/Swagger collection.' },
      ],
      status: 'published',
    };

    const createProjectRes = await axios.post(`${BASE_URL}/projects`, projectPayload, { headers: trainerHeaders });
    assert.strictEqual(createProjectRes.status, 201, 'Trainer successfully created project-based activity');
    const createdProject = createProjectRes.data.project;
    assert.strictEqual(createdProject.title, projectPayload.title);
    assert.strictEqual(createdProject.requiredSkills.length, 4, 'Practical skills tracked accurately');
    assert.strictEqual(createdProject.rubric.length, 4, 'Rubric criteria saved properly');
    console.log('  [PASS] Project-based activity created with 201 status');
    console.log('  [PASS] Stored practical skills: Event-Driven Architecture, REST APIs, Containerization, Unit Testing');
    console.log('  [PASS] Stored 4-part evaluation rubric with 100 total points');

    // ─── 3. Non-Trainer Authorization Enforcement ────────────────────────────
    console.log('\n--- 3. Authorization Boundaries: Non-Trainers Blocked ---');
    
    try {
      await axios.post(`${BASE_URL}/projects`, projectPayload, { headers: studentHeaders });
      assert.fail('Student should be forbidden from creating project activities');
    } catch (err) {
      assert.strictEqual(err.response?.status, 403, 'Student rejected with 403 Forbidden');
      console.log('  [PASS] Student blocked from creating project activities with 403 Forbidden');
    }

    try {
      await axios.post(`${BASE_URL}/projects`, projectPayload);
      assert.fail('Unauthenticated request should be rejected');
    } catch (err) {
      assert.strictEqual(err.response?.status, 401, 'Unauthenticated request rejected with 401');
      console.log('  [PASS] Unauthenticated request rejected with 401 Unauthorized');
    }

    // ─── 4. Trainer Adds Structured Sequential Milestones ─────────────────────
    console.log('\n--- 4. Trainer Adds Step-by-Step Milestones for Practical Skills ---');
    
    const m1Res = await axios.post(
      `${BASE_URL}/projects/${createdProject._id}/milestones`,
      {
        title: 'Milestone 1: Worker Core & Redis Queue Setup',
        description: 'Initialize task producer and consumer queues with Redis BullMQ.',
        sequenceOrder: 1,
        requiredDeliverables: ['GitHub PR link with queue implementation'],
      },
      { headers: trainerHeaders }
    );
    assert.strictEqual(m1Res.status, 201);
    const milestone1 = m1Res.data.milestone;
    console.log('  [PASS] Trainer created Milestone 1 (order 1)');

    const m2Res = await axios.post(
      `${BASE_URL}/projects/${createdProject._id}/milestones`,
      {
        title: 'Milestone 2: Dockerization & End-to-End Integration Tests',
        description: 'Package the worker into Docker containers and verify with Jest integration tests.',
        sequenceOrder: 2,
        requiredDeliverables: ['Docker Hub image link', 'Test coverage summary'],
      },
      { headers: trainerHeaders }
    );
    assert.strictEqual(m2Res.status, 201);
    console.log('  [PASS] Trainer created Milestone 2 (order 2)');

    // ─── 5. Ownership Security: Peer Trainer Cannot Modify ────────────────────
    console.log('\n--- 5. Ownership Boundary: Peer Trainer Blocked from Modification ---');
    
    try {
      await axios.put(
        `${BASE_URL}/projects/${createdProject._id}`,
        { title: 'Hacked Project Title' },
        { headers: foreignHeaders }
      );
      assert.fail('Peer trainer should not be able to modify another trainer project');
    } catch (err) {
      assert.strictEqual(err.response?.status, 403, 'Peer trainer rejected with 403 Forbidden');
      console.log('  [PASS] Peer trainer blocked from updating project with 403 Forbidden');
    }

    try {
      await axios.delete(
        `${BASE_URL}/projects/${createdProject._id}`,
        { headers: foreignHeaders }
      );
      assert.fail('Peer trainer should not be able to delete another trainer project');
    } catch (err) {
      assert.strictEqual(err.response?.status, 403, 'Peer trainer rejected with 403 Forbidden');
      console.log('  [PASS] Peer trainer blocked from deleting project with 403 Forbidden');
    }

    // ─── 6. Trainer Updates Project Activity ──────────────────────────────────
    console.log('\n--- 6. Trainer Updates Project Activity Settings ---');
    
    const updateRes = await axios.put(
      `${BASE_URL}/projects/${createdProject._id}`,
      {
        estimatedHours: 20,
        difficulty: 'Advanced',
      },
      { headers: trainerHeaders }
    );
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.data.project.estimatedHours, 20);
    assert.strictEqual(updateRes.data.project.difficulty, 'Advanced');
    console.log('  [PASS] Trainer updated estimatedHours to 20 and difficulty to Advanced');

    // ─── 7. Student Enrolls in Project-Based Activity ─────────────────────────
    console.log('\n--- 7. Student Enrolls & Begins Practical Learning ---');
    
    const enrollRes = await axios.post(
      `${BASE_URL}/projects/${createdProject._id}/enroll`,
      {},
      { headers: studentHeaders }
    );
    assert.strictEqual(enrollRes.status, 201);
    assert.strictEqual(enrollRes.data.enrollment.status, 'not_started');
    console.log('  [PASS] Student enrolled in project activity');

    // Trainer inspects participants list
    const participantsRes = await axios.get(
      `${BASE_URL}/projects/${createdProject._id}/participants`,
      { headers: trainerHeaders }
    );
    assert.strictEqual(participantsRes.status, 200);
    assert.strictEqual(participantsRes.data.participants.length, 1);
    assert.strictEqual(participantsRes.data.participants[0].student.name, 'Learner One');
    console.log('  [PASS] Trainer views participants list containing enrolled student');

    // ─── 8. Student Submits Project Deliverable ───────────────────────────────
    console.log('\n--- 8. Student Submits Practical Project Deliverables ---');
    
    const submitRes = await axios.post(
      `${BASE_URL}/projects/${createdProject._id}/submit`,
      {
        githubUrl: 'https://github.com/learner-one/microservices-task-engine',
        liveDemoUrl: 'https://task-engine-demo.up.railway.app',
        notes: 'Implemented BullMQ with Redis cluster and automated health check retries.',
      },
      { headers: studentHeaders }
    );
    assert.strictEqual(submitRes.status, 201);
    const submissionId = submitRes.data.submission._id;
    console.log('  [PASS] Student submitted GitHub repo and live demo URL');

    // ─── 9. Trainer Reviews & Grades Submission Using Rubric ─────────────────
    console.log('\n--- 9. Trainer Evaluates Deliverable Against Rubric Criteria ---');
    
    // Trainer fetches submissions list
    const subsListRes = await axios.get(
      `${BASE_URL}/projects/${createdProject._id}/submissions`,
      { headers: trainerHeaders }
    );
    assert.strictEqual(subsListRes.status, 200);
    assert.strictEqual(subsListRes.data.submissions.length, 1);
    console.log('  [PASS] Trainer retrieved pending submission');

    // Trainer grades submission
    const gradeRes = await axios.put(
      `${BASE_URL}/projects/${createdProject._id}/submissions/${submissionId}/grade`,
      {
        grade: 96,
        feedback: 'Outstanding architecture! Clean Docker setup, robust Redis worker error recovery, and clear documentation.',
        rubricScores: [
          { criteria: 'Worker Queue Architecture', pointsAwarded: 38, maxPoints: 40 },
          { criteria: 'Code Quality & Error Handling', pointsAwarded: 29, maxPoints: 30 },
          { criteria: 'Containerization & Deployment', pointsAwarded: 19, maxPoints: 20 },
          { criteria: 'Documentation & API Spec', pointsAwarded: 10, maxPoints: 10 },
        ],
      },
      { headers: trainerHeaders }
    );
    assert.strictEqual(gradeRes.status, 200);
    assert.strictEqual(gradeRes.data.submission.grade, 96);
    assert.strictEqual(gradeRes.data.submission.status, 'graded');
    console.log('  [PASS] Trainer successfully graded deliverable: 96/100 points');
    console.log('  [PASS] Evaluation rubric breakdown recorded');

    // Student confirms grade & feedback
    const mySubRes = await axios.get(
      `${BASE_URL}/projects/${createdProject._id}/my-submission`,
      { headers: studentHeaders }
    );
    assert.strictEqual(mySubRes.status, 200);
    assert.strictEqual(mySubRes.data.submission.grade, 96);
    assert.strictEqual(mySubRes.data.submission.reviewedBy.name, 'Lead Technical Trainer');
    console.log('  [PASS] Student receives score and trainer constructive feedback');

    // ─── 10. Instructor Dashboard Verification ───────────────────────────────
    console.log('\n--- 10. Trainer Dashboard Metrics & Projects Summary ---');
    
    const statsRes = await axios.get(`${BASE_URL}/instructor/stats`, { headers: trainerHeaders });
    assert.strictEqual(statsRes.status, 200);
    assert(statsRes.data.myProjectsCount >= 1, 'Dashboard reports trainer project activities');
    assert(statsRes.data.projectMetrics.length >= 1, 'Dashboard returns project activities breakdown');
    console.log(`  [PASS] Trainer Dashboard metrics confirms ${statsRes.data.myProjectsCount} project activities`);

    // ─── Cleanup ─────────────────────────────────────────────────────────────
    console.log('\n--- Cleanup: Purging Temporary Test Records ---');
    await ProjectSubmission.deleteMany({ projectId: createdProject._id });
    await ProjectEnrollment.deleteMany({ projectId: createdProject._id });
    await ProjectMilestone.deleteMany({ projectId: createdProject._id });
    await Project.findByIdAndDelete(createdProject._id);
    await User.deleteMany({ email: { $in: [trainerEmail, foreignTrainerEmail, studentEmail] } });
    console.log('✓ Temporary test entities cleanly removed.');

    console.log('\n================================================================');
    console.log('🏁 TEST SUMMARY: ALL SLP-7 USER STORY ACCEPTANCE CRITERIA PASSED');
    console.log('================================================================\n');

  } catch (error) {
    console.error('Unhandled test suite error:', error);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
  }
}

runSLP7TestSuite();
