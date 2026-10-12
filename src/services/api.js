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

// Lesson & Resource Services
export const fetchLessonDetails = async (lessonId) => {
  const response = await api.get(`/lessons/${lessonId}`);
  return response.data;
};

export const fetchLessonResources = async (lessonId) => {
  const response = await api.get(`/lessons/${lessonId}/resources`);
  return response.data;
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

export default api;
