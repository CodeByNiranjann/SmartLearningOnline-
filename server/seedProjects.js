import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from './models/Course.js';
import User from './models/User.js';
import Project from './models/Project.js';

dotenv.config();

export const seedProjects = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online-learning';
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri);
    }
    console.log('Connected to MongoDB for project seeding...');

    // Fetch existing instructor or admin
    let instructor = await User.findOne({ role: 'instructor' });
    if (!instructor) {
      instructor = await User.findOne({ role: 'admin' });
    }

    // Fetch courses to link
    const courses = await Course.find({});
    const courseMap = {};
    courses.forEach((c) => {
      courseMap[c.category] = c;
      courseMap[c.title] = c;
    });

    const webCourse = courseMap['Web Development'] || courses[0];
    const aiCourse = courseMap['Data Science & AI'] || courses[1] || courses[0];
    const devopsCourse = courseMap['Cloud & DevOps'] || courses[2] || courses[0];
    const securityCourse = courseMap['Cybersecurity'] || courses[3] || courses[0];
    const mobileCourse = courseMap['Mobile Development'] || courses[4] || courses[0];

    const projectData = [
      {
        title: 'Full-Stack E-Commerce Platform with Live Checkout & Inventory',
        slug: 'fullstack-ecommerce-platform',
        description:
          'Design and build a scalable full-stack e-commerce marketplace featuring product discovery, shopping cart persistence, secure payment processing, and an admin inventory management dashboard.',
        fullDescription: `### Industry Scenario
You have been hired as a Lead Full-Stack Engineer by a growing retail brand to overhaul their digital storefront. The objective is to replace an outdated legacy system with a high-performance, responsive web application that provides seamless customer onboarding, robust catalog navigation, dynamic cart calculations, and automated order fulfillment tracking.

### Core Problem Statement
Customers frequently abandon carts due to clunky checkout workflows and latency. The business requires:
1. Sub-second product catalog queries with faceted filtering (category, price range, stock status, ratings).
2. Bulletproof cart synchronization across devices.
3. Resilient payment transaction handling with idempotency and order confirmations.
4. An administrative backoffice for stock updates and sales analytics.`,
        courseId: webCourse?._id,
        instructorId: instructor?._id,
        category: 'Web Development',
        difficulty: 'Intermediate',
        estimatedHours: 20,
        thumbnail: 'https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=800&q=80',
        technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'JWT', 'Stripe API', 'Tailwind CSS'],
        learningObjectives: [
          'Architect full-stack RESTful APIs adhering to clean controller-service-model separation.',
          'Implement secure client authentication, session tokens, and route guards.',
          'Model relational data relationships and aggregation pipelines in MongoDB.',
          'Integrate third-party payment gateways with webhook verifications and transactional rollback.',
          'Deploy client and server applications with CI/CD automation.',
        ],
        deliverables: [
          'Responsive Storefront: Home banner, product grid with live search, pagination, and sorting.',
          'Product Details View: Image gallery, stock indicators, real-time reviews, and related items.',
          'Shopping Cart & Checkout: Local/session synchronization, promo code calculations, shipping forms, and order summary.',
          'Payment Integration: Secure mock/sandbox payment submission with invoice generation.',
          'Admin Portal: CRUD interface for products, inventory re-stocking, and order status updates.',
        ],
        prerequisites: [
          'Basic proficiency in modern JavaScript (ES6+)',
          'Understanding of React hooks (useState, useEffect, useContext)',
          'Foundational knowledge of Express route handlers and MongoDB queries',
        ],
        starterResources: [
          {
            title: 'GitHub Starter Template & Boilerplate',
            url: 'https://github.com/learnhub-projects/ecommerce-starter-template',
            type: 'github_starter',
          },
          {
            title: 'Figma UI/UX Design System & Mobile Wireframes',
            url: 'https://www.figma.com/community/file/ecommerce-modern-design-kit',
            type: 'figma_design',
          },
          {
            title: 'OpenAPI / Swagger Schema for Product & Order Endpoints',
            url: 'https://api-spec.learnhub.test/v1/ecommerce-openapi.json',
            type: 'api_spec',
          },
        ],
        rubric: [
          {
            criteria: 'Core Functionality & Checkout Flow',
            maxPoints: 35,
            description: 'All user journeys (browse, add to cart, checkout, order placement) function without crashes or state inconsistencies.',
          },
          {
            criteria: 'Code Architecture & State Management',
            maxPoints: 30,
            description: 'Modular file structure, reusable component hierarchy, clean error handling middleware, and clean async operations.',
          },
          {
            criteria: 'UI/UX Polish & Mobile Responsiveness',
            maxPoints: 20,
            description: 'Attractive responsive styling, touch-friendly touch targets, accessible contrasts, and smooth loading states.',
          },
          {
            criteria: 'README Documentation & Test Suite',
            maxPoints: 15,
            description: 'Comprehensive setup instructions, environment variables documentation, architecture diagrams, and unit/integration tests.',
          },
        ],
        totalPoints: 100,
        status: 'published',
      },
      {
        title: 'Real-Time Collaborative Workspace & Team Chat Application',
        slug: 'realtime-team-chat-workspace',
        description:
          'Construct an enterprise-grade collaborative communication platform featuring real-time room messaging, typing indicators, active presence tracking, direct messaging, and message thread history.',
        fullDescription: `### Industry Scenario
Modern remote organizations rely on high-reliability, low-latency collaboration hubs (analogous to Slack or Discord). As a senior software engineer, you will architect a real-time messaging workspace capable of supporting concurrent group channels and private threads with instant message broadcasting.

### Technical Challenges to Solve
- Bi-directional event synchronization over WebSockets with automatic reconnection.
- Ephemeral state management (who is currently online or typing).
- Persistent audit trail of chat history with infinite scroll pagination.
- Role-based permissions within workspace channels.`,
        courseId: webCourse?._id,
        instructorId: instructor?._id,
        category: 'Web Development',
        difficulty: 'Advanced',
        estimatedHours: 24,
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        technologies: ['React', 'Socket.io', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS'],
        learningObjectives: [
          'Design WebSocket event protocols for bidirectional real-time communications.',
          'Manage distributed room state, channel subscriptions, and broadcast scopes.',
          'Optimize database queries for fast pagination of timestamped chat logs.',
          'Handle network jitter, disconnects, and message queue retry logic.',
        ],
        deliverables: [
          'Workspace Sidebar: Channel list, direct messages list, user presence badge (Online/Away/Offline).',
          'Live Chat Window: Instant message dispatch, markdown preview, code block formatting, and emoji reactions.',
          'Typing Indicators: Debounced broadcast showing active typers in the channel.',
          'Channel Management: Create public or private channels with member invitations.',
          'Search & History: Full-text search over previous messages in active channels.',
        ],
        prerequisites: [
          'Intermediate React state management (Context API or Zustand)',
          'Understanding of HTTP vs WebSocket protocols',
          'Basic Node.js event emitter concepts',
        ],
        starterResources: [
          {
            title: 'Socket.io Client/Server Starter Repo',
            url: 'https://github.com/learnhub-projects/socket-chat-starter',
            type: 'github_starter',
          },
          {
            title: 'WebSocket Protocol & Event Payload Specification',
            url: 'https://docs.learnhub.test/specs/realtime-protocol',
            type: 'documentation',
          },
        ],
        rubric: [
          {
            criteria: 'Real-Time Event Reliability',
            maxPoints: 40,
            description: 'Zero message loss under multiple concurrent client connections, instantaneous typing indicators, and reliable reconnects.',
          },
          {
            criteria: 'Data Persistence & Query Efficiency',
            maxPoints: 25,
            description: 'Efficient MongoDB indexing on channelId + timestamp, smooth infinite pagination without duplicates.',
          },
          {
            criteria: 'Security & Access Control',
            maxPoints: 20,
            description: 'Socket authentication middleware verifying JWT tokens before room connection, channel privacy enforcement.',
          },
          {
            criteria: 'Code Modularity & Documentation',
            maxPoints: 15,
            description: 'Clean separation of socket controllers and HTTP routes, clear deployment notes.',
          },
        ],
        totalPoints: 100,
        status: 'published',
      },
      {
        title: 'Production-Grade Cloud-Native Microservice & Dockerized CI/CD Pipeline',
        slug: 'cloud-native-microservice-docker-cicd',
        description:
          'Containerize a multi-tier microservice architecture using Docker, orchestrate multi-container services with Docker Compose, implement healthchecks, Redis caching, and configure an automated GitHub Actions CI/CD pipeline.',
        fullDescription: `### Industry Scenario
Cloud engineering teams are tasked with modernizing monolithic codebases into scalable, containerized microservices. In this real-world project, you will build and containerize a high-throughput API service, integrate automated container healthchecks, implement Redis caching to protect the database layer, and deploy automated test workflows in GitHub Actions.

### Key Milestones
1. Multi-stage Dockerfile builds minimizing image footprint and stripping build artifacts.
2. Production Docker Compose topology connecting API, Database, and Cache networks.
3. Automated linting, unit testing, and Docker image security vulnerability scanning in CI.`,
        courseId: devopsCourse?._id,
        instructorId: instructor?._id,
        category: 'Cloud & DevOps',
        difficulty: 'Intermediate',
        estimatedHours: 15,
        thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=800&q=80',
        technologies: ['Docker', 'Docker Compose', 'GitHub Actions', 'Node.js', 'Redis', 'Nginx'],
        learningObjectives: [
          'Write hardened multi-stage Dockerfiles utilizing Alpine or distroless base images.',
          'Define multi-service networking and data volume persistence in Docker Compose.',
          'Incorporate Redis in-memory caching to achieve 90%+ query latency reduction.',
          'Construct automated GitHub Actions workflows with test matrices and artifact caching.',
        ],
        deliverables: [
          'Multi-stage Dockerfile: Optimized production build (<150MB) with non-root security user.',
          'Docker Compose Suite: Orchestrating API, MongoDB, Redis, and an Nginx reverse proxy.',
          'Redis Cache Layer: Implemented Cache-Aside pattern for high-traffic read endpoints.',
          'CI/CD Pipeline: GitHub Actions workflow running tests, building images, and verifying lint standards.',
          'Ops Runbook: Complete deployment documentation with rollback procedures.',
        ],
        prerequisites: [
          'Basic command line and Linux shell familiarity',
          'Understanding of container virtualization concepts',
        ],
        starterResources: [
          {
            title: 'Docker & Microservices Starter Repo',
            url: 'https://github.com/learnhub-projects/cloud-devops-starter',
            type: 'github_starter',
          },
          {
            title: 'Production Dockerfile Best Practices Guide',
            url: 'https://docs.learnhub.test/guides/dockerfile-hardening',
            type: 'documentation',
          },
        ],
        rubric: [
          {
            criteria: 'Dockerfile & Image Optimization',
            maxPoints: 30,
            description: 'Multi-stage builds, non-root execution, minimal image size, and proper caching of package layers.',
          },
          {
            criteria: 'Docker Compose Topology & Caching',
            maxPoints: 30,
            description: 'Healthy container communication, persistent volumes, and demonstrable Redis cache hit improvement.',
          },
          {
            criteria: 'CI/CD Automation Pipeline',
            maxPoints: 25,
            description: 'Clean YAML syntax, automated test gatekeeping on pull request, and secure secret references.',
          },
          {
            criteria: 'Operational Documentation',
            maxPoints: 15,
            description: 'Clear troubleshooting steps, environment configurations, and setup verification script.',
          },
        ],
        totalPoints: 100,
        status: 'published',
      },
      {
        title: 'AI Prompt Engineering Studio & Intelligent Content Copilot',
        slug: 'ai-prompt-studio-copilot',
        description:
          'Build an AI-powered productivity application that allows users to craft, benchmark, and execute dynamic prompt workflows, stream generative text responses in real-time, and store tagged prompt templates.',
        fullDescription: `### Industry Scenario
AI-driven applications require thoughtful orchestration of large language models, dynamic context injection, streaming user interfaces, and cost monitoring. In this capstone project, you will build an interactive Prompt Engineering Studio and intelligent writing assistant.

### Capabilities to Deliver
- Real-time token streaming interface with markdown formatting and syntax highlighting.
- Template system with variable interpolation (e.g., {{tone}}, {{audience}}, {{language}}).
- Token usage and latency estimation tracking.
- Local or cloud export for prompt execution results.`,
        courseId: aiCourse?._id,
        instructorId: instructor?._id,
        category: 'Data Science & AI',
        difficulty: 'Advanced',
        estimatedHours: 18,
        thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
        technologies: ['React', 'Node.js', 'OpenAI API / Mock Stream', 'Tailwind CSS', 'Vite'],
        learningObjectives: [
          'Consume Server-Sent Events (SSE) and HTTP streaming in client applications.',
          'Implement client-side markdown parsing and sanitized syntax highlighting.',
          'Design parametric prompt template engines with client validation.',
          'Model conversation history and context window management.',
        ],
        deliverables: [
          'Interactive Prompt Editor: Syntax highlighting, dynamic variable chips, and parameter controls (temperature, top-p).',
          'Streaming Output Console: Real-time chunk rendering with typewriter effect and stop-generation button.',
          'Template Library: Save, edit, tag, and search favorite prompt templates.',
          'History & Export: Download responses in Markdown, JSON, or copy formatted text with 1 click.',
        ],
        prerequisites: [
          'Solid React and component lifecycle knowledge',
          'Familiarity with REST APIs and streaming data concepts',
        ],
        starterResources: [
          {
            title: 'AI Prompt Studio Starter Template',
            url: 'https://github.com/learnhub-projects/ai-copilot-starter',
            type: 'github_starter',
          },
          {
            title: 'Prompt Engineering Guidelines & Evaluation Benchmark',
            url: 'https://docs.learnhub.test/ai/prompt-engineering-best-practices',
            type: 'documentation',
          },
        ],
        rubric: [
          {
            criteria: 'Streaming UX & Performance',
            maxPoints: 35,
            description: 'Smooth real-time token rendering without UI stutter, responsive cancellation, and auto-scrolling.',
          },
          {
            criteria: 'Prompt Template Variable Engine',
            maxPoints: 30,
            description: 'Flawless variable extraction, parameter validation, and template persistence.',
          },
          {
            criteria: 'UI/UX Visual Craftsmanship',
            maxPoints: 20,
            description: 'Modern sleek dark/light mode aesthetic, clean typography, and intuitive control layout.',
          },
          {
            criteria: 'Code Architecture & Tests',
            maxPoints: 15,
            description: 'Clean hook abstractions for streaming, test coverage for prompt interpolation, and documented APIs.',
          },
        ],
        totalPoints: 100,
        status: 'published',
      },
      {
        title: 'Interactive Vulnerability Scanner & Security Audit Dashboard',
        slug: 'vulnerability-scanner-security-dashboard',
        description:
          'Construct a defensive cybersecurity dashboard that scans target endpoints for common vulnerabilities (missing security headers, outdated SSL ciphers, open ports, and CORS misconfigurations).',
        fullDescription: `### Industry Scenario
Security operations centers (SOC) require automated diagnostic tools to evaluate the perimeter security posture of web services. In this hands-on project, you will build an automated security audit dashboard that inspects HTTP headers, evaluates SSL/TLS certificate chains, and generates actionable remediation reports.

### Security Checks Included
- Strict-Transport-Security (HSTS), Content-Security-Policy (CSP), and X-Frame-Options headers.
- Permissive CORS access-control-allow-origin wildcard exposure.
- Server fingerprinting and technology banner disclosure risks.`,
        courseId: securityCourse?._id,
        instructorId: instructor?._id,
        category: 'Cybersecurity',
        difficulty: 'Beginner',
        estimatedHours: 12,
        thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
        technologies: ['Node.js', 'React', 'Express', 'Axios', 'Tailwind CSS', 'Cheerio'],
        learningObjectives: [
          'Understand OWASP Top 10 security misconfigurations and browser defense headers.',
          'Analyze HTTP response headers and security directives programmatically.',
          'Generate executive-ready security scorecards and remediation instructions.',
          'Implement rate-limiting and domain authorization guards on scanning tools.',
        ],
        deliverables: [
          'Target Input Form: Domain/URL entry with protocol validation and disclaimer acknowledgment.',
          'Security Scorecard: Overall letter grade (A+ through F) based on standardized security weighting.',
          'Detailed Findings Breakdown: Grouped by High, Medium, Low severity with clear explanation of risks.',
          'Remediation Playbook: Copy-pasteable server config snippets (Nginx, Express, Apache) to remediate findings.',
          'Exportable PDF/JSON Audit Report: Summary for engineering stakeholders.',
        ],
        prerequisites: [
          'Basic understanding of HTTP request/response lifecycles and web protocols',
        ],
        starterResources: [
          {
            title: 'Security Scanner Boilerplate',
            url: 'https://github.com/learnhub-projects/security-scanner-starter',
            type: 'github_starter',
          },
          {
            title: 'OWASP Secure Headers Best Practices Guide',
            url: 'https://owasp.org/www-project-secure-headers/',
            type: 'documentation',
          },
        ],
        rubric: [
          {
            criteria: 'Accuracy of Header & Vulnerability Analysis',
            maxPoints: 40,
            description: 'Correctly inspects standard security headers, identifies weaknesses, and calculates weighted score.',
          },
          {
            criteria: 'Remediation Quality & Guidance',
            maxPoints: 30,
            description: 'Provides exact configuration instructions and practical code snippets for fixing vulnerabilities.',
          },
          {
            criteria: 'User Interface & Reporting Clarity',
            maxPoints: 20,
            description: 'Clear visual badges, severity coloring, and intuitive report navigation.',
          },
          {
            criteria: 'Code Cleanliness & Error Handling',
            maxPoints: 10,
            description: 'Handles unreachable hosts, timeouts, and redirects gracefully without server errors.',
          },
        ],
        totalPoints: 100,
        status: 'published',
      },
      {
        title: 'Cross-Platform Fitness Tracker & Workout Companion App',
        slug: 'fitness-tracker-mobile-app',
        description:
          'Develop a high-performance cross-platform mobile application featuring workout logging, interactive exercise routines, offline data synchronization, and visual progress charts.',
        fullDescription: `### Industry Scenario
Fitness technology companies demand engaging, offline-first mobile applications that keep users motivated and seamlessly record workout metrics. You will build a mobile fitness companion app with routine planning, calorie tracking, and intuitive weekly progress dashboards.`,
        courseId: mobileCourse?._id,
        instructorId: instructor?._id,
        category: 'Mobile Development',
        difficulty: 'Beginner',
        estimatedHours: 16,
        thumbnail: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
        technologies: ['Flutter', 'Dart', 'SQLite', 'REST API', 'Provider / Riverpod'],
        learningObjectives: [
          'Build responsive cross-platform mobile layouts adaptable to iOS and Android.',
          'Implement local SQLite / Hive storage for full offline workout logging.',
          'Design intuitive user experience for timer-based exercise routines.',
        ],
        deliverables: [
          'Workout Dashboard: Daily streak tracker, calories burned indicator, and quick-start routine button.',
          'Exercise Library: Categorized list of exercises with demonstration guides.',
          'Active Workout Session: Rest timer, rep/weight logger, and completion modal.',
          'Analytics & History: Visual bar and line charts displaying weekly volume and personal records.',
        ],
        prerequisites: [
          'Basic familiarity with Dart language and object-oriented programming',
        ],
        starterResources: [
          {
            title: 'Mobile Fitness Tracker Starter Repo',
            url: 'https://github.com/learnhub-projects/flutter-fitness-starter',
            type: 'github_starter',
          },
        ],
        rubric: [
          {
            criteria: 'Core Workout & Timer Mechanics',
            maxPoints: 40,
            description: 'Smooth timer functionality, set/rep counter, and data persistence without loss.',
          },
          {
            criteria: 'Offline Synchronization & Local Storage',
            maxPoints: 30,
            description: 'Local caching works seamlessly when network connectivity is lost.',
          },
          {
            criteria: 'Mobile UI/UX & Navigation',
            maxPoints: 20,
            description: 'Native-feeling transitions, accessible touch targets, and polished aesthetic.',
          },
          {
            criteria: 'Project Organization & Documentation',
            maxPoints: 10,
            description: 'Clean widget hierarchy, state management structure, and setup notes.',
          },
        ],
        totalPoints: 100,
        status: 'published',
      },
    ];

    let seededCount = 0;
    for (const p of projectData) {
      await Project.findOneAndUpdate(
        { title: p.title },
        p,
        { upsert: true, new: true }
      );
      seededCount++;
    }

    console.log(`✅ Successfully seeded/updated ${seededCount} real-world projects!`);
    return seededCount;
  } catch (error) {
    console.error('❌ Error seeding projects:', error);
    throw error;
  }
};

// If run directly via node seedProjects.js
if (process.argv[1]?.includes('seedProjects.js')) {
  seedProjects()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
