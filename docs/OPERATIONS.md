# Platform Operations & Support Runbook

This document details prerequisites, local environment setup, operational maintenance, troubleshooting procedures, and data assumptions for the Smart Learning Platform.

---

## 1. System Requirements & Prerequisites

| Component | Minimum Version | Recommended | Notes |
| :--- | :---: | :---: | :--- |
| **Node.js** | `v20.0.0+` | `v20.x` or `v22.x` | Native ES Modules enabled. |
| **npm** | `v9.0.0+` | `v10.x` | Bundled with Node.js. |
| **MongoDB** | `v6.0+` | `v7.0+` | Local mongod service or MongoDB Atlas cluster. |
| **Memory / CPU** | 2 GB RAM / 1 Core | 4 GB RAM / 2 Cores | Suitable for small to mid-tier workloads. |

---

## 2. Local Setup Guide (Step-by-Step)

### Step 1: Clone and Navigate
```bash
cd D:/Agile/Desi/SmartLearningOnline-
git checkout balee
```

### Step 2: Install Dependencies
```bash
# Install frontend client dependencies
npm install

# Install backend server dependencies
npm --prefix server install
```

### Step 3: Configure Environment Variables
1. **Server Configuration:**
   Copy `server/.env.example` to `server/.env`:
   ```bash
   cp server/.env.example server/.env
   ```
   Ensure `PORT=5000`, `MONGO_URI=mongodb://127.0.0.1:27017/online-learning`, and `JWT_SECRET` are set.

2. **Client Configuration:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Ensure `VITE_API_URL=http://localhost:5000/api`.

### Step 4: Seed Initial Data
Populate the database with sample courses, modules, lessons, instructors, and administrator accounts:
```bash
cd server
npm run seed
cd ..
```
*Default Seeded Accounts:*
- **Admin:** `admin@learnhub.com` / `admin123`
- **Instructor:** `instructor@learnhub.com` / `instructor123`
- **Student:** `student@example.com` / `student123`

### Step 5: Start Development Servers
Open two terminal windows:

- **Terminal 1 (Backend API on Port 5000):**
  ```bash
  cd server
  npm start
  ```
- **Terminal 2 (Frontend Client on Port 5173):**
  ```bash
  npm run dev
  ```
Access the application at `http://localhost:5173`.

---

## 3. Running Verification & Test Suites

The platform includes two automated test suites:

### 3.1 Integration Test Suite (API, Auth, RBAC, Enrollment, Quizzes)
```bash
npm --prefix server test
```
*Executes 37 automated assertions covering authentication, active multi-device sessions, ownership boundary enforcement, progress calculation, and automated quiz scoring.*

### 3.2 End-to-End Critical Journeys Validation
```bash
npm --prefix server run test:e2e
```
*Validates the full lifecycle for Learner discovery/enrollment/quiz completion, Instructor authoring, and Admin governance.*

### 3.3 Production Frontend Compilation
```bash
npm run build
```
*Builds the optimized production client bundle in `./dist`.*

---

## 4. Operational Support & Troubleshooting

### Issue 1: "Session expired or invalidated. Please login again."
- **Root Cause:** The `X-Session-ID` passed by the client is no longer marked `isValid: true` in the `sessions` collection, or has timed out.
- **Resolution:**
  1. The student can log in again to generate a new active session.
  2. If the user is locked out, check their active sessions in MongoDB:
     ```javascript
     db.sessions.find({ userId: ObjectId("...") })
     ```

### Issue 2: Student Locked Out from Two-Factor Authentication (2FA)
- **Root Cause:** Student lost their authenticator app or phone.
- **Resolution:**
  An administrator can disable 2FA for the user account:
  ```javascript
  db.users.updateOne(
    { email: "student@example.com" },
    { $set: { isTwoFactorEnabled: false, twoFactorSecret: "" } }
  )
  ```

### Issue 3: "MongoDB Connection Error: connect ECONNREFUSED 127.0.0.1:27017"
- **Root Cause:** Local MongoDB daemon is not running.
- **Resolution:**
  - On Windows: Start MongoDB service via Services (`services.msc` -> MongoDB Server) or run `mongod --dbpath <data-dir>`.
  - On Linux/macOS: `sudo systemctl start mongod`.

### Issue 4: CORS Errors in Browser Console
- **Root Cause:** `CLIENT_URL` in `server/.env` does not match the origin in the browser address bar.
- **Resolution:** Update `CLIENT_URL` in `server/.env` to match the exact protocol and port (e.g. `http://localhost:5173`), then restart the backend server.

---

## 5. Data Assumptions & Business Logic Rules

1. **Course Status Hierarchy:**
   - A course marked `draft` is strictly hidden from learners and the public catalog.
   - Only courses marked `published` can be enrolled in by students.
2. **Curriculum Ownership:**
   - Every course has a designated `instructorId`.
   - Instructors can only create, edit, or delete modules, lessons, and quizzes attached to courses where `course.instructorId == user._id`.
   - System administrators (`role: 'admin'`) can edit or delete curriculum across all instructors.
3. **Duplicate Enrollment:**
   - A student can only have one active enrollment record per course.
   - Re-attempting enrollment returns a `400 Bad Request` with `isEnrolled: true`.
4. **Quiz Assessment Passing Threshold:**
   - Quizzes default to a passing score of `70%` unless specified otherwise by the instructor.
   - When a student achieves $\ge \text{passingScore}$, `passed: true` is returned and completion is unlocked.
