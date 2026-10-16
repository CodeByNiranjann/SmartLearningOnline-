import mongoose from 'mongoose';
import dotenv from 'dotenv';
import InternshipProject from './models/InternshipProject.js';

dotenv.config();

const projects = [
  {
    title: 'E-Commerce Product Recommendation Engine',
    description:
      'Build a full-stack recommendation engine that suggests products based on user browsing history, purchase patterns, and collaborative filtering algorithms.',
    detailedOverview:
      'Design and implement a production-ready recommendation system using React for the frontend and Node.js/Express for the backend. Integrate with MongoDB to store user behavior data and implement collaborative filtering and content-based recommendation algorithms. Deploy the system and measure recommendation accuracy.',
    category: 'Web Development',
    difficulty: 'Intermediate',
    estimatedDuration: '4 Weeks',
    skills: ['React', 'Node.js', 'MongoDB', 'REST API', 'Algorithms', 'JavaScript'],
    tools: ['VS Code', 'Postman', 'MongoDB Atlas', 'Git', 'Vercel'],
    learningOutcomes: [
      'Build scalable REST APIs with Express.js',
      'Implement collaborative filtering algorithms',
      'Design responsive React UI components',
      'Work with MongoDB aggregation pipelines',
      'Deploy full-stack applications to production',
    ],
    milestones: [
      { title: 'Project Setup & Database Schema', description: 'Initialize the project, set up MongoDB models for users, products, and interactions.', order: 0 },
      { title: 'Backend API Development', description: 'Build REST endpoints for product CRUD, user activity tracking, and recommendation generation.', order: 1 },
      { title: 'Recommendation Algorithm', description: 'Implement collaborative filtering logic and content-based scoring.', order: 2 },
      { title: 'Frontend Dashboard', description: 'Create the React UI with product cards, recommendation carousel, and user profile.', order: 3 },
      { title: 'Testing & Deployment', description: 'Write integration tests, optimize performance, and deploy to production.', order: 4 },
    ],
    industry: 'E-Commerce',
    companyType: 'Startup',
    thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    popularity: 87,
  },
  {
    title: 'Real-Time Chat Application with WebSockets',
    description:
      'Develop a real-time messaging platform with private chats, group channels, typing indicators, read receipts, and file sharing capabilities.',
    detailedOverview:
      'Create a Slack-inspired communication tool using Socket.IO for real-time bidirectional messaging. Implement authentication, channel management, message persistence, and push notifications. This project simulates what you would build at a mid-size SaaS company.',
    category: 'Web Development',
    difficulty: 'Intermediate',
    estimatedDuration: '3 Weeks',
    skills: ['React', 'Node.js', 'Socket.IO', 'MongoDB', 'Authentication', 'JavaScript'],
    tools: ['VS Code', 'Socket.IO', 'MongoDB', 'JWT', 'Cloudinary'],
    learningOutcomes: [
      'Implement WebSocket-based real-time communication',
      'Build authentication and authorization systems',
      'Handle file uploads and media processing',
      'Design real-time UI updates with optimistic rendering',
      'Manage complex application state',
    ],
    milestones: [
      { title: 'Auth System & User Management', description: 'Set up JWT-based authentication, user registration, and profile management.', order: 0 },
      { title: 'Socket.IO Integration', description: 'Establish WebSocket connections, implement message broadcasting and rooms.', order: 1 },
      { title: 'Chat Features', description: 'Build private messaging, group channels, typing indicators, and read receipts.', order: 2 },
      { title: 'File Sharing & Media', description: 'Add image/file upload support with Cloudinary integration.', order: 3 },
      { title: 'Polish & Deploy', description: 'Add notification sounds, mobile responsiveness, and deploy to cloud.', order: 4 },
    ],
    industry: 'Technology',
    companyType: 'Mid-size',
    thumbnail: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    popularity: 95,
  },
  {
    title: 'Personal Finance Dashboard & Budget Tracker',
    description:
      'Create an interactive financial dashboard that tracks income/expenses, visualizes spending patterns with charts, and provides budget alerts.',
    detailedOverview:
      'Build a comprehensive personal finance tool with data visualization, categorized transaction management, and predictive spending insights. Use Chart.js or Recharts for rich visual analytics. This mirrors fintech internship projects.',
    category: 'Web Development',
    difficulty: 'Beginner',
    estimatedDuration: '2 Weeks',
    skills: ['React', 'CSS', 'Chart.js', 'Node.js', 'REST API', 'JavaScript'],
    tools: ['VS Code', 'Chart.js', 'MongoDB', 'Figma', 'Git'],
    learningOutcomes: [
      'Build data visualization dashboards',
      'Implement CRUD operations for financial data',
      'Design intuitive data entry forms',
      'Create responsive chart components',
      'Apply UX best practices for financial interfaces',
    ],
    milestones: [
      { title: 'UI Wireframes & Setup', description: 'Design the dashboard layout, set up the React project with routing.', order: 0 },
      { title: 'Transaction Management', description: 'Build add/edit/delete transaction flow with category tagging.', order: 1 },
      { title: 'Charts & Visualization', description: 'Integrate Chart.js for spending breakdowns, trends, and comparisons.', order: 2 },
      { title: 'Budget Alerts & Reports', description: 'Add budget limits, threshold alerts, and monthly summary exports.', order: 3 },
    ],
    industry: 'FinTech',
    companyType: 'Startup',
    thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    popularity: 72,
  },
  {
    title: 'AI-Powered Content Management System',
    description:
      'Build a CMS with AI-assisted content generation, auto-tagging, SEO analysis, and a rich text editor with collaborative editing features.',
    detailedOverview:
      'Develop an enterprise-grade content management system that leverages AI APIs for content suggestions, automated metadata generation, and SEO scoring. Implement role-based access control and a WYSIWYG editor.',
    category: 'Web Development',
    difficulty: 'Advanced',
    estimatedDuration: '5 Weeks',
    skills: ['React', 'Node.js', 'AI/ML APIs', 'MongoDB', 'Rich Text Editor', 'TypeScript'],
    tools: ['VS Code', 'OpenAI API', 'TipTap Editor', 'MongoDB', 'Docker'],
    learningOutcomes: [
      'Integrate third-party AI APIs into web applications',
      'Build rich text editing experiences',
      'Implement role-based access control systems',
      'Design content workflow and publishing pipelines',
      'Apply SEO best practices programmatically',
    ],
    milestones: [
      { title: 'CMS Architecture & Auth', description: 'Design the system architecture, implement RBAC with JWT.', order: 0 },
      { title: 'Content Editor Integration', description: 'Set up TipTap rich text editor with custom extensions.', order: 1 },
      { title: 'AI Feature Integration', description: 'Connect OpenAI API for content generation, summarization, and tagging.', order: 2 },
      { title: 'SEO Analysis Module', description: 'Build automated SEO scoring with keyword analysis and meta tag suggestions.', order: 3 },
      { title: 'Publishing Workflow', description: 'Implement draft/review/publish pipeline with email notifications.', order: 4 },
      { title: 'Deployment & Documentation', description: 'Containerize with Docker, deploy, and write API documentation.', order: 5 },
    ],
    industry: 'Media & Publishing',
    companyType: 'Enterprise',
    thumbnail: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    popularity: 64,
  },
  {
    title: 'Task Management API with Microservices',
    description:
      'Design and build a microservices-based task management backend with separate services for users, tasks, notifications, and analytics.',
    detailedOverview:
      'Learn microservice architecture by building a Jira-like task management system. Implement service-to-service communication, API gateway patterns, event-driven updates, and centralized logging. This project is ideal for backend-focused internships.',
    category: 'Backend Development',
    difficulty: 'Advanced',
    estimatedDuration: '5 Weeks',
    skills: ['Node.js', 'Express', 'Docker', 'RabbitMQ', 'MongoDB', 'Microservices'],
    tools: ['VS Code', 'Docker', 'RabbitMQ', 'Postman', 'MongoDB Atlas'],
    learningOutcomes: [
      'Design microservice architectures',
      'Implement message queues for async communication',
      'Build API gateway and service discovery patterns',
      'Containerize services with Docker Compose',
      'Implement distributed logging and monitoring',
    ],
    milestones: [
      { title: 'Architecture Design', description: 'Plan service boundaries, define API contracts, and set up Docker Compose.', order: 0 },
      { title: 'User Service', description: 'Build authentication, user profiles, and team management.', order: 1 },
      { title: 'Task Service', description: 'Implement task CRUD, status workflows, and assignment logic.', order: 2 },
      { title: 'Notification Service', description: 'Create event-driven notifications with RabbitMQ consumers.', order: 3 },
      { title: 'API Gateway & Integration', description: 'Build the gateway, integrate all services, add logging.', order: 4 },
    ],
    industry: 'Technology',
    companyType: 'Enterprise',
    thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    popularity: 58,
  },
  {
    title: 'Weather Dashboard with API Integration',
    description:
      'Build a responsive weather dashboard that displays current conditions, 7-day forecasts, interactive maps, and location-based weather alerts.',
    detailedOverview:
      'Create a polished weather application integrating multiple third-party APIs. Practice API composition, data transformation, caching strategies, and building beautiful data-driven UIs. Great first project for internship portfolios.',
    category: 'Web Development',
    difficulty: 'Beginner',
    estimatedDuration: '2 Weeks',
    skills: ['React', 'CSS', 'REST API', 'JavaScript', 'Geolocation API'],
    tools: ['VS Code', 'OpenWeather API', 'Mapbox', 'Git', 'Netlify'],
    learningOutcomes: [
      'Consume and compose third-party REST APIs',
      'Implement geolocation and mapping features',
      'Build responsive, mobile-first interfaces',
      'Handle loading states and error boundaries',
      'Deploy static sites to Netlify/Vercel',
    ],
    milestones: [
      { title: 'API Setup & Data Modeling', description: 'Register for API keys, plan data flow, set up React project.', order: 0 },
      { title: 'Current Weather Display', description: 'Build the main dashboard card showing current conditions.', order: 1 },
      { title: 'Forecast & Charts', description: 'Add 7-day forecast, hourly breakdown, and temperature charts.', order: 2 },
      { title: 'Location & Map', description: 'Integrate geolocation, city search, and interactive weather map.', order: 3 },
    ],
    industry: 'Technology',
    companyType: 'Startup',
    thumbnail: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    popularity: 83,
  },
  {
    title: 'Social Media Analytics Dashboard',
    description:
      'Create an analytics platform that aggregates social media metrics, displays engagement trends, and generates performance reports.',
    detailedOverview:
      'Build a marketing analytics tool that visualizes social media KPIs with real-time data updates. Implement chart-rich dashboards, date range filtering, export capabilities, and scheduled report generation.',
    category: 'Data Science',
    difficulty: 'Intermediate',
    estimatedDuration: '4 Weeks',
    skills: ['React', 'Python', 'Data Visualization', 'REST API', 'PostgreSQL'],
    tools: ['VS Code', 'Recharts', 'FastAPI', 'PostgreSQL', 'Pandas'],
    learningOutcomes: [
      'Build interactive data visualization dashboards',
      'Implement data aggregation and analytics pipelines',
      'Design date range filtering and drill-down features',
      'Create automated report generation workflows',
      'Work with time-series data patterns',
    ],
    milestones: [
      { title: 'Data Pipeline Setup', description: 'Configure data sources, design database schema for metrics.', order: 0 },
      { title: 'Backend API', description: 'Build aggregation endpoints with date filtering and pagination.', order: 1 },
      { title: 'Dashboard UI', description: 'Create chart components for engagement, reach, and growth metrics.', order: 2 },
      { title: 'Reports & Export', description: 'Add PDF/CSV report generation and scheduled email reports.', order: 3 },
      { title: 'Real-time Updates', description: 'Implement WebSocket connections for live metric updates.', order: 4 },
    ],
    industry: 'Marketing',
    companyType: 'Mid-size',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    popularity: 69,
  },
  {
    title: 'Open Source Contribution: Bug Tracker',
    description:
      'Contribute to an open-source bug tracking tool by implementing new features, fixing issues, and writing documentation for the community.',
    detailedOverview:
      'Learn open-source collaboration workflows by contributing to a real project. Practice Git workflows (forks, branches, PRs), code reviews, writing tests, and following contribution guidelines. Builds both technical and collaborative skills.',
    category: 'Web Development',
    difficulty: 'Beginner',
    estimatedDuration: '3 Weeks',
    skills: ['Git', 'JavaScript', 'Code Review', 'Testing', 'Documentation'],
    tools: ['GitHub', 'VS Code', 'Jest', 'ESLint', 'Markdown'],
    learningOutcomes: [
      'Master Git branching and pull request workflows',
      'Write maintainable, well-documented code',
      'Participate in code reviews effectively',
      'Write unit and integration tests',
      'Navigate and understand large codebases',
    ],
    milestones: [
      { title: 'Repository Setup', description: 'Fork the repo, set up local development, and understand the codebase.', order: 0 },
      { title: 'First Contribution', description: 'Fix a "good first issue" bug, write tests, and submit a PR.', order: 1 },
      { title: 'Feature Implementation', description: 'Pick a feature request, implement it following project conventions.', order: 2 },
      { title: 'Documentation & Review', description: 'Write documentation for your features and review others\' PRs.', order: 3 },
    ],
    industry: 'Open Source',
    companyType: 'Open Source',
    thumbnail: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    popularity: 91,
  },
  {
    title: 'Portfolio Website with CMS Backend',
    description:
      'Design and build a professional developer portfolio with a headless CMS for managing projects, blog posts, and testimonials dynamically.',
    detailedOverview:
      'Create a stunning portfolio website that showcases your work. Implement a content management backend so you can update projects and blog posts without redeploying. Practice responsive design, animation, and SEO optimization.',
    category: 'Web Development',
    difficulty: 'Beginner',
    estimatedDuration: '2 Weeks',
    skills: ['React', 'CSS', 'Node.js', 'Animation', 'SEO', 'JavaScript'],
    tools: ['VS Code', 'Framer Motion', 'MongoDB', 'Vercel', 'Figma'],
    learningOutcomes: [
      'Build professional portfolio websites',
      'Implement smooth animations and transitions',
      'Design and build a headless CMS backend',
      'Optimize websites for SEO and performance',
      'Deploy and manage production websites',
    ],
    milestones: [
      { title: 'Design & Layout', description: 'Create wireframes, choose a color palette, and build the responsive layout.', order: 0 },
      { title: 'Core Sections', description: 'Build hero, about, projects, skills, and contact sections.', order: 1 },
      { title: 'CMS Backend', description: 'Create API endpoints for managing portfolio content dynamically.', order: 2 },
      { title: 'Animations & Polish', description: 'Add scroll animations, page transitions, and micro-interactions.', order: 3 },
    ],
    industry: 'Freelance',
    companyType: 'Freelance',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    popularity: 78,
  },
  {
    title: 'RESTful API Design & Testing Suite',
    description:
      'Design, document, and thoroughly test a RESTful API for a booking platform, following OpenAPI standards with comprehensive automated test coverage.',
    detailedOverview:
      'Learn professional API design by building a hotel booking API with proper resource modeling, pagination, filtering, error handling, and rate limiting. Write comprehensive tests with Jest/Supertest and auto-generate API docs with Swagger.',
    category: 'Backend Development',
    difficulty: 'Intermediate',
    estimatedDuration: '3 Weeks',
    skills: ['Node.js', 'Express', 'Testing', 'Swagger', 'MongoDB', 'REST API'],
    tools: ['VS Code', 'Postman', 'Jest', 'Swagger UI', 'MongoDB'],
    learningOutcomes: [
      'Design RESTful APIs following industry standards',
      'Write comprehensive automated test suites',
      'Generate API documentation with OpenAPI/Swagger',
      'Implement pagination, filtering, and sorting',
      'Apply rate limiting and security best practices',
    ],
    milestones: [
      { title: 'API Design & Schema', description: 'Design resource models, define endpoints, and create OpenAPI spec.', order: 0 },
      { title: 'Core CRUD Endpoints', description: 'Implement booking, room, and user management endpoints.', order: 1 },
      { title: 'Advanced Features', description: 'Add pagination, filtering, sorting, and rate limiting.', order: 2 },
      { title: 'Test Suite', description: 'Write unit tests, integration tests, and end-to-end API tests.', order: 3 },
      { title: 'Documentation', description: 'Set up Swagger UI, write usage examples, and create a README.', order: 4 },
    ],
    industry: 'Technology',
    companyType: 'Mid-size',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    popularity: 74,
  },
];

const seedProjects = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online-learning'
    );
    console.log('Connected to MongoDB for seeding internship projects...');

    await InternshipProject.deleteMany({});
    console.log('Cleared existing internship projects.');

    const created = await InternshipProject.insertMany(projects);
    console.log(`Seeded ${created.length} internship projects successfully.`);

    await mongoose.disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedProjects();
