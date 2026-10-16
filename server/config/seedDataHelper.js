import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import Resource from '../models/Resource.js';
import CodingChallenge from '../models/CodingChallenge.js';
import InternshipProject from '../models/InternshipProject.js';
import SkillAssessment from '../models/SkillAssessment.js';
import Quiz from '../models/Quiz.js';
import { seedSampleQuizzes } from '../seed-quizzes.js';

export async function runAutoSeed() {
  try {
    const courseCount = await Course.countDocuments();
    if (courseCount > 0) {
      console.log(`[AutoSeed] Database already has ${courseCount} courses.`);
      await seedSampleQuizzes();
      return;
    }

    console.log('[AutoSeed] Populating initial dataset (users, courses, challenges, projects)...');

    // 1. Seed Accounts
    const adminPass = await bcrypt.hash('admin123', 10);
    const instPass = await bcrypt.hash('instructor123', 10);
    const studPass = await bcrypt.hash('student123', 10);

    const admin = await User.findOneAndUpdate(
      { email: 'admin@learnhub.com' },
      {
        name: 'Platform Admin',
        email: 'admin@learnhub.com',
        password: adminPass,
        role: 'admin',
        isTwoFactorEnabled: false,
      },
      { upsert: true, new: true }
    );

    const instructor = await User.findOneAndUpdate(
      { email: 'instructor@learnhub.com' },
      {
        name: 'Alex Rivera',
        email: 'instructor@learnhub.com',
        password: instPass,
        role: 'instructor',
        isTwoFactorEnabled: false,
      },
      { upsert: true, new: true }
    );

    await User.findOneAndUpdate(
      { email: 'student@learnhub.com' },
      {
        name: 'Demo Student',
        email: 'student@learnhub.com',
        password: studPass,
        role: 'student',
        isTwoFactorEnabled: false,
      },
      { upsert: true, new: true }
    );

    // 2. Seed Courses
    const courses = [
      {
        title: 'Full-Stack Web Development with React & Node.js',
        description: 'Master modern frontend and backend web architecture from scratch using React, Tailwind CSS, Node.js, Express, and MongoDB.',
        category: 'Web Development',
        difficulty: 'Beginner',
        duration: '8 Weeks',
        instructor: 'Alex Rivera',
        instructorId: instructor._id,
        thumbnail: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?auto=format&fit=crop&w=800&q=80',
        status: 'published',
        modules: [
          {
            title: 'Module 1: Modern Frontend with React & Component Architecture',
            description: 'Understand JSX, props, state management, hooks, and clean reusable UI layout patterns.',
            lessons: [
              {
                title: '1.1 React Fundamentals: Components, Props, and State',
                description: 'Learn how React builds fast virtual DOM interfaces with unidirectional data flow.',
                content: `React is the industry-standard UI library for modern web applications.\n\nKey Concepts:\n- Functional Components and JSX\n- State management with useState\n- Passing data through props\n- Event handling in modern React`,
              },
              {
                title: '1.2 Side Effects and Data Fetching with useEffect',
                description: 'Synchronize component lifecycle with external REST APIs and clean up resources.',
                content: `Learn to manage lifecycle side effects using useEffect.\n\nTopics Covered:\n- Fetching data on component mount\n- Dependency arrays and stale closures\n- AbortController for clean network teardown`,
              },
            ],
          },
          {
            title: 'Module 2: Scalable Backend Services with Node.js & Express',
            description: 'Design RESTful APIs, implement middleware pipelines, and manage database persistence.',
            lessons: [
              {
                title: '2.1 Express Server Setup & Router Architecture',
                description: 'Structure clean modular controllers, routes, and asynchronous error handling.',
                content: `Node.js and Express form the foundation of high-performance server architectures.\n\nKey Best Practices:\n- Separation of concerns between routes and business logic\n- Centralized error handlers\n- Environment variable validation`,
              },
            ],
          },
        ],
      },
      {
        title: 'Machine Learning & Applied AI Fundamentals',
        description: 'Explore neural networks, computer vision, natural language processing, and modern LLM application workflows.',
        category: 'Data Science',
        difficulty: 'Intermediate',
        duration: '10 Weeks',
        instructor: 'Dr. Priya Sharma',
        instructorId: instructor._id,
        thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
        status: 'published',
        modules: [
          {
            title: 'Module 1: Supervised Learning & Model Evaluation',
            description: 'Master linear models, tree-based algorithms, cross-validation, and metrics.',
            lessons: [
              {
                title: '1.1 Linear Regression & Gradient Descent',
                description: 'Mathematical intuition and Python implementation of convex optimization.',
                content: `Gradient descent forms the engine behind almost every deep learning optimization.\n\nHighlights:\n- Loss functions (MSE, MAE)\n- Learning rates and convergence\n- Vectorized implementations in NumPy`,
              },
            ],
          },
        ],
      },
      {
        title: 'Cloud Infrastructure & DevOps with Docker & AWS',
        description: 'Learn containerization, CI/CD automated deployments, infrastructure as code, and cloud monitoring.',
        category: 'Cloud Computing',
        difficulty: 'Advanced',
        duration: '6 Weeks',
        instructor: 'Marcus Vance',
        instructorId: instructor._id,
        thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
        status: 'published',
        modules: [
          {
            title: 'Module 1: Docker Containers & Image Optimization',
            description: 'Build secure, multi-stage container images for production services.',
            lessons: [
              {
                title: '1.1 Containerizing Node.js and React Applications',
                description: 'Write optimal Dockerfiles with caching and minimal base images.',
                content: `Containerization ensures reproducibility across development, staging, and production environments.\n\nTopics:\n- Layer caching\n- Multi-stage builds\n- Non-root user execution`,
              },
            ],
          },
        ],
      },
    ];

    for (const cData of courses) {
      const course = await Course.create({
        title: cData.title,
        description: cData.description,
        category: cData.category,
        difficulty: cData.difficulty,
        duration: cData.duration,
        instructor: cData.instructor,
        instructorId: cData.instructorId,
        thumbnail: cData.thumbnail,
        status: cData.status,
      });

      let modOrder = 1;
      for (const mData of cData.modules) {
        const moduleDoc = await Module.create({
          courseId: course._id,
          title: mData.title,
          description: mData.description,
          order: modOrder++,
        });

        let lesOrder = 1;
        for (const lData of mData.lessons) {
          const lesson = await Lesson.create({
            moduleId: moduleDoc._id,
            courseId: course._id,
            title: lData.title,
            description: lData.description,
            content: lData.content,
            order: lesOrder++,
          });

          await Resource.create({
            lessonId: lesson._id,
            title: `${lData.title} Reference Guide`,
            type: 'Documentation',
            description: 'Official notes and reference cheat-sheet.',
            url: 'https://developer.mozilla.org',
          });
        }
      }
    }

    // 3. Seed Coding Challenges
    const challengeCount = await CodingChallenge.countDocuments();
    if (challengeCount === 0) {
      await CodingChallenge.create([
        {
          title: 'Two Sum',
          description: 'Find two numbers in an array that add up to a specific target and return their indices.',
          problemStatement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
          category: 'Data Structures & Algorithms',
          difficulty: 'Easy',
          tags: ['Arrays', 'Hash Table', 'Placement Prep'],
          companyTags: ['Google', 'Amazon', 'Microsoft'],
          points: 10,
          constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],
          starterCode: {
            javascript: 'function twoSum(nums, target) {\n  // Write your solution here\n}',
            python: 'def two_sum(nums, target):\n    # Write your solution here\n    pass',
          },
          testCases: [
            { input: '[2, 7, 11, 15], 9', expectedOutput: '[0, 1]', isHidden: false },
            { input: '[3, 2, 4], 6', expectedOutput: '[1, 2]', isHidden: false },
          ],
        },
        {
          title: 'Valid Palindrome',
          description: 'Determine if a given string is a palindrome considering only alphanumeric characters and ignoring cases.',
          problemStatement: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.',
          category: 'Strings',
          difficulty: 'Easy',
          tags: ['Two Pointers', 'Strings'],
          companyTags: ['Meta', 'Apple'],
          points: 10,
          starterCode: {
            javascript: 'function isPalindrome(s) {\n  // Write your solution here\n}',
            python: 'def is_palindrome(s):\n    # Write your solution here\n    pass',
          },
          testCases: [
            { input: '"A man, a plan, a canal: Panama"', expectedOutput: 'true', isHidden: false },
            { input: '"race a car"', expectedOutput: 'false', isHidden: false },
          ],
        },
      ]);
    }

    // 4. Seed Internship Projects
    const projectCount = await InternshipProject.countDocuments();
    if (projectCount === 0) {
      await InternshipProject.create([
        {
          title: 'E-Commerce Product Recommendation Engine',
          description: 'Build a full-stack recommendation engine that suggests products based on user browsing history and collaborative filtering.',
          detailedOverview: 'Design and implement a production-ready recommendation system using React for the frontend and Node.js/Express for the backend.',
          category: 'Web Development',
          difficulty: 'Intermediate',
          estimatedDuration: '4 Weeks',
          skills: ['React', 'Node.js', 'MongoDB', 'REST API'],
          tools: ['VS Code', 'Git', 'Postman'],
          industry: 'E-Commerce',
          companyType: 'Startup',
          thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80',
          status: 'active',
          popularity: 88,
          milestones: [
            { title: 'Project Setup & Database Schema', description: 'Initialize project models and connections.', order: 0 },
            { title: 'Backend REST API', description: 'Build product CRUD and tracking endpoints.', order: 1 },
            { title: 'Frontend UI', description: 'Build interactive recommendation cards and carousels.', order: 2 },
          ],
        },
        {
          title: 'Cloud DevOps CI/CD Deployment Pipeline',
          description: 'Automate build, test, and containerized deployment pipelines with GitHub Actions and Docker.',
          detailedOverview: 'Implement comprehensive CI/CD pipelines ensuring high test coverage, automated linting, container builds, and zero-downtime releases.',
          category: 'DevOps & Cloud',
          difficulty: 'Advanced',
          estimatedDuration: '3 Weeks',
          skills: ['Docker', 'CI/CD', 'GitHub Actions', 'Linux'],
          tools: ['Docker Hub', 'Git'],
          industry: 'Cloud Infrastructure',
          companyType: 'Enterprise',
          thumbnail: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=800&q=80',
          status: 'active',
          popularity: 92,
          milestones: [
            { title: 'Containerization', description: 'Write multi-stage Dockerfiles.', order: 0 },
            { title: 'Pipeline Automation', description: 'Configure GitHub Actions test & push steps.', order: 1 },
          ],
        },
      ]);
    }

    // 5. Seed Skill Diagnostic Assessment
    const assessmentCount = await SkillAssessment.countDocuments();
    if (assessmentCount === 0) {
      await SkillAssessment.create({
        title: 'Engineering & Problem-Solving Skill Diagnostic',
        description: 'Assess your proficiency across Web Development, Data Structures, Backend & Databases, and System Architecture.',
        passingThresholds: {
          intermediate: 50,
          advanced: 80,
        },
        questions: [
          {
            questionText: 'What is the primary difference between `var`, `let`, and `const` in modern JavaScript?',
            category: 'Web Development',
            difficulty: 'Beginner',
            options: [
              { text: '`var` is block-scoped while `let` and `const` are function-scoped', isCorrect: false },
              { text: '`let` and `const` are block-scoped; `const` prevents variable reassignment', isCorrect: true },
              { text: 'There are no differences; they are aliases for backwards compatibility', isCorrect: false },
              { text: '`const` creates immutable objects where internal properties cannot change', isCorrect: false },
            ],
            explanation: '`let` and `const` provide block scoping introduced in ES6, with `const` preventing rebinding of identifier.',
          },
          {
            questionText: 'In React, what is the best practice for preventing unnecessary re-renders of a computationally intensive child component?',
            category: 'Web Development',
            difficulty: 'Intermediate',
            options: [
              { text: 'Wrap it with React.memo or use useMemo for its expensive calculations', isCorrect: true },
              { text: 'Store the component inside useState', isCorrect: false },
              { text: 'Force re-render using useReducer', isCorrect: false },
              { text: 'Assign unique random keys to it on every render', isCorrect: false },
            ],
            explanation: 'React.memo memoizes render output and useMemo memoizes heavy calculation results.',
          },
        ],
      });
    }

    // 6. Seed Sample Quizzes
    await seedSampleQuizzes();

    console.log('[AutoSeed] Database initialized and seeded successfully!');
  } catch (err) {
    console.error('[AutoSeed] Error during auto-seeding:', err);
  }
}
