# Smart Learning Platform — REST API Specification

All protected endpoints require the following headers:
- `Authorization: Bearer <JWT_TOKEN>`
- `X-Session-ID: <SESSION_UUID>`

Base URL: `http://localhost:5000/api`

---

## 1. Authentication & Session Endpoints (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | Public | Register new student (`name`, `email`, `password`). Returns JWT & `sessionId`. |
| `POST` | `/api/auth/login` | Public | Authenticate with email & password. Returns JWT & `sessionId` (or `requires2FA: true`). |
| `POST` | `/api/auth/verify-2fa` | Public | Verify 6-digit TOTP token using `tempToken`. Returns full JWT & `sessionId`. |
| `GET` | `/api/auth/me` | Protected | Returns current authenticated user and session metadata. |
| `GET` | `/api/auth/sessions` | Protected | Returns list of all active multi-device sessions for current user. |
| `POST` | `/api/auth/logout` | Protected | Invalidates current session ID in database. |
| `POST` | `/api/auth/logout-all` | Protected | Invalidates all active sessions for current user. |
| `POST` | `/api/auth/2fa/generate` | Protected | Generates new 2FA secret and QR code data URL. |
| `POST` | `/api/auth/2fa/verify` | Protected | Validates token and activates 2FA on account. |
| `POST` | `/api/auth/2fa/disable` | Protected | Disables 2FA on account. |

---

## 2. Course Endpoints (`/api/courses`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/courses` | Public | Get all published courses (supports `?search=`, `?category=`, `?difficulty=`, `?instructor_id=`). |
| `GET` | `/api/courses/:id` | Public | Get course details and aggregate module/lesson counts. |
| `GET` | `/api/courses/:id/modules` | Public | Get hierarchical curriculum (modules with nested lessons). |
| `POST` | `/api/courses` | Instructor / Admin | Create a new course (`title`, `description`, `category`, `difficulty`, `duration`, `thumbnail`, `status`). |
| `PUT` | `/api/courses/:id` | Owner / Admin | Update course metadata (requires ownership for instructors). |
| `DELETE` | `/api/courses/:id` | Owner / Admin | Delete course and associated modules/lessons/quizzes. |
| `GET` | `/api/courses/:id/enrollment-status`| Protected | Check if logged-in learner is enrolled. |
| `POST` | `/api/courses/:id/enroll` | Protected | Enroll student in published course (duplicate enrollment rejected with 400). |
| `DELETE` | `/api/courses/:id/enroll` | Protected | Unenroll / drop course. |

---

## 3. Module & Lesson Endpoints (`/api/modules`, `/api/lessons`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/courses/:courseId/modules` | Owner / Admin | Create a module within a course. |
| `PUT` | `/api/modules/:id` | Owner / Admin | Update module title, order, or description. |
| `DELETE` | `/api/modules/:id` | Owner / Admin | Delete module and contained lessons. |
| `GET` | `/api/lessons/:lessonId` | Public | Fetch lesson details with `prevLessonId` and `nextLessonId` navigation. |
| `GET` | `/api/lessons/:lessonId/resources` | Public | Get external learning resources (PDFs, repositories, docs). |
| `POST` | `/api/modules/:moduleId/lessons` | Owner / Admin | Create a lesson within a module. |
| `PUT` | `/api/lessons/:id` | Owner / Admin | Update lesson content, title, or order. |
| `DELETE` | `/api/lessons/:id` | Owner / Admin | Delete lesson. |

---

## 4. Assessment & Quiz Endpoints (`/api/quizzes`) (SLP-17)

| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/quizzes/lesson/:lessonId` | Optional Auth | Get quiz for lesson. For learners, answers/explanations are sanitized. For owner/admin, full quiz is returned. |
| `POST` | `/api/quizzes` | Owner / Admin | Create assessment quiz (`lessonId`, `courseId`, `title`, `passingScore`, `questions`). Enforces course ownership. |
| `PUT` | `/api/quizzes/:id` | Owner / Admin | Update quiz title, passingScore, or questions. |
| `DELETE` | `/api/quizzes/:id` | Owner / Admin | Delete quiz. |
| `POST` | `/api/quizzes/:id/submit` | Protected | Submit answers: `{ answers: [{ questionId, selectedOptionIndex }] }`. Returns score %, pass/fail, and detailed feedback. |

---

## 5. Progress Tracking Endpoints (`/api/progress`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/progress` | Protected | Get overall progress summary across all started and completed courses. |
| `GET` | `/api/progress/:courseId` | Protected | Get progress and completed lessons array for a specific course. |
| `POST` | `/api/progress/complete-lesson` | Protected | Mark lesson as complete: `{ courseId, lessonId }`. Updates dynamic progress percentage. |

