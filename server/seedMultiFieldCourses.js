import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from './models/Course.js';
import Module from './models/Module.js';
import Lesson from './models/Lesson.js';
import User from './models/User.js';

dotenv.config();

const coursesData = [
  // ─── 1. WEB DEVELOPMENT ───────────────────────────────────────────────────
  {
    title: 'Full-Stack Web Development with React & Node.js',
    description: 'Master modern frontend and backend web architecture from scratch using React, Tailwind CSS, Node.js, Express, and MongoDB.',
    category: 'Web Development',
    difficulty: 'Beginner',
    duration: '8 Weeks',
    instructor: 'Alex Rivera',
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
            content: `React is the industry-standard UI library for modern web applications.
Key Concepts:
- Functional Components and JSX
- State management with useState
- Passing data through props
- Event handling in modern React`,
          },
          {
            title: '1.2 Side Effects and Data Fetching with useEffect',
            description: 'Synchronize component lifecycle with external REST APIs and clean up resources.',
            content: `Learn to manage lifecycle side effects using useEffect.
Topics Covered:
- Mounting, updating, and unmounting lifecycle
- Asynchronous API calls with Axios
- Cleanup functions for event listeners and timers`,
          },
        ],
      },
      {
        title: 'Module 2: Scalable Backend with Node.js, Express & MongoDB',
        description: 'Design robust RESTful APIs with route controllers, middleware validation, and database schemas.',
        lessons: [
          {
            title: '2.1 Express Server Pipeline and REST API Design',
            description: 'Build modular controllers, request validation, and error-handling middleware.',
            content: `Express provides a minimalist framework for fast web servers.
Topics Covered:
- Routing and HTTP request methods (GET, POST, PUT, DELETE)
- Body parsing and JSON handling
- Global error-handling middleware`,
          },
          {
            title: '2.2 Mongoose Schema Modeling and Database Persistence',
            description: 'Connect to MongoDB, build schemas, and perform relational document queries.',
            content: `Mongoose bridges JavaScript applications with MongoDB document storage.
Topics Covered:
- Defining schemas with data validation
- Querying with find, findById, and aggregate
- Indexing for query optimization`,
          },
        ],
      },
    ],
  },

  {
    title: 'Advanced Next.js & Full-Stack TypeScript Architecture',
    description: 'Build enterprise-grade web applications with Server Components, Server Actions, App Router, and TypeScript.',
    category: 'Web Development',
    difficulty: 'Advanced',
    duration: '6 Weeks',
    instructor: 'Sarah Jenkins',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    status: 'published',
    modules: [
      {
        title: 'Module 1: Next.js App Router & React Server Components',
        description: 'Leverage zero-bundle-size Server Components, streaming SSR, and parallel route layouts.',
        lessons: [
          {
            title: '1.1 Deep Dive: Server vs Client Components',
            description: 'Understand when to render on the server vs client for optimal Core Web Vitals.',
            content: `Next.js App Router fundamentally separates Server and Client Component rendering.
Topics:
- Server Components default benefits
- 'use client' boundary placement
- Streaming with Suspense and loading.tsx`,
          },
        ],
      },
      {
        title: 'Module 2: Server Actions & Type-Safe Database Mutations',
        description: 'Execute backend database queries and mutations directly without dedicated API routes.',
        lessons: [
          {
            title: '2.1 Modern Form Handling with Server Actions',
            description: 'Use progressive enhancement, optimistic UI updates, and Zod schema validation.',
            content: `Server Actions enable type-safe RPCs executed directly on the server.
Topics:
- Zod schema validation
- useActionState and useOptimistic hooks
- Revalidating path and tag caches`,
          },
        ],
      },
    ],
  },

  // ─── 2. DATA SCIENCE & AI ────────────────────────────────────────────────
  {
    title: 'Applied Machine Learning & Deep Learning with Python',
    description: 'Learn end-to-end data preprocessing, supervised learning, neural networks, and model deployment using PyTorch and Scikit-Learn.',
    category: 'Data Science & AI',
    difficulty: 'Intermediate',
    duration: '10 Weeks',
    instructor: 'Dr. Marcus Vance',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=800&q=80',
    status: 'published',
    modules: [
      {
        title: 'Module 1: Exploratory Data Analysis & Supervised Algorithms',
        description: 'Clean datasets, engineer features, and train Linear Regression, Random Forests, and XGBoost models.',
        lessons: [
          {
            title: '1.1 Data Wrangling with Pandas and NumPy',
            description: 'Handle missing values, categorical encoding, and feature scaling.',
            content: `Essential data preparation workflows for machine learning pipelines.
Topics:
- Vectorized operations with NumPy
- Dataframe filtering and aggregation with Pandas
- Standard and MinMax scaling with Scikit-Learn`,
          },
          {
            title: '1.2 Training and Evaluating Classification Models',
            description: 'Compare accuracy, precision, recall, F1-score, and ROC-AUC curves.',
            content: `Understand model evaluation metrics beyond raw accuracy.
Topics:
- Train-test splitting and k-fold cross-validation
- Confusion matrices and precision-recall trade-offs
- Tuning hyperparameters with GridSearchCV`,
          },
        ],
      },
      {
        title: 'Module 2: Neural Networks & Deep Learning with PyTorch',
        description: 'Construct Multi-Layer Perceptrons, backpropagation, convolutional layers, and loss optimization.',
        lessons: [
          {
            title: '2.1 Building Neural Networks with PyTorch nn.Module',
            description: 'Design forward passes, loss functions (CrossEntropy), and Adam optimizers.',
            content: `PyTorch provides dynamic computation graphs for deep learning.
Topics:
- Tensors and GPU acceleration (CUDA)
- Defining architectures with nn.Sequential and nn.Module
- The training loop: forward pass, loss calculation, backward pass, optimizer step`,
          },
        ],
      },
    ],
  },

  {
    title: 'Generative AI & LLM Application Engineering',
    description: 'Build production AI agents, Retrieval-Augmented Generation (RAG) pipelines, and prompt chains using LangChain and Vector Databases.',
    category: 'Data Science & AI',
    difficulty: 'Advanced',
    duration: '5 Weeks',
    instructor: 'Elena Rostova',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80',
    status: 'published',
    modules: [
      {
        title: 'Module 1: Vector Embeddings & RAG Architecture',
        description: 'Transform enterprise documents into embeddings and perform semantic similarity searches.',
        lessons: [
          {
            title: '1.1 Document Chunking and Vector Databases',
            description: 'Learn text chunking strategies, cosine similarity, and vector indexing.',
            content: `Retrieval-Augmented Generation grounds LLM answers with real data.
Topics:
- Semantic chunking vs recursive character splitting
- Vector indexing with Pinecone and Chroma
- Hybrid search combining keyword (BM25) and dense embeddings`,
          },
        ],
      },
      {
        title: 'Module 2: Autonomous Agentic Workflows & Tool Use',
        description: 'Construct multi-step AI agents that execute tools, invoke APIs, and verify reasoning.',
        lessons: [
          {
            title: '2.1 Function Calling and ReAct Prompting',
            description: 'Equip models with custom tools for web browsing, calculations, and database queries.',
            content: `Learn the ReAct (Reason + Act) prompting framework.
Topics:
- Structured function calling schemas
- Agent state graphs and loop control
- Guardrails and response hallucination checks`,
          },
        ],
      },
    ],
  },

  // ─── 3. CLOUD COMPUTING & DEVOPS ──────────────────────────────────────────
  {
    title: 'Cloud Native DevOps: Docker, Kubernetes & AWS',
    description: 'Deploy, scale, and automate cloud infrastructure using Docker containerization, Kubernetes orchestration, and GitHub Actions CI/CD.',
    category: 'Cloud & DevOps',
    difficulty: 'Intermediate',
    duration: '7 Weeks',
    instructor: 'David Kim',
    thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=800&q=80',
    status: 'published',
    modules: [
      {
        title: 'Module 1: Containerization with Docker & Multi-Stage Builds',
        description: 'Containerize microservices, manage multi-container networks with Docker Compose, and minimize image sizes.',
        lessons: [
          {
            title: '1.1 Dockerfile Optimization and Multi-Stage Builds',
            description: 'Create lightweight, secure production images using alpine bases.',
            content: `Docker guarantees identical runtime environments across dev, staging, and production.
Topics:
- Layer caching and order of execution
- Multi-stage builds to strip build dependencies
- Managing persistent volumes and bridge networks`,
          },
        ],
      },
      {
        title: 'Module 2: Kubernetes Orchestration & Continuous Delivery',
        description: 'Deploy Pods, Services, Ingress controllers, and automated Helm chart pipelines.',
        lessons: [
          {
            title: '2.1 Deployments, ReplicaSets, and Rolling Updates',
            description: 'Achieve zero-downtime deployments with health checks and rolling update strategies.',
            content: `Kubernetes orchestrates container clusters across distributed nodes.
Topics:
- Pod specifications and ReplicaSets
- Liveness and readiness probes
- Cluster Autoscaling and Horizontal Pod Autoscalers (HPA)`,
          },
        ],
      },
    ],
  },

  // ─── 4. CYBERSECURITY ─────────────────────────────────────────────────────
  {
    title: 'Hands-On Ethical Hacking & Network Defense',
    description: 'Learn offensive penetration testing, web application vulnerabilities (OWASP Top 10), and proactive defense mechanisms.',
    category: 'Cybersecurity',
    difficulty: 'Beginner',
    duration: '6 Weeks',
    instructor: 'Rachel Adams',
    thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
    status: 'published',
    modules: [
      {
        title: 'Module 1: Network Reconnaissance & Port Scanning',
        description: 'Understand TCP/IP 3-way handshakes, Wireshark packet analysis, and Nmap vulnerability scanning.',
        lessons: [
          {
            title: '1.1 Network Scanning with Nmap and Wireshark',
            description: 'Identify open services, operating systems, and network anomalies legally.',
            content: `Reconnaissance is the initial phase of ethical penetration testing.
Topics:
- SYN scan, UDP scan, and OS detection with Nmap
- Packet capture inspection with Wireshark filters
- Ethical guidelines and scoped engagement rules`,
          },
        ],
      },
      {
        title: 'Module 2: Web Application Security & OWASP Top 10',
        description: 'Identify and patch SQL Injection, Cross-Site Scripting (XSS), and Broken Access Control.',
        lessons: [
          {
            title: '2.1 Defending Against SQL Injection & XSS Attacks',
            description: 'Use parameterized queries, input sanitization, and Content Security Policy (CSP).',
            content: `Deep dive into common web application vulnerabilities.
Topics:
- SQL injection mechanisms and parameterized statements
- Stored vs Reflected vs DOM-based XSS
- Secure cookie flags: HttpOnly, Secure, SameSite`,
          },
        ],
      },
    ],
  },

  // ─── 5. MOBILE APP DEVELOPMENT ────────────────────────────────────────────
  {
    title: 'Cross-Platform Mobile Apps with Flutter & Dart',
    description: 'Create native-compiled iOS and Android apps with beautiful fluid animations, local storage, and cloud backend integration.',
    category: 'Mobile Development',
    difficulty: 'Beginner',
    duration: '6 Weeks',
    instructor: 'Carlos Mendez',
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
    status: 'published',
    modules: [
      {
        title: 'Module 1: Dart Programming & Widget Tree Architecture',
        description: 'Master Dart object-oriented features, Stateless vs Stateful widgets, and layout composition.',
        lessons: [
          {
            title: '1.1 Building Fluid Responsive Flutter UIs',
            description: 'Use Rows, Columns, Stacks, and responsive constraints to craft intuitive mobile layouts.',
            content: `In Flutter, 'Everything is a Widget'.
Topics:
- The Widget Tree, Element Tree, and RenderObject Tree
- Managing local state with setState
- Material Design 3 theme configuration`,
          },
        ],
      },
      {
        title: 'Module 2: State Management & Cloud Integration',
        description: 'Manage app-wide state with Riverpod or Bloc and connect REST APIs with offline caching.',
        lessons: [
          {
            title: '2.1 State Management with Riverpod and HTTP Requests',
            description: 'Separate business logic from presentation and cache data with Hive or SQLite.',
            content: `Scalable state management patterns for production mobile applications.
Topics:
- StateNotifier and AsyncValue handling
- Offline-first caching with local databases
- Native platform permissions and notifications`,
          },
        ],
      },
    ],
  },

  // ─── 6. SOFTWARE ENGINEERING / COMPUTER SCIENCE ───────────────────────────
  {
    title: 'Data Structures & Algorithms in Java for Interviews',
    description: 'Master Big O analysis, linked lists, trees, graphs, sorting, and dynamic programming for technical interview mastery.',
    category: 'Software Engineering',
    difficulty: 'Advanced',
    duration: '10 Weeks',
    instructor: 'Elena Rostova',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    status: 'published',
    modules: [
      {
        title: 'Module 1: Big O Complexity & Graph Algorithms',
        description: 'Analyze time/space asymptotic bounds and implement Dijkstra and Topological Sort.',
        lessons: [
          {
            title: '1.1 Graph Traversals: BFS, DFS & Shortest Path',
            description: 'Adjacency list representation and shortest path implementations in Java.',
            content: `Graph algorithms form the backbone of routing and dependency resolution systems.
Topics:
- Breadth-First Search (BFS) and queue management
- Depth-First Search (DFS) with recursion
- Dijkstra's single-source shortest path algorithm`,
          },
        ],
      },
    ],
  },

  // ─── 7. DRAFT / UNPUBLISHED COURSE (For Acceptance Testing) ───────────────
  {
    title: 'Quantum Computing Foundations & Qiskit (Draft Preview)',
    description: 'Upcoming exploration into qubits, superposition, quantum entanglement, and quantum circuit simulation.',
    category: 'Computer Science',
    difficulty: 'Advanced',
    duration: '4 Weeks',
    instructor: 'Dr. Marcus Vance',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
    status: 'draft', // Strictly unpublished course
    modules: [
      {
        title: 'Module 1: Qubits & Quantum Superposition (Under Construction)',
        description: 'Draft syllabus for quantum state representations on the Bloch Sphere.',
        lessons: [
          {
            title: '1.1 Introduction to Quantum Bits',
            description: 'Mathematical formulation of quantum states in Hilbert space.',
            content: 'Draft content undergoing curriculum peer review.',
          },
        ],
      },
    ],
  },
];

