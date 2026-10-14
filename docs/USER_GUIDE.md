# Learner & Instructor User Guide

This guide covers the day-to-day user journeys for students (learners) and instructors on the Smart Learning Platform.

---

## Part 1: Learner (Student) Journey

### 1. Account Registration & Two-Factor Authentication (2FA)
1. **Register:** Navigate to `/register`, enter your Full Name, Email, and Password (minimum 6 characters).
2. **Login:** Navigate to `/login`, enter your email and password. Upon successful login, you will receive an active session with a unique `X-Session-ID`.
3. **Optional 2FA Setup:**
   - Go to **Profile & 2FA** (`/profile`).
   - Click **Enable Two-Factor Authentication**.
   - Scan the generated QR code using Google Authenticator, Authy, or 1Password.
   - Enter the 6-digit TOTP token to activate 2FA protection.
   - Future logins will redirect you to `/verify-2fa` for TOTP verification.

### 2. Discovering & Enrolling in Courses
1. Click **Courses** (`/courses`) in the top navigation bar.
2. Filter courses by category (e.g., Software Engineering, Backend Development, DevOps) or difficulty (Beginner, Intermediate, Advanced).
3. Click on any course card to view the detailed syllabus and curriculum roadmap (`/courses/:courseId`).
4. Click **Enroll Now**:
   - Enrollment registers your student account to the course.
   - Duplicate enrollment is automatically prevented.
   - Initial progress is initialized to 0%.

### 3. Learning & Progress Tracking
1. Navigate to **My Learning** (`/my-learning`) or your **Dashboard** (`/dashboard`) to view your enrolled courses.
2. Click **Continue Learning** to open the lesson workspace (`/learning/:courseId/:lessonId`).
3. Inside the lesson player:
   - Read curriculum content and examine code snippets.
   - Access attached external learning resources in the right-hand panel (PDFs, documentation, GitHub repositories).
   - Navigate between lessons using **Previous** and **Next** buttons.

### 4. Taking Knowledge Check Assessments (Quizzes)
1. When a lesson includes an assessment, the **Knowledge Check Assessment** section appears at the bottom of the lesson.
2. Read each question and select your chosen answer option.
3. Click **Submit Assessment**:
   - The platform evaluates your answers instantly.
   - Your percentage score, passing threshold status (Passed / Needs Review), and question-by-question explanations appear immediately.
   - If passed ($\ge \text{passingScore}$), the lesson progress is automatically updated and saved.
   - You may click **Retake Assessment** anytime to review and improve your mastery.
4. Click **Mark as Complete** to record your completed status and recalculate course progress percentage.

---

## Part 2: Instructor Journey

### 1. Accessing the Instructor Hub
1. Users with the `instructor` role have access to the dedicated **Instructor Hub** (`/instructor/dashboard`).
2. Switch seamlessly between the **Management Sidebar** and the public student portal using the switch button at the bottom of the sidebar.

### 2. Course Creation & Lifecycle Management
1. Navigate to **My Courses** (`/manage/courses`).
2. Click **Create New Course** (`/manage/courses/new`).
3. Fill in course metadata:
   - Title, Description, Category, Difficulty, Duration, and Thumbnail URL.
   - Status: Select **Draft** (hidden from students) or **Published** (visible to students in catalog).
4. Save the course. You are now the designated owner instructor for that course.

### 3. Building Curriculum (Modules & Lessons)
1. In the course management list, click **Modules** (`/manage/courses/:courseId/modules`).
2. Add a new module with an order index and descriptive title (e.g., "Module 1: Foundations").
3. Click **Lessons** inside the module (`/manage/courses/:courseId/modules/:moduleId/lessons`):
   - Add lessons with rich text/markdown content, descriptions, and duration estimates.
   - Reorder lessons using order numbers.

### 4. Attaching Assessment Quizzes
1. In lesson editing or curriculum management, quizzes can be created for any lesson owned by you.
2. Specify:
   - Quiz Title (e.g., "Docker Foundations Quiz").
   - Passing Score threshold (e.g., `75%`).
   - Multiple-choice questions with options and designated `correctOptionIndex`.
   - Explanations for each question to guide students upon completion.
3. Ownership security guarantees that other instructors cannot modify or attach quizzes to your courses.

### 5. Tracking Enrolled Students
1. Navigate to **My Students** (`/instructor/students`).
2. View students enrolled across your authored courses, their progress percentages, and last activity timestamps.
