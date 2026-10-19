import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import StudentLayout from './layouts/StudentLayout';
import ManagementLayout from './layouts/ManagementLayout';

// Public / Student Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Verify2FA from './pages/Verify2FA';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Lesson from './pages/Lesson';
import MyLearning from './pages/MyLearning';
import Profile from './pages/Profile';
import InternshipProjects from './pages/InternshipProjects';
import ProjectDetails from './pages/ProjectDetails';
import InternshipProjectDetails from './pages/InternshipProjectDetails';

import CodingChallenges from './pages/CodingChallenges';
import ChallengeDetails from './pages/ChallengeDetails';
import SkillLearning from './pages/SkillLearning';
import SkillAssessment from './pages/SkillAssessment';
import StudentQuizzes from './pages/student/StudentQuizzes';
import TakeQuiz from './pages/student/TakeQuiz';
import StudentTasks from './pages/student/StudentTasks';
import StudentAchievements from './pages/student/StudentAchievements';

// Instructor Management Pages
import MyCourses from './pages/instructor/MyCourses';
import ManageCourse from './pages/instructor/ManageCourse';
import ManageModules from './pages/instructor/ManageModules';
import ManageLessons from './pages/instructor/ManageLessons';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import InstructorStudents from './pages/instructor/InstructorStudents';
import CurriculumManagement from './pages/instructor/CurriculumManagement';
import InstructorQuizzes from './pages/instructor/InstructorQuizzes';
import InstructorTasks from './pages/instructor/InstructorTasks';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';

// Practical Exercises Pages (Sprint 2)
import PracticalExercises from './pages/PracticalExercises';
import ExerciseDetails from './pages/ExerciseDetails';

// Project-Based Activities Pages (SLP-7)
import ManageActivities from './pages/instructor/ManageActivities';
import EditActivity from './pages/instructor/EditActivity';
import ActivityReview from './pages/instructor/ActivityReview';
import Activities from './pages/Activities';
import ActivityDetails from './pages/ActivityDetails';
import ActivityWorkspace from './pages/ActivityWorkspace';
import ManageExercises from './pages/instructor/ManageExercises';
import EditExercise from './pages/instructor/EditExercise';
import ExerciseSubmissions from './pages/instructor/ExerciseSubmissions';

// Real-World Projects Management Pages (SLP-6)
import ManageProjects from './pages/instructor/ManageProjects';
import EditProject from './pages/instructor/EditProject';
import ProjectReview from './pages/instructor/ProjectReview';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-2fa" element={<Verify2FA />} />

          {/* ─── Role-Based Management Layout (Admin & Instructor) ─── */}
          {/* Dedicated Admin Portal Routes */}
          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route element={<ManagementLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/instructors" element={<AdminUsers defaultRoleFilter="instructor" />} />
              <Route path="/admin/curriculum" element={<CurriculumManagement />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
            </Route>
          </Route>

          {/* Dedicated Instructor Portal Routes */}
          <Route element={<RoleRoute allowedRoles={['instructor', 'admin']} />}>
            <Route element={<ManagementLayout />}>
              <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
              <Route path="/instructor/modules" element={<CurriculumManagement initialTab="modules" />} />
              <Route path="/instructor/lessons" element={<CurriculumManagement initialTab="lessons" />} />
              <Route path="/instructor/quizzes" element={<InstructorQuizzes />} />
              <Route path="/instructor/tasks" element={<InstructorTasks />} />
              <Route path="/instructor/students" element={<InstructorStudents />} />
              <Route path="/instructor/reports" element={<AdminReports />} />
            </Route>
          </Route>

          {/* Shared Course Management Portal (Instructor & Admin) */}
          <Route element={<RoleRoute allowedRoles={['instructor', 'admin']} />}>
            <Route element={<ManagementLayout />}>
              <Route path="/manage/courses" element={<MyCourses />} />
              <Route path="/manage/courses/new" element={<ManageCourse />} />
              <Route path="/manage/courses/:courseId/edit" element={<ManageCourse />} />
              <Route path="/manage/courses/:courseId/modules" element={<ManageModules />} />
              <Route path="/manage/courses/:courseId/modules/:moduleId/lessons" element={<ManageLessons />} />
              <Route path="/manage/exercises" element={<ManageExercises />} />
              <Route path="/manage/exercises/new" element={<EditExercise />} />
              <Route path="/manage/exercises/:exerciseId/edit" element={<EditExercise />} />
              <Route path="/manage/exercises/:exerciseId/submissions" element={<ExerciseSubmissions />} />
              <Route path="/manage/projects" element={<ManageProjects />} />
              <Route path="/manage/projects/new" element={<EditProject />} />
              <Route path="/manage/projects/:projectId/edit" element={<EditProject />} />
              <Route path="/manage/projects/:projectId/submissions" element={<ProjectReview />} />
              <Route path="/manage/activities" element={<ManageActivities />} />
              <Route path="/manage/activities/new" element={<EditActivity />} />
              <Route path="/manage/activities/:activityId/edit" element={<EditActivity />} />
              <Route path="/manage/activities/:activityId/submissions" element={<ActivityReview />} />
              <Route path="/manage/activities/:activityId/assignments" element={<ActivityReview />} />
            </Route>
          </Route>

          {/* ─── Student Layout with Top Navbar ─── */}
          <Route element={<StudentLayout />}>
            {/* Public/Browsing Courses, Real-World Projects (SLP-6), and Practical Exercises */}
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:courseId" element={<CourseDetails />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/activities/:activityId" element={<ActivityDetails />} />
            <Route path="/activities/:activityId/workspace" element={<ActivityWorkspace />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:projectId" element={<ProjectDetails />} />
            <Route path="/exercises" element={<PracticalExercises />} />
            <Route path="/exercises/:exerciseId" element={<ExerciseDetails />} />
            <Route path="/internship-projects" element={<InternshipProjects />} />
            <Route path="/internship-projects/:projectId" element={<InternshipProjectDetails />} />
            <Route path="/coding-challenges" element={<CodingChallenges />} />
            <Route path="/coding-challenges/:id" element={<ChallengeDetails />} />

            {/* Protected Student Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/skill-learning" element={<SkillLearning />} />
              <Route path="/skill-assessment" element={<SkillAssessment />} />
              <Route path="/my-learning" element={<MyLearning />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/learning/:courseId/:lessonId" element={<Lesson />} />
              <Route path="/student/quizzes" element={<StudentQuizzes />} />
              <Route path="/student/quizzes/:quizId" element={<TakeQuiz />} />
              <Route path="/student/tasks" element={<StudentTasks />} />
              <Route path="/student/achievements" element={<StudentAchievements />} />
            </Route>

            {/* Default Route Redirection */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