async function seedMultiFieldCourses() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online-learning');
    console.log('Connected to MongoDB for multi-field course seeding...');

    // Find default instructor / admin to associate instructorId
    let instructor = await User.findOne({ role: 'instructor' });
    if (!instructor) {
      instructor = await User.findOne({ role: 'admin' });
    }

    const instructorId = instructor ? instructor._id : null;
    console.log(`Using instructor: ${instructor?.name || 'Default Instructor'} (${instructorId})`);

    // Clean existing courses to ensure fresh, clean, rich catalog
    await Course.deleteMany({});
    await Module.deleteMany({});
    await Lesson.deleteMany({});

    console.log('Cleared existing courses, modules, and lessons.');

    let totalCoursesCreated = 0;
    let totalModulesCreated = 0;
    let totalLessonsCreated = 0;

    for (const cData of coursesData) {
      const course = await Course.create({
        title: cData.title,
        description: cData.description,
        category: cData.category,
        difficulty: cData.difficulty,
        duration: cData.duration,
        instructor: cData.instructor,
        instructorId: instructorId,
        thumbnail: cData.thumbnail,
        status: cData.status,
      });
      totalCoursesCreated++;

      let modOrder = 1;
      for (const mData of cData.modules) {
        const moduleDoc = await Module.create({
          courseId: course._id,
          title: mData.title,
          description: mData.description,
          order: modOrder++,
        });
        totalModulesCreated++;

        let lesOrder = 1;
        for (const lData of mData.lessons) {
          await Lesson.create({
            moduleId: moduleDoc._id,
            courseId: course._id,
            title: lData.title,
            description: lData.description,
            content: lData.content,
            order: lesOrder++,
          });
          totalLessonsCreated++;
        }
      }
    }

    console.log(`\n Successfully seeded:`);
    console.log(`- ${totalCoursesCreated} Courses (across Web Dev, AI, Cloud, Cybersecurity, Mobile, Software Eng)`);
    console.log(`- ${totalModulesCreated} Structured Modules`);
    console.log(`- ${totalLessonsCreated} Complete Lessons`);
    console.log(`- Included 1 Draft course to test unpublished visibility isolation.\n`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding multi-field courses:', error);
    process.exit(1);
  }
}

seedMultiFieldCourses();
