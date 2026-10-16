import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SkillAssessment from './models/SkillAssessment.js';

dotenv.config();

const assessmentData = {
  title: 'Engineering & Problem-Solving Skill Diagnostic',
  description: 'Assess your proficiency across Web Development, Data Structures, Backend & Databases, and System Architecture to receive calibrated recommendations.',
  passingThresholds: {
    intermediate: 50,
    advanced: 80,
  },
  questions: [
    // Web Development
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
        { text: 'Use `useEffect` with an empty dependency array in the parent', isCorrect: false },
        { text: 'Wrap the child in `React.memo` and memoize passed callbacks with `useCallback`', isCorrect: true },
        { text: 'Store the child JSX directly in component state', isCorrect: false },
        { text: 'Convert all child props to string types', isCorrect: false },
      ],
      explanation: '`React.memo` performs shallow comparison on props, paired with `useCallback` or `useMemo` for stable reference identity.',
    },
    {
      questionText: 'How does React Server Components (RSC) differ from traditional Server-Side Rendering (SSR)?',
      category: 'Web Development',
      difficulty: 'Advanced',
      options: [
        { text: 'RSC generates HTML once and requires no client-side bundle for non-interactive parts', isCorrect: true },
        { text: 'RSC requires all state management to be handled via WebSockets', isCorrect: false },
        { text: 'SSR does not produce HTML, while RSC only produces HTML', isCorrect: false },
        { text: 'RSC runs in web workers on the browser client', isCorrect: false },
      ],
      explanation: 'RSC execute strictly on the server and transmit a serialized component tree without including their code dependencies in the client JS bundle.',
    },

    // Data Structures & Algorithms
    {
      questionText: 'Which data structure follows a First-In-First-Out (FIFO) access order?',
      category: 'Data Structures & Algorithms',
      difficulty: 'Beginner',
      options: [
        { text: 'Stack', isCorrect: false },
        { text: 'Queue', isCorrect: true },
        { text: 'Binary Search Tree', isCorrect: false },
        { text: 'Hash Table', isCorrect: false },
      ],
      explanation: 'A Queue enforces FIFO, where elements are added at the rear and removed from the front.',
    },
    {
      questionText: 'What is the average time complexity of searching for an element in a balanced Binary Search Tree (AVL / Red-Black)?',
      category: 'Data Structures & Algorithms',
      difficulty: 'Intermediate',
      options: [
        { text: 'O(1)', isCorrect: false },
        { text: 'O(log n)', isCorrect: true },
        { text: 'O(n)', isCorrect: false },
        { text: 'O(n log n)', isCorrect: false },
      ],
      explanation: 'Because the tree height is balanced to log2(n), search operations take O(log n) time.',
    },
    {
      questionText: 'Which algorithm is best suited for finding the shortest path in a graph with non-negative edge weights?',
      category: 'Data Structures & Algorithms',
      difficulty: 'Advanced',
      options: [
        { text: 'Bellman-Ford algorithm', isCorrect: false },
        { text: 'Dijkstra algorithm with a min-priority queue', isCorrect: true },
        { text: 'Floyd-Warshall algorithm', isCorrect: false },
        { text: 'Kruskal minimum spanning tree', isCorrect: false },
      ],
      explanation: 'Dijkstra’s algorithm running with a Fibonacci or binary min-heap runs in O((V + E) log V).',
    },

    // Backend & Databases
    {
      questionText: 'Which HTTP status code signifies that a resource was successfully created?',
      category: 'Backend & Databases',
      difficulty: 'Beginner',
      options: [
        { text: '200 OK', isCorrect: false },
        { text: '201 Created', isCorrect: true },
        { text: '204 No Content', isCorrect: false },
        { text: '304 Not Modified', isCorrect: false },
      ],
      explanation: 'HTTP 201 Created indicates the request has succeeded and led to resource creation.',
    },
    {
      questionText: 'What database mechanism is primarily used to speed up queries by preventing full table/collection scans?',
      category: 'Backend & Databases',
      difficulty: 'Intermediate',
      options: [
        { text: 'Database Transactions', isCorrect: false },
        { text: 'Indexes (e.g. B-Trees, Hash indexes)', isCorrect: true },
        { text: 'Foreign key constraints', isCorrect: false },
        { text: 'Database triggers', isCorrect: false },
      ],
      explanation: 'Indexes provide logarithmic lookup paths (B-Trees) rather than inspecting every document/row.',
    },
    {
      questionText: 'Under the CAP theorem, what trade-off occurs during a network partition in a distributed database?',
      category: 'System Design & Architecture',
      difficulty: 'Advanced',
      options: [
        { text: 'The system must choose between Consistency or Availability', isCorrect: true },
        { text: 'The system automatically doubles storage capacity', isCorrect: false },
        { text: 'Latency is guaranteed to drop to zero', isCorrect: false },
        { text: 'ACID transactions become mandatory across all nodes', isCorrect: false },
      ],
      explanation: 'When a network partition (P) occurs, a distributed system must sacrifice either Availability (A) or linearizable Consistency (C).',
    },
  ],
};

const seedAssessment = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/student-learning-platform';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected for skill assessment seed');

    await SkillAssessment.deleteMany({});
    console.log('Cleared existing skill assessments');

    const created = await SkillAssessment.create(assessmentData);
    console.log(`Created skill assessment with ${created.questions.length} questions successfully!`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding skill assessment:', error);
    process.exit(1);
  }
};

seedAssessment();
