import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from './models/Course.js';
import Module from './models/Module.js';
import Lesson from './models/Lesson.js';
import User from './models/User.js';
import PracticalExercise from './models/PracticalExercise.js';
import { EXERCISE_UPLOAD_DIR } from './config/exerciseUploadConfig.js';

dotenv.config();

export const seedPracticalExercises = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online-learning';
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri);
    }
    console.log('Connected to MongoDB for practical exercises seeding...');

    // Fetch instructor or admin user
    let instructor = await User.findOne({ role: 'instructor' });
    if (!instructor) {
      instructor = await User.findOne({ role: 'admin' });
    }

    const courses = await Course.find({});
    if (courses.length === 0) {
      console.log('No courses found. Please seed courses first.');
      return 0;
    }

    const webCourse =
      courses.find((c) => c.category === 'Web Development' || c.title.includes('Full-Stack')) || courses[0];
    const devopsCourse =
      courses.find((c) => c.category === 'Cloud & DevOps' || c.title.includes('Cloud')) || courses[1] || courses[0];
    const aiCourse =
      courses.find((c) => c.category === 'Data Science & AI' || c.title.includes('Machine Learning')) ||
      courses[2] ||
      courses[0];

    // Find modules and lessons for the web course
    const webModules = await Module.find({ courseId: webCourse._id }).sort({ order: 1 });
    const firstModule = webModules[0];
    const firstLesson = firstModule
      ? await Lesson.findOne({ moduleId: firstModule._id }).sort({ order: 1 })
      : null;

    const exerciseData = [
      {
        title: 'Exercise 1: Refactoring Legacy HTML to Semantic HTML5 & Modern Layouts',
        description:
          'Transform an unsemantic, div-heavy web document into an accessible, SEO-optimized HTML5 structure utilizing semantic elements and CSS Flexbox alignment.',
        learningObjectives: [
          'Replace non-semantic <div> tags with appropriate <header>, <nav>, <main>, and <article> semantic containers.',
          'Implement accessible landmark roles and keyboard navigation standards.',
          'Organize responsive flex container flows adhering to modern web design principles.',
        ],
        instructions: `### Task Instructions:
1. Examine the provided starter HTML snippet.
2. Identify all generic \`<div class="header">\`, \`<div class="nav">\`, and \`<div class="content">\` tags.
3. Replace them with standard semantic HTML5 elements (\`<header>\`, \`<nav>\`, \`<main>\`, \`<section>\`, \`<article>\`, \`<footer>\`).
4. Ensure all interactive buttons and links have appropriate accessible names or aria attributes.
5. Provide your refactored code solution in the editor below.`,
        exerciseType: 'Coding Exercise',
        difficulty: 'Beginner',
        estimatedMinutes: 25,
        maximumMarks: 100,
        passingMarks: 70,
        courseId: webCourse._id,
        moduleId: firstModule?._id || null,
        lessonId: firstLesson?._id || null,
        createdBy: instructor?._id,
        referenceMaterials: [
          {
            title: 'MDN: HTML Semantic Elements Guide',
            url: 'https://developer.mozilla.org/en-US/docs/Glossary/Semantics#semantics_in_html',
          },
          {
            title: 'W3C Accessibility Guidelines (WCAG 2.1)',
            url: 'https://www.w3.org/WAI/standards-guidelines/wcag/',
          },
        ],
        status: 'Published',
      },
      {
        title: 'Exercise 2: Building an Idempotent REST API Controller in Express & MongoDB',
        description:
          'Implement an Express route handler that prevents duplicate course enrollment submissions, properly handles Mongoose validation errors, and returns consistent JSON responses.',
        learningObjectives: [
          'Handle atomic findOneAndUpdate operations with idempotency keys in MongoDB.',
          'Format standard API error envelopes with HTTP status codes (400, 404, 409).',
          'Write automated unit test assertions for edge cases.',
        ],
        instructions: `### Task Instructions:
Write an asynchronous Express route handler for \`POST /api/courses/:id/enroll\`:
\`\`\`javascript
router.post('/courses/:id/enroll', protect, async (req, res) => {
  // 1. Verify that the course exists and is published
  // 2. Check if the user is already enrolled (reject with 400 Bad Request)
  // 3. Atomically create an Enrollment record
  // 4. Return status 201 with the new enrollment object
});
\`\`\`
Ensure complete try/catch coverage and structured error logging.`,
        exerciseType: 'Coding Exercise',
        difficulty: 'Intermediate',
        estimatedMinutes: 40,
        maximumMarks: 100,
        passingMarks: 75,
        courseId: webCourse._id,
        moduleId: firstModule?._id || null,
        lessonId: null,
        createdBy: instructor?._id,
        referenceMaterials: [
          {
            title: 'Express.js Error Handling Documentation',
            url: 'https://expressjs.com/en/guide/error-handling.html',
          },
        ],
        status: 'Published',
      },
      {
        title: 'Exercise 3: Microservice Dockerfile Security Audit & Hardening Report',
        description:
          'Audit a vulnerable, monolithic Dockerfile and rewrite it as a hardened multi-stage build running under an unprivileged user with minimal attack surface.',
        learningObjectives: [
          'Identify common container security flaws (running as root, unpinned package versions, secret leaks).',
          'Implement multi-stage Docker builds using Alpine base images.',
          'Configure HEALTHCHECK directives and non-root USER permissions.',
        ],
        instructions: `### Task Instructions:
1. Review the insecure Dockerfile provided in the reference material.
2. Produce a written security analysis explaining at least three major security vulnerabilities.
3. Provide your revised, production-hardened multi-stage Dockerfile.
4. Upload your solution as a .txt or .zip file containing the Dockerfile and audit notes.`,
        exerciseType: 'File Upload',
        difficulty: 'Intermediate',
        estimatedMinutes: 45,
        maximumMarks: 100,
        passingMarks: 70,
        courseId: devopsCourse._id,
        moduleId: null,
        lessonId: null,
        createdBy: instructor?._id,
        referenceMaterials: [
          {
            title: 'OWASP Docker Security Cheat Sheet',
            url: 'https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html',
          },
        ],
        status: 'Published',
      },
      {
        title: 'Exercise 4: Evaluating Machine Learning Model Bias & Confusion Matrix Analysis',
        description:
          'Given a simulated dataset with class imbalance, analyze the precision, recall, and F1-score across demographic sub-groups and provide a written remediation recommendation.',
        learningObjectives: [
          'Compute precision, recall, specificity, and F1 score from confusion matrices.',
          'Detect bias and disparate impact in algorithmic classification.',
          'Formulate data augmentation and re-weighting mitigation strategies.',
        ],
        instructions: `### Task Instructions:
1. Analyze the performance breakdown table for the loan approval classifier.
2. Calculate the false positive rate and false negative rate for each demographic group.
3. Draft a 300-500 word remediation plan recommending either threshold tuning, synthetic minority over-sampling (SMOTE), or adversarial de-biasing.
4. Submit your written answer in the text box below.`,
        exerciseType: 'Text Answer',
        difficulty: 'Advanced',
        estimatedMinutes: 35,
        maximumMarks: 100,
        passingMarks: 80,
        courseId: aiCourse._id,
        moduleId: null,
        lessonId: null,
        createdBy: instructor?._id,
        referenceMaterials: [
          {
            title: 'Google Fairness Indicators & ML Ethics Guidelines',
            url: 'https://www.tensorflow.org/responsible_ai/fairness_indicators/guide',
          },
        ],
        status: 'Published',
      },
      {
        title: 'Exercise 5: Interactive Custom React Hook for Real-Time Window Resizing & Breakpoints',
        description:
          'Create a performant, debounced custom React hook \`useResponsiveBreakpoint()\` that detects mobile, tablet, and desktop viewports without unnecessary re-renders.',
        learningObjectives: [
          'Construct custom React hooks with useEffect cleanup listeners.',
          'Debounce window resize events to avoid main-thread performance degradation.',
          'Expose boolean indicators (\`isMobile\`, \`isTablet\`, \`isDesktop\`) with TypeScript or JSDoc types.',
        ],
        instructions: `### Task Instructions:
Write the complete implementation of \`useResponsiveBreakpoint(debounceMs = 150)\`:
1. Use \`window.innerWidth\` to determine active breakpoint.
2. Clean up event listeners in the \`useEffect\` return function.
3. Test your code against window resize triggers.
4. Paste your hook implementation below.`,
        exerciseType: 'Coding Exercise',
        difficulty: 'Beginner',
        estimatedMinutes: 20,
        maximumMarks: 100,
        passingMarks: 70,
        courseId: webCourse._id,
        moduleId: firstModule?._id || null,
        lessonId: firstLesson?._id || null,
        createdBy: instructor?._id,
        referenceMaterials: [
          {
            title: 'React Documentation: Reusing Logic with Custom Hooks',
            url: 'https://react.dev/learn/reusing-logic-with-custom-hooks',
          },
        ],
        status: 'Published',
      },
    ];

    let seededCount = 0;
    for (let i = 0; i < exerciseData.length; i++) {
      const ex = exerciseData[i];
      const starterKey = `experiment_starter_${i + 1}.txt`;
      const starterPath = path.join(EXERCISE_UPLOAD_DIR, starterKey);

      // Create sample lab starter kit content based on the experiment
      let starterContent = `// Experiment Lab Starter: ${ex.title}\n// Follow instructions in the exercise specification.\n`;
      if (ex.exerciseType === 'Coding Exercise') {
        starterContent = `// === ${ex.title} ===\n// Starter template\nfunction solution() {\n  // TODO: Implement solution\n}\nmodule.exports = { solution };\n`;
      } else if (ex.exerciseType === 'File Upload') {
        starterContent = `# Lab Experiment Sheet: ${ex.title}\n\nObjective:\n${ex.description}\n\nDeliverables:\n- Provide complete solution in an uploaded document or code bundle.`;
      }

      if (!fs.existsSync(EXERCISE_UPLOAD_DIR)) {
        fs.mkdirSync(EXERCISE_UPLOAD_DIR, { recursive: true });
      }
      fs.writeFileSync(starterPath, starterContent, 'utf-8');

      ex.experimentFile = {
        originalName: `experiment_${i + 1}_lab_starter.txt`,
        storageKey: starterKey,
        mimeType: 'text/plain',
        fileSize: Buffer.byteLength(starterContent),
      };

      await PracticalExercise.findOneAndUpdate(
        { title: ex.title },
        ex,
        { upsert: true, new: true }
      );
      seededCount++;
    }

    console.log(`✅ Successfully seeded ${seededCount} practical exercises!`);
    return seededCount;
  } catch (error) {
    console.error('❌ Error seeding practical exercises:', error);
    throw error;
  }
};

if (process.argv[1]?.includes('seedExercises.js')) {
  seedPracticalExercises()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
