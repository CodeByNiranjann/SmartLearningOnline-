import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  ProjectActivity,
  ActivityMilestone,
  ActivityAssignment,
  ActivitySubmission,
  Course,
  Module,
  Lesson,
  User,
} from './models/index.js';

dotenv.config();

export const seedActivities = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online-learning';
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri);
    }
    console.log('[SEED] Connected to MongoDB for activities seeding...');

    // Find instructor or admin
    let instructor = await User.findOne({ role: 'instructor' });
    if (!instructor) {
      instructor = await User.findOne({ role: 'admin' });
    }
    if (!instructor) {
      console.log('[SEED] No instructor or admin user found to associate activities.');
      return;
    }

    // Find student
    const student = await User.findOne({ role: 'student' });

    // Fetch existing courses
    const courses = await Course.find({});
    if (!courses.length) {
      console.log('[SEED] No courses found. Run seed.js first.');
      return;
    }

    const reactCourse = courses.find((c) => c.title.includes('React')) || courses[0];
    const devopsCourse = courses.find((c) => c.title.includes('DevOps') || c.title.includes('Cloud')) || courses[1] || courses[0];
    const mlCourse = courses.find((c) => c.title.includes('Machine Learning') || c.title.includes('AI')) || courses[2] || courses[0];

    // Check if activities already exist
    const existingCount = await ProjectActivity.countDocuments();
    if (existingCount > 0) {
      console.log(`[SEED] Found ${existingCount} existing project activities. Skipping duplicate seed.`);
      return;
    }

    console.log('[SEED] Creating sample Project Activities with milestones & evaluation rubrics...');

    const sampleActivities = [
      {
        course: reactCourse._id,
        trainer: instructor._id,
        title: 'Real-Time Collaborative Markdown Editor & Live Preview',
        description: 'Build a full-stack real-time collaborative document workspace featuring WebSockets, conflict-free document sync, and live Markdown rendering.',
        problemStatement: 'Distributed remote teams struggle to draft specifications synchronously. The challenge is building an in-browser markdown suite supporting concurrent editors, syntax highlighting, and PDF exporting.',
        category: 'Full-Stack Development',
        difficulty: 'Intermediate',
        activityType: 'individual',
        estimatedDuration: '6 hours',
        startDate: new Date(Date.now() - 7 * 86400000),
        dueDate: new Date(Date.now() + 14 * 86400000),
        maximumMarks: 100,
        passingMarks: 60,
        allowResubmission: true,
        status: 'published',
        requiredSkills: ['React State Management', 'WebSocket Sync', 'Markdown AST Parsing', 'Export Pipelines'],
        technologyStack: ['React', 'Node.js', 'Socket.io', 'Tailwind CSS', 'Highlight.js'],
        learningObjectives: [
          'Implement bidirectional WebSocket communication for low-latency collaboration',
          'Safely parse and sanitize user Markdown to prevent cross-site scripting (XSS)',
          'Create a modular split-pane editor layout with auto-scroll synchronization',
        ],
        deliverables: [
          'GitHub repository with unit tests and clear setup README',
          'Live hosted demo URL (Vercel/Render/Railway)',
          'Brief technical architecture writeup explaining WebSocket protocol design',
        ],
        gradingRubric: [
          { criteria: 'Real-time WebSocket Synchronization', maxMarks: 35, description: 'Low-latency updates between two or more concurrent browser sessions' },
          { criteria: 'Editor Usability & Markdown AST Parsing', maxMarks: 30, description: 'Accurate rendering, tables, code blocks with syntax highlighting' },
          { criteria: 'Code Quality & Security Sanitization', maxMarks: 20, description: 'XSS prevention via DOMPurify and clean modular component design' },
          { criteria: 'Documentation & Test Suite', maxMarks: 15, description: 'Comprehensive README, unit tests for markdown transformer' },
        ],
        milestones: [
          {
            sequenceOrder: 1,
            title: 'Milestone 1: Dual-Pane Editor UI & Markdown Parser',
            description: 'Implement responsive side-by-side editing pane with synchronized scroll and sanitization.',
            completionRequirements: 'Working split-screen editor that translates raw markdown into rich HTML in real-time.',
            dueDate: new Date(Date.now() + 3 * 86400000),
          },
          {
            sequenceOrder: 2,
            title: 'Milestone 2: WebSocket Server & Room-Based Document Sync',
            description: 'Set up Node.js WebSocket service with room isolation for simultaneous document editing.',
            completionRequirements: 'Broadcast changes to connected peers with debounce to prevent flood.',
            dueDate: new Date(Date.now() + 7 * 86400000),
          },
          {
            sequenceOrder: 3,
            title: 'Milestone 3: Export Engine & Production Deployment',
            description: 'Support document export to PDF/HTML and deploy frontend and backend to production.',
            completionRequirements: 'Downloadable document artifacts and live verified demo URL.',
            dueDate: new Date(Date.now() + 14 * 86400000),
          },
        ],
      },
      {
        course: devopsCourse._id,
        trainer: instructor._id,
        title: 'Resilient Microservices CI/CD Pipeline & Automated Health Checks',
        description: 'Construct an end-to-end automated deployment pipeline with GitHub Actions, Docker multi-stage builds, and blue-green canary deployment rollback.',
        problemStatement: 'Manual deployments frequently produce regressions and downtime. Your mission is establishing an automated delivery lifecycle that lints, tests, containerizes, and health-checks code before cutover.',
        category: 'DevOps & Cloud Infrastructure',
        difficulty: 'Advanced',
        activityType: 'individual',
        estimatedDuration: '8 hours',
        startDate: new Date(Date.now() - 5 * 86400000),
        dueDate: new Date(Date.now() + 10 * 86400000),
        maximumMarks: 100,
        passingMarks: 70,
        allowResubmission: true,
        status: 'published',
        requiredSkills: ['Docker Multi-stage Builds', 'GitHub Actions CI', 'Nginx Reverse Proxy', 'Healthcheck Probes'],
        technologyStack: ['Docker', 'GitHub Actions', 'Nginx', 'Node.js', 'Bash'],
        learningObjectives: [
          'Design minimal Docker images utilizing non-root security principles',
          'Construct multi-job CI pipelines with artifact caching',
          'Implement automated rollbacks based on dynamic HTTP status probe responses',
        ],
        deliverables: [
          'Public GitHub repo with .github/workflows CI pipeline configuration',
          'Verified container registry badge and reproducible Dockerfile',
          'Screen recording demonstrating automated test pass and deployment',
        ],
        gradingRubric: [
          { criteria: 'Multi-Stage Container Optimization', maxMarks: 30, description: 'Minimal image footprint under 150MB with non-root runtime user' },
          { criteria: 'CI Workflow Pipeline Execution', maxMarks: 35, description: 'Automated test suite, lint check, build matrix, and vulnerability scan' },
          { criteria: 'Resilience & Automated Health Probes', maxMarks: 20, description: 'Graceful shutdown handling and synthetic health probes' },
          { criteria: 'Deployment Documentation', maxMarks: 15, description: 'Clear step-by-step reproduction instructions and architecture diagrams' },
        ],
        milestones: [
          {
            sequenceOrder: 1,
            title: 'Milestone 1: Hardened Multi-Stage Dockerfile',
            description: 'Create Dockerfile separating build tools from production runtime.',
            completionRequirements: 'Passed dive / security lint scan with image size minimized.',
            dueDate: new Date(Date.now() + 4 * 86400000),
          },
          {
            sequenceOrder: 2,
            title: 'Milestone 2: Multi-Stage GitHub Actions Pipeline',
            description: 'Configure automated test execution on pull request and image release on main branch.',
            completionRequirements: 'Green passing pipeline run with test reporting.',
            dueDate: new Date(Date.now() + 10 * 86400000),
          },
        ],
      },
      {
        course: mlCourse._id,
        trainer: instructor._id,
        title: 'Customer Churn Prediction API & Interactive Streamlit Dashboard',
        description: 'Train a tree-based classification model on customer telemetry, expose predictions via FastAPI, and build an interactive what-if analysis dashboard.',
        problemStatement: 'SaaS companies lose up to 15% annual revenue through preventable churn. Engineers must build a predictive service that highlights at-risk accounts with explainable feature importance.',
        category: 'Data Science & AI',
        difficulty: 'Intermediate',
        activityType: 'individual',
        estimatedDuration: '5 hours',
        startDate: new Date(Date.now() - 2 * 86400000),
        dueDate: new Date(Date.now() + 20 * 86400000),
        maximumMarks: 100,
        passingMarks: 65,
        allowResubmission: true,
        status: 'draft',
        requiredSkills: ['Scikit-Learn Classification', 'FastAPI REST Service', 'Feature Importance (SHAP)', 'Model Serialization'],
        technologyStack: ['Python', 'FastAPI', 'Scikit-Learn', 'Pandas', 'Streamlit'],
        learningObjectives: [
          'Preprocess tabular data with stratified k-fold cross-validation',
          'Deploy serialized model artifacts through asynchronous REST endpoints',
          'Visualize SHAP explainability values for end-user interpretability',
        ],
        deliverables: [
          'Jupyter notebook with exploratory analysis and model tuning',
          'FastAPI application serving /predict and /healthcheck',
          'Interactive Streamlit UI showing prediction probability and feature breakdown',
        ],
        gradingRubric: [
          { criteria: 'Model Performance & Validation', maxMarks: 35, description: 'ROC-AUC > 0.85 with no data leakage across splits' },
          { criteria: 'FastAPI Production Service', maxMarks: 30, description: 'Typed Pydantic request/response schemas with input validation' },
          { criteria: 'Interpretability & Dashboard', maxMarks: 25, description: 'Clear feature attribution plots and interactive parameter sliders' },
          { criteria: 'Documentation & Packaging', maxMarks: 10, description: 'requirements.txt and straightforward setup steps' },
        ],
        milestones: [
          {
            sequenceOrder: 1,
            title: 'Milestone 1: Model Training & Evaluation Notebook',
            description: 'Perform feature engineering, address class imbalance, and validate model metrics.',
            completionRequirements: 'Exported joblib/pickle model artifact with accuracy and ROC-AUC benchmarks.',
            dueDate: new Date(Date.now() + 5 * 86400000),
          },
          {
            sequenceOrder: 2,
            title: 'Milestone 2: FastAPI Inference Microservice',
            description: 'Implement high-throughput prediction API with input schema guards.',
            completionRequirements: 'Working API with Swagger docs at /docs.',
            dueDate: new Date(Date.now() + 12 * 86400000),
          },
        ],
      },
    ];

    for (const actData of sampleActivities) {
      const { milestones, ...activityFields } = actData;
      const activity = await ProjectActivity.create(activityFields);

      const createdMilestones = [];
      if (milestones && milestones.length > 0) {
        for (const m of milestones) {
          const createdM = await ActivityMilestone.create({
            ...m,
            activity: activity._id,
          });
          createdMilestones.push(createdM);
        }
      }

      // If student exists, enroll in the first activity with sample submission
      if (student && activity.status === 'published' && actData === sampleActivities[0] && createdMilestones.length >= 3) {
        const assignment = await ActivityAssignment.create({
          activity: activity._id,
          student: student._id,
          status: 'in_progress',
          overallProgress: 66,
          milestoneProgress: [
            { milestone: createdMilestones[0]._id, completed: true, completedAt: new Date(Date.now() - 2 * 86400000) },
            { milestone: createdMilestones[1]._id, completed: true, completedAt: new Date(Date.now() - 1 * 86400000) },
            { milestone: createdMilestones[2]._id, completed: false },
          ],
          startedAt: new Date(Date.now() - 3 * 86400000),
        });

        // Add a pending submission for the instructor to review
        const submission = await ActivitySubmission.create({
          activityAssignment: assignment._id,
          activity: activity._id,
          student: student._id,
          attemptNumber: 1,
          status: 'submitted',
          repositoryUrl: 'https://github.com/learner-one/realtime-markdown-editor',
          liveDemoUrl: 'https://markdown-editor-demo.vercel.app',
          notes: 'Completed the dual-pane editor and WebSocket synchronization! Tested with two Chrome tabs and sync is instant.',
          submittedAt: new Date(Date.now() - 12 * 3600000),
        });

        assignment.submissions = [submission._id];
        await assignment.save();
      }

      console.log(`  [OK] Seeded Project Activity: "${activity.title}" (${activity.status})`);
    }

    console.log('[SEED] Successfully seeded project activities and sample submission.\n');
  } catch (error) {
    console.error('[SEED ERROR] Failed to seed project activities:', error);
  }
};

if (process.argv[1]?.endsWith('seedActivities.js')) {
  seedActivities().then(() => process.exit(0));
}
