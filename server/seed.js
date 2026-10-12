import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from './models/Course.js';
import Module from './models/Module.js';
import Lesson from './models/Lesson.js';
import Resource from './models/Resource.js';
import Progress from './models/Progress.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online-learning');
    console.log('Connected to MongoDB for seeding...');

    // Clear existing course data
    await Course.deleteMany({});
    await Module.deleteMany({});
    await Lesson.deleteMany({});
    await Resource.deleteMany({});

    console.log('Cleared existing courses, modules, lessons, and resources.');

    // Course 1: Full-Stack Web Development Mastery
    const course1 = await Course.create({
      title: 'Full-Stack Web Development Mastery',
      description: 'Master modern frontend and backend web development using HTML5, CSS3, JavaScript ES6+, React, Node.js, Express, and MongoDB.',
      category: 'Web Development',
      difficulty: 'Beginner',
      duration: '8 Weeks',
      instructor: 'Alex Rivera',
      thumbnail: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?auto=format&fit=crop&w=800&q=80',
    });

    const modulesCourse1 = [
      {
        title: 'Module 1: Modern HTML5 & CSS3 Foundations',
        description: 'Build responsive, accessible user interfaces using Semantic HTML, Flexbox, CSS Grid, and custom properties.',
        order: 1,
        lessons: [
          {
            title: 'Lesson 1.1: Semantic HTML5 & Modern Document Structure',
            description: 'Learn why semantic elements like <header>, <nav>, <main>, <section>, and <footer> matter for accessibility and SEO.',
            content: `Semantic HTML provides meaning to web page content rather than just defining its appearance.

Key Semantic Elements:
- <header>: Top navigation or page banner
- <nav>: Primary site navigation links
- <main>: Central unique content of the document
- <article>: Self-contained independent content block
- <section>: Thematic grouping of related content
- <footer>: Page or section footer containing copyright or meta info

Benefits of Semantic HTML:
1. Accessibility: Screen readers can navigate sections easily.
2. SEO: Search engines index structure efficiently.
3. Maintainability: Clean code structure for developer teams.`,
            resources: [
              {
                title: 'MDN Web Docs - HTML Semantic Elements',
                type: 'Documentation',
                description: 'Complete guide to HTML5 semantic tag specifications.',
                url: 'https://developer.mozilla.org/en-US/docs/Glossary/Semantics#html_semantics',
              },
              {
                title: 'HTML5 Semantic Markup Crash Course',
                type: 'Video',
                description: 'Comprehensive video tutorial explaining document structuring.',
                url: 'https://www.youtube.com/watch?v=kUMe1FH4CHE',
              },
            ],
          },
          {
            title: 'Lesson 1.2: Master CSS Grid & Flexbox Layouts',
            description: 'Understand how to create responsive 2D layouts using CSS Grid and 1D element distribution using Flexbox.',
            content: `Layout systems in modern CSS render complex dynamic layouts effortlessly without floats.

Flexbox (1D Layouts):
- display: flex
- flex-direction: row | column
- justify-content: flex-start | center | space-between
- align-items: stretch | center

CSS Grid (2D Layouts):
- display: grid
- grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))
- gap: 1.5rem

When to use Flexbox vs Grid:
- Use Flexbox for linear alignment (Navbars, buttons, toolbars).
- Use CSS Grid for overall page structure, product grids, and dashboards.`,
            resources: [
              {
                title: 'CSS Tricks - Complete Guide to Flexbox',
                type: 'Article',
                description: 'Visual reference guide for all flex container and item properties.',
                url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/',
              },
              {
                title: 'Grid by Example - Rachel Andrew',
                type: 'Website',
                description: 'Interactive examples and code patterns for CSS Grid layout.',
                url: 'https://gridbyexample.com/',
              },
            ],
          },
          {
            title: 'Lesson 1.3: Responsive Web Design & Media Queries',
            description: 'Design mobile-first layouts using breakpoints, relative units (rem, em, vh, vw), and fluid design principles.',
            content: `Responsive Web Design ensures applications look crisp across smartphones, tablets, laptops, and ultra-wide displays.

Core Responsive Principles:
1. Fluid Grids & Relative Units (rem, em, percentages instead of hardcoded px)
2. Flexible Media (max-width: 100% on images and videos)
3. CSS Media Queries:
   @media (min-width: 768px) { ... }
   @media (min-width: 1024px) { ... }

Mobile-First Strategy:
Write base CSS for mobile viewports first, then scale up using min-width media queries.`,
            resources: [
              {
                title: 'Responsive Design Starter Repository',
                type: 'GitHub',
                description: 'Sample responsive boilerplate code with breakpoint mixins.',
                url: 'https://github.com/h5bp/html5-boilerplate',
              },
              {
                title: 'Responsive Design Best Practices',
                type: 'PDF',
                description: 'Downloadable PDF reference guide for viewport breakpoints.',
                url: 'https://web.dev/responsive-web-design-basics/',
              },
            ],
          },
        ],
      },
      {
        title: 'Module 2: JavaScript ES6+ Core & Async Programming',
        description: 'Master JavaScript fundamentals, DOM manipulation, promises, async/await, and modern ES6 modules.',
        order: 2,
        lessons: [
          {
            title: 'Lesson 2.1: Modern ES6+ Syntax (Let/Const, Arrow Functions, Destructuring)',
            description: 'Explore block scope, arrow function lexical binding, destructuring arrays and objects, and rest/spread syntax.',
            content: `JavaScript ES6 revolutionized application development with expressive, concise syntax.

Key Features:
- Scoping: let and const replace var to prevent scoping bugs.
- Arrow Functions: Concise syntax with lexical 'this' binding.
  const add = (a, b) => a + b;
- Object & Array Destructuring:
  const { name, email } = user;
  const [first, second] = items;
- Spread & Rest Operators (...):
  const newArray = [...oldArray, newItem];`,
            resources: [
              {
                title: 'JavaScript.info - Modern JavaScript Tutorial',
                type: 'Article',
                description: 'Detailed explanation of ES6+ features with interactive code snippets.',
                url: 'https://javascript.info/js',
              },
              {
                title: 'ES6 Syntax Deep Dive',
                type: 'Video',
                description: 'Video lesson covering modern JavaScript syntax updates.',
                url: 'https://www.youtube.com/watch?v=NCwa_xi0Uuc',
              },
            ],
          },
          {
            title: 'Lesson 2.2: Asynchronous JavaScript (Promises & Async/Await)',
            description: 'Learn how to handle asynchronous data operations, API calls, error handling, and event loops cleanly.',
            content: `Asynchronous JavaScript allows applications to execute network requests without freezing the UI thread.

Promises vs Async/Await:

Using Promises:
fetch('/api/data')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));

Using Async/Await:
async function loadData() {
  try {
    const res = await fetch('/api/data');
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}`,
            resources: [
              {
                title: 'MDN - How to Use Promises',
                type: 'Documentation',
                description: 'Official Mozilla Developer Network guide to promises.',
                url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Promises',
              },
              {
                title: 'Async JavaScript Cheat Sheet',
                type: 'Notes',
                description: 'Handy summary notes covering Event Loop, Promises, and try/catch error handling.',
                url: 'https://github.com/getify/You-Dont-Know-JS',
              },
            ],
          },
          {
            title: 'Lesson 2.3: JavaScript Fetch API & Axios Integration',
            description: 'Perform HTTP GET, POST, PUT, DELETE operations against JSON backend endpoints.',
            content: `Communicating with REST APIs is vital for modern web applications.

Axios Instance Configuration:
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor for Auth Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});`,
            resources: [
              {
                title: 'Axios Official Documentation',
                type: 'Documentation',
                description: 'Learn request config, interceptors, and error handling in Axios.',
                url: 'https://axios-http.com/docs/intro',
              },
              {
                title: 'REST API Fetching GitHub Examples',
                type: 'GitHub',
                description: 'Repository showing clean fetch and axios abstraction helpers.',
                url: 'https://github.com/axios/axios',
              },
            ],
          },
        ],
      },
      {
        title: 'Module 3: React.js Component Architecture',
        description: 'Build dynamic single-page applications using React state, props, hooks, and context.',
        order: 3,
        lessons: [
          {
            title: 'Lesson 3.1: React State & Effect Hooks (useState, useEffect)',
            description: 'Understand component lifecycles, state immutability, and side-effect synchronization with useEffect.',
            content: `React hooks enable functional components to manage state and side effects cleanly.

useState Hook:
const [count, setCount] = useState(0);

useEffect Hook:
useEffect(() => {
  const fetchData = async () => {
    const data = await getCourses();
    setCourses(data);
  };
  fetchData();
}, []); // Empty dependency array runs on mount`,
            resources: [
              {
                title: 'React Docs - Reusing Logic with Custom Hooks',
                type: 'Documentation',
                description: 'Official React documentation on hooks and state management.',
                url: 'https://react.dev/learn/reusing-logic-with-custom-hooks',
              },
              {
                title: 'React Hooks Complete Walkthrough',
                type: 'Video',
                description: 'In-depth tutorial on state management and hook rules.',
                url: 'https://www.youtube.com/watch?v=TNhaISOUy6Q',
              },
            ],
          },
          {
            title: 'Lesson 3.2: Context API for Global Auth State',
            description: 'Avoid prop-drilling by sharing authentication token, current user, and login status across components.',
            content: `The React Context API allows state to be shared globally across the entire component tree.

Creating Auth Context:
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  return (
    <AuthContext.Provider value={{ user, token, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};`,
            resources: [
              {
                title: 'React Context API Complete Guide',
                type: 'Article',
                description: 'Comprehensive guide to building production AuthContext.',
                url: 'https://react.dev/reference/react/createContext',
              },
              {
                title: 'React Context Auth Boilerplate',
                type: 'GitHub',
                description: 'Open source repository demonstrating JWT storage and AuthContext.',
                url: 'https://github.com/facebook/react',
              },
            ],
          },
          {
            title: 'Lesson 3.3: Client Routing with React Router v6+',
            description: 'Configure public, protected, dynamic, and layout routes using react-router-dom.',
            content: `React Router enables seamless SPA navigation without full browser page reloads.

Setting up Routes:
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/" element={<ProtectedRoute><StudentLayout /></ProtectedRoute>}>
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="courses" element={<Courses />} />
      <Route path="courses/:courseId" element={<CourseDetails />} />
      <Route path="learning/:courseId/:lessonId" element={<LessonPage />} />
    </Route>
  </Routes>
</BrowserRouter>`,
            resources: [
              {
                title: 'React Router v6 Official Docs',
                type: 'Documentation',
                description: 'Official API reference for Routes, Navigate, useNavigate, and useParams.',
                url: 'https://reactrouter.com/',
              },
              {
                title: 'Protected Routes Pattern Guide',
                type: 'Notes',
                description: 'Quick reference notes for guard components and redirection.',
                url: 'https://ui.dev/react-router-protected-routes',
              },
            ],
          },
        ],
      },
      {
        title: 'Module 4: Node.js & Express RESTful API Development',
        description: 'Build backend APIs with Node.js, Express, MongoDB, Mongoose schemas, and JWT authentication.',
        order: 4,
        lessons: [
          {
            title: 'Lesson 4.1: Express Server Setup & Middleware Pipeline',
            description: 'Create Express servers, configure CORS, parse JSON request bodies, and implement error middleware.',
            content: `Express.js is a minimalist web framework for Node.js backends.

Server Pipeline:
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);

app.listen(5000, () => console.log('Server live on port 5000'));`,
            resources: [
              {
                title: 'Express.js Framework Guide',
                type: 'Documentation',
                description: 'Official guide to routing and middleware architecture.',
                url: 'https://expressjs.com/',
              },
              {
                title: 'Node.js Express REST API Starter',
                type: 'GitHub',
                description: 'Production-ready folder layout for Express applications.',
                url: 'https://github.com/expressjs/express',
              },
            ],
          },
          {
            title: 'Lesson 4.2: MongoDB Schemas & Mongoose Models',
            description: 'Define relational models with Mongoose ObjectId references and schema validation.',
            content: `Mongoose provides straight-forward schema-based modeling for MongoDB document databases.

Creating Relational Schema:
const lessonSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  order: { type: Number, required: true }
});`,
            resources: [
              {
                title: 'Mongoose Documentation',
                type: 'Documentation',
                description: 'Guide to schemas, models, populate, and query methods.',
                url: 'https://mongoosejs.com/docs/guide.html',
              },
              {
                title: 'MongoDB Data Modeling Essentials',
                type: 'Article',
                description: 'Best practices for document relationships and indexes.',
                url: 'https://www.mongodb.com/docs/manual/core/data-modeling-introduction/',
              },
            ],
          },
          {
            title: 'Lesson 4.3: JWT Authentication & Password Hashing with Bcrypt',
            description: 'Implement secure password registration, bcrypt hashing, and JSON Web Token generation.',
            content: `Security is critical in modern API backends. Passwords should NEVER be stored in plain text.

Password Hashing with Bcrypt:
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

Generating JWT Token:
const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });`,
            resources: [
              {
                title: 'JSON Web Token (JWT) Specification',
                type: 'Website',
                description: 'Interactive debugger and spec explanation for JWT tokens.',
                url: 'https://jwt.io/',
              },
              {
                title: 'OWASP Authentication Cheat Sheet',
                type: 'PDF',
                description: 'Security rules for password storage and token handling.',
                url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html',
              },
            ],
          },
        ],
      },
    ];

    // Insert Module & Lesson references for Course 1
    for (const modData of modulesCourse1) {
      const moduleDoc = await Module.create({
        courseId: course1._id,
        title: modData.title,
        description: modData.description,
        order: modData.order,
      });

      let lessonOrder = 1;
      for (const lessonData of modData.lessons) {
        const lessonDoc = await Lesson.create({
          moduleId: moduleDoc._id,
          courseId: course1._id,
          title: lessonData.title,
          description: lessonData.description,
          content: lessonData.content,
          order: lessonOrder++,
        });

        for (const resData of lessonData.resources) {
          await Resource.create({
            lessonId: lessonDoc._id,
            title: resData.title,
            type: resData.type,
            description: resData.description,
            url: resData.url,
          });
        }
      }
    }

    // Course 2: Java Programming & Object-Oriented Design
    const course2 = await Course.create({
      title: 'Java Programming & Object-Oriented Design',
      description: 'Comprehensive guide to core Java 21, object-oriented concepts, collections, streams, multithreading, and enterprise design patterns.',
      category: 'Software Engineering',
      difficulty: 'Intermediate',
      duration: '6 Weeks',
      instructor: 'Dr. Marcus Vance',
      thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    });

    const modulesCourse2 = [
      {
        title: 'Module 1: Java Language Fundamentals',
        description: 'Learn Java syntax, JVM architecture, primitive types, control flow, and memory management.',
        order: 1,
        lessons: [
          {
            title: 'Lesson 1.1: JDK Setup & The Java Execution Engine (JVM/JRE/JDK)',
            description: 'Understand compilation into bytecode (.class) and execution inside the Java Virtual Machine.',
            content: `Java's 'Write Once, Run Anywhere' philosophy is driven by the JVM architecture.

Execution Flow:
1. Java Source File (.java)
2. javac Compiler converts code to Bytecode (.class)
3. JVM JIT (Just-In-Time) Compiler executes bytecode on target OS platform.

Primitive Data Types:
- byte, short, int, long (Integers)
- float, double (Floating-point)
- char (Unicode character)
- boolean (true / false)`,
            resources: [
              {
                title: 'Oracle Java Standard Edition Docs',
                type: 'Documentation',
                description: 'Official JDK specification and API reference.',
                url: 'https://docs.oracle.com/en/java/',
              },
              {
                title: 'Java JVM Architecture Explained',
                type: 'Video',
                description: 'Visual explanation of heap vs stack memory and garbage collection.',
                url: 'https://www.youtube.com/watch?v=ZBJ0u9MaKtM',
              },
            ],
          },
          {
            title: 'Lesson 1.2: Control Flow Statements & Exception Handling',
            description: 'Master if/else, switch expressions, loops, try-catch-finally, and custom exceptions.',
            content: `Structured flow control and robust exception handling ensure enterprise stability.

Modern Switch Expressions (Java 14+):
String result = switch (day) {
  case MONDAY, FRIDAY -> "Work day";
  case SATURDAY, SUNDAY -> "Weekend";
  default -> "Midweek";
};

Try-With-Resources (Auto-closing streams):
try (BufferedReader br = new BufferedReader(new FileReader("file.txt"))) {
  String line = br.readLine();
} catch (IOException e) {
  logger.error("Read error", e);
}`,
            resources: [
              {
                title: 'Java Exception Handling Best Practices',
                type: 'Article',
                description: 'Guide to checked vs unchecked exceptions and log handling.',
                url: 'https://www.baeldung.com/java-exceptions',
              },
              {
                title: 'Control Flow Exercises Repository',
                type: 'GitHub',
                description: 'Practice problems covering loops, switch statements, and custom exception classes.',
                url: 'https://github.com/in28minutes/java-a-course-for-beginners',
              },
            ],
          },
          {
            title: 'Lesson 1.3: Arrays, String Builder, & Memory Allocation',
            description: 'Analyze heap vs stack memory, string immutability, and efficient string concatenation with StringBuilder.',
            content: `Understanding how objects reside in the JVM Heap prevents memory leaks.

String Immutability:
Strings in Java are immutable and stored in the String Constant Pool.

StringBuilder for Performance:
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1000; i++) {
  sb.append("item ").append(i);
}
String result = sb.toString();`,
            resources: [
              {
                title: 'Java Memory Management Breakdown',
                type: 'Notes',
                description: 'Cheatsheet on JVM heap spaces, garbage collection algorithms, and memory tuning.',
                url: 'https://www.journaldev.com/4098/java-heap-space-vs-stack-memory',
              },
              {
                title: 'Java StringBuilder Performance Guide',
                type: 'Documentation',
                description: 'Oracle API documentation for StringBuilder and StringBuffer.',
                url: 'https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/StringBuilder.html',
              },
            ],
          },
        ],
      },
      {
        title: 'Module 2: Object-Oriented Programming (OOP) Principles',
        description: 'Implement Encapsulation, Inheritance, Polymorphism, Abstraction, Interfaces, and SOLID principles.',
        order: 2,
        lessons: [
          {
            title: 'Lesson 2.1: Classes, Objects, & Encapsulation',
            description: 'Define classes with private fields, public getters/setters, constructors, and access modifiers.',
            content: `Encapsulation hides internal state and exposes functionality through public methods.

Example Encapsulated Class:
public class BankAccount {
  private double balance;

  public BankAccount(double initialBalance) {
    if (initialBalance >= 0) this.balance = initialBalance;
  }

  public void deposit(double amount) {
    if (amount > 0) this.balance += amount;
  }

  public double getBalance() {
    return balance;
  }
}`,
            resources: [
              {
                title: 'OOP Principles in Java Guide',
                type: 'Article',
                description: 'Deep dive into encapsulation, data hiding, and domain modeling.',
                url: 'https://www.geeksforgeeks.org/object-oriented-programming-oops-concept-in-java/',
              },
              {
                title: 'Object-Oriented Design Video Lecture',
                type: 'Video',
                description: 'University level lecture on modeling real-world domains into Java classes.',
                url: 'https://www.youtube.com/watch?v=pTB0EiLXUC8',
              },
            ],
          },
          {
            title: 'Lesson 2.2: Inheritance, Polymorphism, & Abstract Classes',
            description: 'Extend base classes, override methods, dynamic method dispatch, and abstract class usage.',
            content: `Polymorphism enables treating instances of child classes as their parent type.

Abstract Base Class:
public abstract class Shape {
  public abstract double calculateArea();
}

Derived Class:
public class Circle extends Shape {
  private double radius;
  
  public Circle(double radius) { this.radius = radius; }
  
  @Override
  public double calculateArea() {
    return Math.PI * radius * radius;
  }
}`,
            resources: [
              {
                title: 'Java Polymorphism & Abstract Classes',
                type: 'Documentation',
                description: 'Oracle Java documentation on method overriding and super keyword usage.',
                url: 'https://docs.oracle.com/javase/tutorial/java/IandI/override.html',
              },
              {
                title: 'Inheritance vs Composition Patterns',
                type: 'Article',
                description: 'Why composition is often preferred over deep inheritance hierarchies.',
                url: 'https://www.baeldung.com/java-inheritance-composition',
              },
            ],
          },
          {
            title: 'Lesson 2.3: Java Interfaces & Default/Static Methods',
            description: 'Implement multiple interfaces, functional interfaces (@FunctionalInterface), and default methods.',
            content: `Interfaces establish rigid contracts between software components.

Functional Interface:
@FunctionalInterface
public interface PaymentProcessor {
  boolean process(double amount);
  
  default void logPayment(double amount) {
    System.out.println("Processing payment of $" + amount);
  }
}`,
            resources: [
              {
                title: 'Java Interfaces Official Docs',
                type: 'Documentation',
                description: 'Specification for Java 8+ default and static methods in interfaces.',
                url: 'https://docs.oracle.com/javase/tutorial/java/IandI/createinterface.html',
              },
              {
                title: 'SOLID Design Principles in Java',
                type: 'PDF',
                description: 'Downloadable PDF covering Single Responsibility, Open-Closed, Liskov, Interface Segregation, and Dependency Inversion.',
                url: 'https://www.baeldung.com/solid-principles',
              },
            ],
          },
        ],
      },
      {
        title: 'Module 3: Java Collections Framework & Streams API',
        description: 'Work with ArrayList, LinkedList, HashMap, HashSet, and functional operations using Java Streams.',
        order: 3,
        lessons: [
          {
            title: 'Lesson 3.1: Lists, Sets, & Maps Deep Dive',
            description: 'Compare complexity (O(1) vs O(N)), iteration techniques, and hashCode/equals contracts.',
            content: `The Java Collections Framework provides standardized data structures.

Collection Types:
- List (ArrayList, LinkedList): Ordered, allows duplicates.
- Set (HashSet, TreeSet): Unique elements only, fast lookup.
- Map (HashMap, TreeMap): Key-Value pairs.

Equality Contract:
If two objects are equal according to equals(), their hashCode() MUST return the same integer.`,
            resources: [
              {
                title: 'Java Collections Framework Cheat Sheet',
                type: 'Notes',
                description: 'Time complexity comparison table for List, Set, Queue, and Map operations.',
                url: 'https://www.baeldung.com/java-collections-complexity',
              },
              {
                title: 'Collections Source Code on GitHub',
                type: 'GitHub',
                description: 'Open source Java standard library implementation examples.',
                url: 'https://github.com/openjdk/jdk',
              },
            ],
          },
          {
            title: 'Lesson 3.2: Java 8+ Lambda Expressions & Functional Interfaces',
            description: 'Write elegant functional code using Predicate, Function, Consumer, and Supplier interfaces.',
            content: `Lambdas turn behavior into first-class citizens in Java.

Standard Functional Interfaces:
- Predicate<T>: T -> boolean
- Function<T, R>: T -> R
- Consumer<T>: T -> void
- Supplier<T>: () -> T

Example Lambda:
List<String> names = Arrays.asList("Alex", "Sarah", "John");
names.forEach(name -> System.out.println("Hello " + name));`,
            resources: [
              {
                title: 'Java 8 Lambdas Tutorial',
                type: 'Video',
                description: 'Step-by-step video guide converting anonymous classes into clean lambdas.',
                url: 'https://www.youtube.com/watch?v=gpIUfj3KaOc',
              },
              {
                title: 'Oracle Functional Interfaces Spec',
                type: 'Documentation',
                description: 'Official Java java.util.function package documentation.',
                url: 'https://docs.oracle.com/javase/8/docs/api/java/util/function/package-summary.html',
              },
            ],
          },
          {
            title: 'Lesson 3.3: Processing Data with Java Streams API',
            description: 'Filter, map, reduce, collect, and execute parallel streams on collections.',
            content: `Streams allow high-level declarative transformations on collections of data.

Stream Pipeline:
List<String> result = users.stream()
  .filter(u -> u.getAge() >= 18)
  .map(User::getName)
  .sorted()
  .collect(Collectors.toList());`,
            resources: [
              {
                title: 'Mastering Java Streams - Guide',
                type: 'Article',
                description: 'In-depth tutorial on map, filter, flatMap, reduce, and groupingBy operations.',
                url: 'https://stackify.com/streams-guide-java-8/',
              },
              {
                title: 'Java Streams Interactive Examples',
                type: 'Website',
                description: 'Interactive code runner demonstrating stream operations.',
                url: 'https://www.java67.com/2014/04/java-8-stream-api-examples-tutorial.html',
              },
            ],
          },
        ],
      },
      {
        title: 'Module 4: Multithreading & Concurrent Programming',
        description: 'Explore threads, Runnable, ExecutorService, thread safety, synchronization, and atomic variables.',
        order: 4,
        lessons: [
          {
            title: 'Lesson 4.1: Thread Lifecycle & Creating Worker Threads',
            description: 'Extend Thread, implement Runnable, handle thread sleep, join, and interrupts.',
            content: `Multithreading allows applications to process concurrent jobs in parallel threads.

Creating Threads:
Runnable task = () -> {
  System.out.println("Task running on thread: " + Thread.currentThread().getName());
};

Thread thread = new Thread(task);
thread.start();`,
            resources: [
              {
                title: 'Java Concurrency in Practice Book Summary',
                type: 'Notes',
                description: 'Key insights from the definitive book on Java concurrency.',
                url: 'https://jcip.net/',
              },
              {
                title: 'Java Multithreading Tutorial Video',
                type: 'Video',
                description: 'Video tutorial covering thread states, sleep, join, and deadlock avoidance.',
                url: 'https://www.youtube.com/watch?v=r_MbozD32eo',
              },
            ],
          },
          {
            title: 'Lesson 4.2: Thread Pools & ExecutorService Framework',
            description: 'Manage worker thread lifecycle efficiently using Executors.newFixedThreadPool and Futures.',
            content: `Creating raw threads is expensive. ExecutorService reuses a pool of worker threads.

ThreadPool Setup:
ExecutorService executor = Executors.newFixedThreadPool(4);

Future<Integer> futureResult = executor.submit(() -> {
  // Heavy calculation
  return 42;
});

Integer result = futureResult.get(); // Waits for execution
executor.shutdown();`,
            resources: [
              {
                title: 'Oracle ExecutorService Documentation',
                type: 'Documentation',
                description: 'Official Java java.util.concurrent.ExecutorService API specification.',
                url: 'https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/ExecutorService.html',
              },
              {
                title: 'Concurrent Java Code Repository',
                type: 'GitHub',
                description: 'Sample concurrent task queues and lock implementations.',
                url: 'https://github.com/eugenp/tutorials/tree/master/core-java-modules/core-java-concurrency-basic',
              },
            ],
          },
          {
            title: 'Lesson 4.3: Synchronization, Locks, & Atomic Operations',
            description: 'Prevent race conditions using synchronized blocks, ReentrantLock, and AtomicInteger.',
            content: `Race conditions occur when multiple threads mutate shared data simultaneously without synchronization.

Atomic Variables:
AtomicInteger counter = new AtomicInteger(0);
counter.incrementAndGet(); // Thread-safe atomic increment without explicit locking`,
            resources: [
              {
                title: 'Java Locks and Synchronization Guide',
                type: 'Article',
                description: 'Detailed article explaining ReentrantLock, ReadWriteLock, and volatile keywords.',
                url: 'https://www.baeldung.com/java-concurrent-locks',
              },
              {
                title: 'Concurrency Safety Checklist',
                type: 'PDF',
                description: 'PDF guide listing rules to write deadlock-free thread-safe Java code.',
                url: 'https://docs.oracle.com/javase/tutorial/essential/concurrency/',
              },
            ],
          },
        ],
      },
    ];

    for (const modData of modulesCourse2) {
      const moduleDoc = await Module.create({
        courseId: course2._id,
        title: modData.title,
        description: modData.description,
        order: modData.order,
      });

      let lessonOrder = 1;
      for (const lessonData of modData.lessons) {
        const lessonDoc = await Lesson.create({
          moduleId: moduleDoc._id,
          courseId: course2._id,
          title: lessonData.title,
          description: lessonData.description,
          content: lessonData.content,
          order: lessonOrder++,
        });

        for (const resData of lessonData.resources) {
          await Resource.create({
            lessonId: lessonDoc._id,
            title: resData.title,
            type: resData.type,
            description: resData.description,
            url: resData.url,
          });
        }
      }
    }

    // Course 3: Data Structures & Algorithms Essentials
    const course3 = await Course.create({
      title: 'Data Structures & Algorithms Essentials',
      description: 'Master Big O asymptotic analysis, arrays, strings, linked lists, trees, graphs, sorting, searching, and dynamic programming for technical interviews.',
      category: 'Computer Science',
      difficulty: 'Advanced',
      duration: '10 Weeks',
      instructor: 'Elena Rostova',
      thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
    });

    const modulesCourse3 = [
      {
        title: 'Module 1: Big O Complexity & Array/String Techniques',
        description: 'Understand time and space complexity analysis, two-pointer techniques, and sliding window patterns.',
        order: 1,
        lessons: [
          {
            title: 'Lesson 1.1: Big O Notation & Asymptotic Complexity Analysis',
            description: 'Evaluate algorithm efficiency in worst, average, and best-case scenarios (O(1), O(log N), O(N), O(N log N), O(N^2)).',
            content: `Big O notation quantifies how algorithm execution time or memory footprint scales with input size N.

Common Complexity Orders:
- O(1) Constant: Array element lookup by index
- O(log N) Logarithmic: Binary search on sorted array
- O(N) Linear: Unsorted array traversal
- O(N log N): Merge sort, Quick sort
- O(N^2) Quadratic: Nested loops (Bubble sort)
- O(2^N) Exponential: Unoptimized Fibonacci recursion`,
            resources: [
              {
                title: 'Big O Complexity Poster & Chart',
                type: 'Website',
                description: 'Visual cheatsheet of common data structure and sorting algorithm complexities.',
                url: 'https://www.bigocheatsheet.com/',
              },
              {
                title: 'MIT OpenCourseWare - Introduction to Algorithms',
                type: 'Video',
                description: 'Lecture video covering asymptotic analysis and algorithm correctness proofs.',
                url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/',
              },
            ],
          },
          {
            title: 'Lesson 1.2: Two-Pointer & Sliding Window Patterns',
            description: 'Solve subarray and pair problems efficiently in O(N) time instead of O(N^2).',
            content: `Two-pointer and sliding window techniques optimize nested loop problems into single pass O(N) algorithms.

Two-Pointer Strategy (e.g. Target Sum on Sorted Array):
int left = 0, right = nums.length - 1;
while (left < right) {
  int sum = nums[left] + nums[right];
  if (sum == target) return new int[]{left, right};
  else if (sum < target) left++;
  else right--;
}`,
            resources: [
              {
                title: 'Sliding Window Pattern Guide',
                type: 'Article',
                description: 'Step-by-step breakdown of fixed vs dynamic size sliding window problems.',
                url: 'https://leetcode.com/discuss/general-discussion/657507/sliding-window-algorithm-template-to-solve-all-leetcode-problems',
              },
              {
                title: 'Two-Pointer Problem Code Samples',
                type: 'GitHub',
                description: 'Clean implementations of classic array and string algorithmic challenges.',
                url: 'https://github.com/jwasham/coding-interview-university',
              },
            ],
          },
          {
            title: 'Lesson 1.3: Prefix Sums & In-Place Array Manipulations',
            description: 'Compute range sum queries in O(1) time and modify array elements without extra space memory.',
            content: `Prefix Sum arrays store cumulative sums to answer range query questions instantly.

Prefix Array Formula:
prefix[i] = prefix[i-1] + nums[i]

Sum between index L and R:
sum(L, R) = prefix[R] - prefix[L-1]`,
            resources: [
              {
                title: 'Array Techniques Reference',
                type: 'Notes',
                description: 'Summary notes for array rotation, prefix sums, and Kadane algorithm for max subarray sum.',
                url: 'https://cp-algorithms.com/',
              },
              {
                title: 'LeetCode Top 75 Array Questions',
                type: 'Website',
                description: 'Curated list of essential array interview questions.',
                url: 'https://leetcode.com/studyplan/leetcode-75/',
              },
            ],
          },
        ],
      },
      {
        title: 'Module 2: Linked Lists, Stacks, & Queues',
        description: 'Implement singly linked lists, doubly linked lists, LIFO stacks, FIFO queues, and monotonic stacks.',
        order: 2,
        lessons: [
          {
            title: 'Lesson 2.1: Singly & Doubly Linked List Operations',
            description: 'Implement Node pointers, insertion, deletion, reversal, and fast/slow pointer cycle detection.',
            content: `Linked lists store nodes with data and pointer references dynamically allocated across heap memory.

Floyd's Cycle Detection (Fast & Slow Pointers):
Node slow = head, fast = head;
while (fast != null && fast.next != null) {
  slow = slow.next;
  fast = fast.next.next;
  if (slow == fast) return true; // Cycle detected!
}
return false;`,
            resources: [
              {
                title: 'Linked List Visualizer Tool',
                type: 'Website',
                description: 'Interactive visualizer showing pointer mutations during list reversal and deletion.',
                url: 'https://visualgo.net/en/list',
              },
              {
                title: 'Linked List Interview Questions',
                type: 'GitHub',
                description: 'Solutions to merge k sorted lists, reverse nodes in k-group, and palindrome detection.',
                url: 'https://github.com/youngyangyang04/leetcode-master',
              },
            ],
          },
          {
            title: 'Lesson 2.2: Stacks (LIFO) & Monotonic Stack Applications',
            description: 'Use stacks for expression evaluation, valid parentheses matching, and Next Greater Element problems.',
            content: `Stacks follow Last-In, First-Out (LIFO) order.

Valid Parentheses Algorithm:
Stack<Character> stack = new Stack<>();
for (char c : s.toCharArray()) {
  if (c == '(' || c == '{' || c == '[') stack.push(c);
  else {
    if (stack.isEmpty()) return false;
    char top = stack.pop();
    if ((c == ')' && top != '(') || (c == '}' && top != '{') || (c == ']' && top != '[')) return false;
  }
}
return stack.isEmpty();`,
            resources: [
              {
                title: 'Stack & Queue Fundamentals',
                type: 'Documentation',
                description: 'GeeksforGeeks comprehensive guide to Stack data structure.',
                url: 'https://www.geeksforgeeks.org/stack-data-structure/',
              },
              {
                title: 'Monotonic Stack Pattern Video',
                type: 'Video',
                description: 'Video explaining how monotonic stacks solve Next Greater Element in O(N) time.',
                url: 'https://www.youtube.com/watch?v=Dq_ObZwTY_U',
              },
            ],
          },
          {
            title: 'Lesson 2.3: Queues (FIFO), Deques, & Priority Queues (Heaps)',
            description: 'Master First-In First-Out queues, sliding window maximum with Deque, and Min/Max Heaps.',
            content: `Priority Queues (Binary Heaps) allow extracting min or max element in O(log N) time.

Min Heap in Java:
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.add(10);
minHeap.add(5);
minHeap.poll(); // Returns 5`,
            resources: [
              {
                title: 'Heap Data Structure Tutorial',
                type: 'Article',
                description: 'Complete guide to Heapify, Insert, and Extract-Min heap operations.',
                url: 'https://www.coursera.org/learn/algorithms-part1',
              },
              {
                title: 'Priority Queue Code Samples',
                type: 'GitHub',
                description: 'Implementations of top K frequent elements and median in a data stream.',
                url: 'https://github.com/trekhleb/javascript-algorithms',
              },
            ],
          },
        ],
      },
      {
        title: 'Module 3: Trees, Binary Search Trees, & Graph Traversals',
        description: 'Explore binary tree traversals (In-order, Pre-order, Post-order, BFS), BST operations, and Graph BFS/DFS.',
        order: 3,
        lessons: [
          {
            title: 'Lesson 3.1: Binary Tree Traversals & Depth-First Search (DFS)',
            description: 'Implement recursive and iterative tree traversals and calculate tree height/diameter.',
            content: `Trees are hierarchical non-linear data structures consisting of nodes and parent-child edges.

DFS Traversals:
- Pre-order: Root -> Left -> Right
- In-order: Left -> Root -> Right (Yields sorted order in BST!)
- Post-order: Left -> Right -> Root`,
            resources: [
              {
                title: 'Tree Traversal Visualization',
                type: 'Website',
                description: 'Interactive step-by-step animation of tree traversal algorithms.',
                url: 'https://visualgo.net/en/bst',
              },
              {
                title: 'Binary Tree Algorithms Cheatsheet',
                type: 'Notes',
                description: 'Summary notes for lowest common ancestor, symmetric tree, and max path sum.',
                url: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/',
              },
            ],
          },
          {
            title: 'Lesson 3.2: Breadth-First Search (BFS) & Level-Order Traversal',
            description: 'Use FIFO queues for level-by-level tree traversal and shortest path in unweighted graphs.',
            content: `BFS explores all neighbor nodes at current depth before moving to the next level.

Tree Level Order Traversal:
Queue<TreeNode> queue = new LinkedList<>();
queue.add(root);

while (!queue.isEmpty()) {
  int levelSize = queue.size();
  for (int i = 0; i < levelSize; i++) {
    TreeNode curr = queue.poll();
    if (curr.left != null) queue.add(curr.left);
    if (curr.right != null) queue.add(curr.right);
  }
}`,
            resources: [
              {
                title: 'Graph Traversal (BFS & DFS) Guide',
                type: 'Article',
                description: 'Comparison of BFS vs DFS space/time efficiency and use cases.',
                url: 'https://www.geeksforgeeks.org/breadth-first-search-or-bfs-for-a-graph/',
              },
              {
                title: 'Graph Algorithms Video Course',
                type: 'Video',
                description: 'FreeCodeCamp graph algorithms course covering BFS, DFS, Dijkstra, and Topological Sort.',
                url: 'https://www.youtube.com/watch?v=tWVWeAqZ0WU',
              },
            ],
          },
          {
            title: 'Lesson 3.3: Graph Representation & Shortest Path Algorithms',
            description: 'Construct Adjacency Lists and implement Dijkstra shortest path and Topological Sort (Kahn algorithm).',
            content: `Graphs represent networks of interconnected vertices and edges.

Adjacency List Representation:
Map<Integer, List<Integer>> graph = new HashMap<>();

Topological Sort:
Used in build dependency graphs to order tasks with precedence constraints.`,
            resources: [
              {
                title: 'Dijkstra Algorithm Documentation',
                type: 'Documentation',
                description: 'Detailed proof and priority queue implementation of Dijkstra algorithm.',
                url: 'https://cp-algorithms.com/graph/dijkstra.html',
              },
              {
                title: 'Graph Problems GitHub Repository',
                type: 'GitHub',
                description: 'Solutions for Connected Components, Course Schedule, and Alien Dictionary.',
                url: 'https://github.com/labuladong/fucking-algorithm',
              },
            ],
          },
        ],
      },
      {
        title: 'Module 4: Sorting, Searching, & Dynamic Programming',
        description: 'Master binary search variations, Merge Sort, Quick Sort, Memoization, and Tabulation DP patterns.',
        order: 4,
        lessons: [
          {
            title: 'Lesson 4.1: Binary Search & Lower/Upper Bound Search',
            description: 'Apply O(log N) binary search on sorted arrays, search spaces, and rotated sorted arrays.',
            content: `Binary Search cuts the search space in half at every iteration step.

Standard Binary Search:
int left = 0, right = nums.length - 1;
while (left <= right) {
  int mid = left + (right - left) / 2;
  if (nums[mid] == target) return mid;
  else if (nums[mid] < target) left = mid + 1;
  else right = mid - 1;
}
return -1;`,
            resources: [
              {
                title: 'Binary Search Ultimate Guide',
                type: 'Article',
                description: 'Detailed guide to lower bound, upper bound, and binary search on answer space.',
                url: 'https://leetcode.com/discuss/general-discussion/786126/python-powerful-ultimate-binary-search-template',
              },
              {
                title: 'Binary Search Practice Set',
                type: 'Website',
                description: 'Targeted problem set for search in rotated sorted array and peak element.',
                url: 'https://leetcode.com/tag/binary-search/',
              },
            ],
          },
          {
            title: 'Lesson 4.2: Divide & Conquer Sorting Algorithms (Merge Sort & Quick Sort)',
            description: 'Understand recursive divide-and-conquer, partition operations, and O(N log N) sorting guarantees.',
            content: `Merge Sort guarantees O(N log N) time by dividing array in half and merging sorted sub-arrays.

Quick Sort Partition:
Picks a pivot element and partitions array into elements smaller than pivot and elements greater than pivot.`,
            resources: [
              {
                title: 'Sorting Algorithms Visual Comparison',
                type: 'Website',
                description: 'Side-by-side visual animations of Merge Sort, Quick Sort, Heap Sort, and Insertion Sort.',
                url: 'https://www.toptal.com/developers/sorting-algorithms',
              },
              {
                title: 'Sorting Source Code Examples',
                type: 'GitHub',
                description: 'Clean implementations of custom comparators and stable sorting routines.',
                url: 'https://github.com/williamfiset/Algorithms',
              },
            ],
          },
          {
            title: 'Lesson 4.3: Dynamic Programming Fundamentals (Memoization vs Tabulation)',
            description: 'Identify overlapping subproblems and optimal substructure. Solve 0/1 Knapsack, Coin Change, and LCS.',
            content: `Dynamic Programming solves complex problems by breaking them down into subproblems and caching results.

Memoization (Top-Down): Uses recursion with a hash map / lookup table cache.
Tabulation (Bottom-Up): Uses iterative DP table starting from base cases.

Climbing Stairs (Tabulation):
int[] dp = new int[n + 1];
dp[0] = 1; dp[1] = 1;
for (int i = 2; i <= n; i++) {
  dp[i] = dp[i - 1] + dp[i - 2];
}`,
            resources: [
              {
                title: 'Dynamic Programming Patterns Guide',
                type: 'Article',
                description: 'Comprehensive taxonomy of DP patterns: 0/1 Knapsack, Unbounded Knapsack, LCS, LIS.',
                url: 'https://leetcode.com/discuss/general-discussion/458695/dynamic-programming-patterns',
              },
              {
                title: 'DP Interview Problems PDF',
                type: 'PDF',
                description: 'Downloadable PDF cheat sheet with recurrence relations for classic interview problems.',
                url: 'https://github.com/kamyu104/LeetCode-Solutions',
              },
            ],
          },
        ],
      },
    ];

    for (const modData of modulesCourse3) {
      const moduleDoc = await Module.create({
        courseId: course3._id,
        title: modData.title,
        description: modData.description,
        order: modData.order,
      });

      let lessonOrder = 1;
      for (const lessonData of modData.lessons) {
        const lessonDoc = await Lesson.create({
          moduleId: moduleDoc._id,
          courseId: course3._id,
          title: lessonData.title,
          description: lessonData.description,
          content: lessonData.content,
          order: lessonOrder++,
        });

        for (const resData of lessonData.resources) {
          await Resource.create({
            lessonId: lessonDoc._id,
            title: resData.title,
            type: resData.type,
            description: resData.description,
            url: resData.url,
          });
        }
      }
    }

    console.log('Database successfully seeded with 3 comprehensive courses, 36 lessons, and 72 resources!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
