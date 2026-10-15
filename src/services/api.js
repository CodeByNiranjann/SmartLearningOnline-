import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token and Session ID to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const sessionId = localStorage.getItem('sessionId');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (sessionId) {
      config.headers['X-Session-ID'] = sessionId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Auth Services
export const registerUser = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const logoutAllSessions = async () => {
  const response = await api.post('/auth/logout-all');
  return response.data;
};

export const fetchUserProfile = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const fetchActiveSessions = async () => {
  const response = await api.get('/auth/sessions');
  return response.data;
};

// Two-Factor Authentication Services
export const verify2FALogin = async (tempToken, code) => {
  const response = await api.post('/auth/login-2fa', { tempToken, code });
  return response.data;
};

export const setup2FA = async () => {
  const response = await api.post('/auth/setup-2fa');
  return response.data;
};

export const enable2FA = async (secret, token) => {
  const response = await api.post('/auth/enable-2fa', { secret, token });
  return response.data;
};

export const disable2FA = async (password = '') => {
  const response = await api.post('/auth/disable-2fa', { password });
  return response.data;
};

export const fetch2FABackupCodesStatus = async () => {
  const response = await api.get('/auth/backup-codes');
  return response.data;
};

// Course Services
export const fetchCourses = async (params = {}) => {
  const response = await api.get('/courses', { params });
  return response.data;
};

export const fetchCourseDetails = async (courseId) => {
  const response = await api.get(`/courses/${courseId}`);
  return response.data;
};

export const fetchCourseModules = async (courseId) => {
  const response = await api.get(`/courses/${courseId}/modules`);
  return response.data;
};

// Student Course Enrollment
export const enrollInCourse = async (courseId) => {
  const response = await api.post(`/courses/${courseId}/enroll`);
  return response.data;
};
export const enrollCourse = enrollInCourse;

export const fetchEnrollmentStatus = async (courseId) => {
  const response = await api.get(`/courses/${courseId}/enrollment-status`);
  return response.data;
};

export const unenrollCourse = async (courseId) => {
  const response = await api.delete(`/courses/${courseId}/enroll`);
  return response.data;
};

// ─── Course CRUD (instructor / admin) ────────────────────────────────────────
export const fetchMyCourses = async (instructorId) => {
  const response = await api.get('/courses', { params: { instructor_id: instructorId } });
  return response.data;
};

export const createCourse = async (courseData) => {
  const response = await api.post('/courses', courseData);
  return response.data;
};

export const updateCourse = async (courseId, courseData) => {
  const response = await api.put(`/courses/${courseId}`, courseData);
  return response.data;
};

export const deleteCourse = async (courseId) => {
  const response = await api.delete(`/courses/${courseId}`);
  return response.data;
};

// ─── Module CRUD (instructor / admin) ─────────────────────────────────────────
export const createModule = async (courseId, moduleData) => {
  const response = await api.post(`/courses/${courseId}/modules`, moduleData);
  return response.data;
};

export const updateModule = async (moduleId, moduleData) => {
  const response = await api.put(`/modules/${moduleId}`, moduleData);
  return response.data;
};

export const deleteModule = async (moduleId) => {
  const response = await api.delete(`/modules/${moduleId}`);
  return response.data;
};

// ─── Lesson CRUD (instructor / admin) ─────────────────────────────────────────
export const createLesson = async (moduleId, lessonData) => {
  const response = await api.post(`/modules/${moduleId}/lessons`, lessonData);
  return response.data;
};

export const updateLesson = async (lessonId, lessonData) => {
  const response = await api.put(`/lessons/${lessonId}`, lessonData);
  return response.data;
};

export const deleteLesson = async (lessonId) => {
  const response = await api.delete(`/lessons/${lessonId}`);
  return response.data;
};

// Lesson & Resource Services
export const fetchLessonDetails = async (lessonId) => {
  const response = await api.get(`/lessons/${lessonId}`);
  return response.data;
};

export const fetchLessonResources = async (lessonId) => {
  const response = await api.get(`/lessons/${lessonId}/resources`);
  return response.data;
};

export const uploadLessonResources = async (lessonId, formData, onUploadProgress) => {
  const response = await api.post(`/lessons/${lessonId}/resources`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
  return response.data;
};

export const fetchResourceDetails = async (resourceId) => {
  const response = await api.get(`/resources/${resourceId}`);
  return response.data;
};

export const updateResourceMetadata = async (resourceId, metadata) => {
  const response = await api.patch(`/resources/${resourceId}`, metadata);
  return response.data;
};

export const replaceResourceFile = async (resourceId, formData, onUploadProgress) => {
  const response = await api.put(`/resources/${resourceId}/file`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
  return response.data;
};

export const deleteResource = async (resourceId) => {
  const response = await api.delete(`/resources/${resourceId}`);
  return response.data;
};

export const getResourceDownloadUrl = (resourceId) => {
  const baseURL = api.defaults.baseURL || 'http://localhost:5000/api';
  return `${baseURL}/resources/${resourceId}/download`;
};

export const getResourcePreviewUrl = (resourceId) => {
  const baseURL = api.defaults.baseURL || 'http://localhost:5000/api';
  return `${baseURL}/resources/${resourceId}/preview`;
};

// Progress Services
export const fetchStudentProgress = async () => {
  const response = await api.get('/progress');
  return response.data;
};

export const fetchCourseProgress = async (courseId) => {
  const response = await api.get(`/progress/${courseId}`);
  return response.data;
};

export const completeLesson = async (courseId, lessonId) => {
  const response = await api.post('/progress/complete-lesson', { courseId, lessonId });
  return response.data;
};

export const completeModule = async (courseId, moduleId) => {
  const response = await api.post('/progress/complete-module', { courseId, moduleId });
  return response.data;
};

export const updatePlaybackProgress = async ({ courseId, lessonId, playedSeconds, durationSeconds, completed }) => {
  const response = await api.post('/progress/playback', {
    courseId,
    lessonId,
    playedSeconds,
    durationSeconds,
    completed,
  });
  return response.data;
};

export const fetchLearningCalendar = async (params = {}) => {
  const response = await api.get('/progress/calendar', { params });
  return response.data;
};

export const logStudyTime = async ({ courseId, minutes = 1 }) => {
  const response = await api.post('/progress/log-study-time', { courseId, minutes });
  return response.data;
};

export const seedCalendarActivity = async () => {
  const response = await api.post('/progress/seed-calendar');
  return response.data;
};

// ─── Admin Services ──────────────────────────────────────────────────────────
export const fetchAdminStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};

export const fetchAdminUsers = async (params = {}) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

export const createInstructor = async (instructorData) => {
  const response = await api.post('/admin/instructors', instructorData);
  return response.data;
};

export const updateUserRole = async (userId, role) => {
  const response = await api.put(`/admin/users/${userId}/role`, { role });
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

export const fetchAdminReports = async () => {
  const response = await api.get('/admin/reports');
  return response.data;
};

// ─── Instructor Services ─────────────────────────────────────────────────────
export const fetchInstructorStats = async () => {
  const response = await api.get('/instructor/stats');
  return response.data;
};

export const fetchInstructorStudents = async () => {
  const response = await api.get('/instructor/students');
  return response.data;
};

export const fetchInstructorReports = async () => {
  const response = await api.get('/instructor/reports');
  return response.data;
};

// ─── Cross-Course Modules & Lessons ──────────────────────────────────────────
export const fetchAllModules = async () => {
  const response = await api.get('/modules');
  return response.data;
};

export const fetchAllLessons = async () => {
  const response = await api.get('/lessons');
  return response.data;
};

export default api;