---

## 6. Admin Endpoints (`/api/admin`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/admin/stats` | Admin | Get platform metrics (total users, courses, enrollments). |
| `GET` | `/api/admin/users` | Admin | Paginated/filtered user list. |
| `PUT` | `/api/admin/users/:id/role` | Admin | Update user role (`student`, `instructor`, `admin`). |
| `DELETE` | `/api/admin/users/:id` | Admin | Delete user account and revoke sessions. |
| `GET` | `/api/admin/reports` | Admin | Aggregated completion rates and activity reports. |

---

## 7. System Health Endpoint

| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/health` | Public | Returns `{ status: "healthy", uptime: <seconds>, timestamp: <iso> }`. |

---

## 8. Real-World Projects Endpoints (`/api/projects`) (SLP-6)

| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/projects` | Public / Optional Auth | List real-world capstone projects (supports `?difficulty=`, `?category=`, `?courseId=`, `?search=`). Attaches student submission status if logged in. |
| `GET` | `/api/projects/:id` | Public / Optional Auth | Get comprehensive project brief, deliverables checklist, starter templates, and evaluation rubric. |
| `GET` | `/api/projects/course/:courseId` | Public / Optional Auth | Get practical real-world projects associated with a specific course curriculum. |
| `POST` | `/api/projects/:id/submit` | Protected | Submit or update project solution: `{ githubUrl, liveDemoUrl, notes }`. Validates URL formats. |
| `GET` | `/api/projects/:id/my-submission` | Protected | Retrieve authenticated student's submission, status, grade, and instructor evaluation feedback. |
| `POST` | `/api/projects` | Instructor / Admin | Create a new practical project with deliverables, tech stack, and evaluation rubric. |
| `PUT` | `/api/projects/:id` | Owner / Admin | Update project specifications or rubric criteria. |
| `DELETE` | `/api/projects/:id` | Owner / Admin | Delete project and associated student submissions. |
| `GET` | `/api/projects/:id/submissions` | Instructor / Admin | List all student submissions for a project. |
| `PUT` | `/api/projects/:id/submissions/:submissionId/grade` | Instructor / Admin | Grade student submission with score (0-100), rubric points breakdown, and feedback. |

---

## 9. Practical Exercises Endpoints (`/api/exercises`) (Sprint 2)

| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/exercises` | Public / Optional Auth | List published exercises (or Draft/Published for managers) with filters (`?courseId=`, `?moduleId=`, `?lessonId=`, `?difficulty=`, `?exerciseType=`, `?search=`, `?status=`). Attaches learner submission status. |
| `GET` | `/api/exercises/:exerciseId` | Public / Optional Auth | Get exercise details and instructions. Draft exercises viewable only by course owner or admin. Attaches learner submission and attempt history. |
| `POST` | `/api/courses/:courseId/exercises` | Owner / Admin | Create a practical exercise (`title`, `description`, `instructions`, `exerciseType`, `difficulty`, `estimatedMinutes`, `maximumMarks`, `passingMarks`, `dueDate`, `referenceMaterials`, `status`, `starterCode`). Validates course ownership and verifies selected module and lesson belong strictly to the course. |
| `PUT` | `/api/exercises/:exerciseId` | Owner / Admin | Update practical exercise metadata, instructions, or publishing status. Enforces course ownership and module/lesson hierarchy integrity. |
| `DELETE` | `/api/exercises/:exerciseId` | Owner / Admin | Delete exercise, all student submissions, and uploaded files from storage. |
| `POST` | `/api/exercises/:exerciseId/submissions` | Enrolled Learner | Submit exercise solution via `multipart/form-data` or JSON. Supports `textAnswer`, source code, and safe file uploads (`file`, max 10MB, extension allowlist). Supports saving drafts (`submissionStatus: "In Progress"`). Snapshots previous attempts to `history` array on resubmission. Requires active course enrollment. |
| `GET` | `/api/exercises/:exerciseId/submissions/me` | Enrolled Learner | Retrieve authenticated learner's submission, current status, marks, feedback, and full attempt history audit trail. |
| `GET` | `/api/exercises/:exerciseId/submissions` | Owner / Admin | List all learner submissions for an exercise with student metadata and attempt counts. |
| `PATCH` | `/api/submissions/:submissionId/review` | Owner / Admin | Review and grade submission (`marksAwarded`, `reviewerFeedback`, `submissionStatus: "Accepted"` or `"Needs Revision"`). Validates `0 <= marksAwarded <= maximumMarks`. |
| `GET` | `/api/submissions/:submissionId/file` | Learner / Owner / Admin | Stream/download uploaded submission file. Prevents unauthorized file access and path traversal. |


