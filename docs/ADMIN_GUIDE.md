# System Administrator Guide

This guide covers administrative operations, user directory management, curriculum moderation, and reporting tasks on the Smart Learning Platform.

---

## 1. Accessing the Admin Console
- **Route:** `/admin/dashboard`
- **Role Requirement:** `admin` (enforced via `RoleRoute` in frontend and `requireRole('admin')` in backend API).
- Users with the `admin` role have platform-wide superuser access across all courses, modules, lessons, quizzes, and user accounts.

---

## 2. User Directory & Role Management
- **Route:** `/admin/users`

### 2.1 Viewing Users
- Search users by name or email.
- Filter users by role: `student`, `instructor`, or `admin`.
- View user details including registered date, active 2FA status, and enrolled courses count.

### 2.2 Promoting or Demoting Users
1. Locate the user in the directory.
2. In the **Role** column, click the dropdown or role badge.
3. Select the target role:
   - `student`: Standard learner account.
   - `instructor`: Enables course authoring, curriculum building, and instructor dashboard access.
   - `admin`: Grants platform-wide administrative privileges.
4. Confirmation dialog executes `PUT /api/admin/users/:userId/role`.

### 2.3 Deleting Users
1. Click the trash icon next to any non-admin account.
2. Confirm account deletion. All active sessions for that user will be revoked immediately.

---

## 3. Platform-Wide Curriculum Moderation
- **Route:** `/admin/curriculum` and `/manage/courses`

### 3.1 Course Moderation
- Admins can view **all courses** across all instructors, including drafts.
- Change status from `draft` to `published` or unpublish courses violating quality standards.
- Edit course titles, descriptions, categories, or delete inactive courses.

### 3.2 Module & Lesson Oversight
- Admins can edit or delete modules and lessons across any course without ownership restrictions.
- Reassign course modules or reorder curriculum trees.

---

## 4. Reports & Platform Analytics
- **Route:** `/admin/reports`
- Key platform metrics available:
  - **Total Registered Students:** Count of active learners.
  - **Active Instructors:** Count of faculty members.
  - **Total Courses Published vs Draft:** Content catalog breakdown.
  - **Enrollment Activity:** Cumulative and 30-day enrollment volume.
  - **Completion Rate:** Percentage of enrolled students who complete 100% of course lessons.

---

## 5. System Settings
- **Route:** `/admin/settings`
- Configure platform name, support email, default passing score thresholds, and maintenance mode toggles.
