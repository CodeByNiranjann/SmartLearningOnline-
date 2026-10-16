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
import Lesson from './pages/Lesson';
import MyLearning from './pages/MyLearning';
import Profile from './pages/Profile';
import InternshipProjects from './pages/InternshipProjects';

import CodingChallenges from './pages/CodingChallenges';
import ChallengeDetails from './pages/ChallengeDetails';
import SkillLearning from './pages/SkillLearning';
import SkillAssessment from './pages/SkillAssessment';

// Instructor Management Pages
import MyCourses from './pages/instructor/MyCourses';
import ManageCourse from './pages/instructor/ManageCourse';
import ManageModules from './pages/instructor/ManageModules';
import ManageLessons from './pages/instructor/ManageLessons';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import InstructorStudents from './pages/instructor/InstructorStudents';
import CurriculumManagement from './pages/instructor/CurriculumManagement';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';

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
            </Route>
          </Route>

          {/* Dedicated Instructor Portal Routes */}
          <Route element={<RoleRoute allowedRoles={['instructor']} />}>
            <Route element={<ManagementLayout />}>
              <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
              <Route path="/instructor/modules" element={<CurriculumManagement initialTab="modules" />} />
              <Route path="/instructor/lessons" element={<CurriculumManagement initialTab="lessons" />} />
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
            </Route>
          </Route>

          {/* ─── Student Layout with Top Navbar ─── */}
          <Route element={<StudentLayout />}>
            {/* Public/Browsing Courses */}
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:courseId" element={<CourseDetails />} />
            <Route path="/internship-projects" element={<InternshipProjects />} />
            <Route path="/internship-projects/:projectId" element={<ProjectDetails />} />
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
