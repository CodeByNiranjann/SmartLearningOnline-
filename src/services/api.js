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

// ─── Enrollment-Scoped Lesson Progress Services (SLP-10) ─────────────────────
export const fetchLessonProgress = async (enrollmentId, lessonId) => {
  const response = await api.get(`/enrollments/${enrollmentId}/lessons/${lessonId}/progress`);
  return response.data;
};

export const updateLessonProgress = async (enrollmentId, lessonId, progressData) => {
  const response = await api.put(`/enrollments/${enrollmentId}/lessons/${lessonId}/progress`, progressData);
  return response.data;
};

export const markLessonComplete = async (enrollmentId, lessonId) => {
  const response = await api.post(`/enrollments/${enrollmentId}/lessons/${lessonId}/complete`);
  return response.data;
};

export const fetchEnrollmentProgress = async (enrollmentId) => {
  const response = await api.get(`/enrollments/${enrollmentId}/progress`);
  return response.data;
};

export const fetchCourseEnrollment = async (courseId) => {
  const response = await api.get(`/enrollments/course/${courseId}`);
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

// ─── Quiz & Assessment Services (SLP-17) ────────────────────────────────────
export const fetchLessonQuiz = async (lessonId) => {
  try {
    const response = await api.get(`/quizzes/lesson/${lessonId}`);
    return response.data.quiz;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

export const fetchQuizzes = async (params = {}) => {
  const response = await api.get('/quizzes', { params });
  return response.data;
};

export const fetchQuizById = async (id) => {
  const response = await api.get(`/quizzes/${id}`);
  return response.data;
};

export const createQuiz = async (quizData) => {
  const response = await api.post('/quizzes', quizData);
  return response.data;
};

export const updateQuiz = async (quizId, quizData) => {
  const response = await api.put(`/quizzes/${quizId}`, quizData);
  return response.data;
};

export const deleteQuiz = async (quizId) => {
  const response = await api.delete(`/quizzes/${quizId}`);
  return response.data;
};

export const submitQuiz = async (quizId, answers) => {
  const response = await api.post(`/quizzes/${quizId}/submit`, { answers });
  return response.data;
};

// ─── Real-World Projects Services (SLP-6) ──────────────────────────────────
export const fetchProjects = async (params = {}) => {
  const response = await api.get('/projects', { params });
  return response.data;
};

export const fetchProjectById = async (projectId) => {
  const response = await api.get(`/projects/${projectId}`);
  return response.data;
};

export const fetchCourseProjects = async (courseId) => {
  const response = await api.get(`/projects/course/${courseId}`);
  return response.data;
};

export const submitProjectSolution = async (projectId, { githubUrl, liveDemoUrl, notes }) => {
  const response = await api.post(`/projects/${projectId}/submit`, {
    githubUrl,
    liveDemoUrl,
    notes,
  });
  return response.data;
};

export const fetchMyProjectSubmission = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/my-submission`);
  return response.data;
};

export const createProject = async (projectData) => {
  const response = await api.post('/projects', projectData);
  return response.data;
};

export const updateProject = async (projectId, projectData) => {
  const response = await api.put(`/projects/${projectId}`, projectData);
  return response.data;
};

export const deleteProject = async (projectId) => {
  const response = await api.delete(`/projects/${projectId}`);
  return response.data;
};

export const fetchProjectSubmissions = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/submissions`);
  return response.data;
};

export const gradeProjectSubmission = async (projectId, submissionId, gradeData) => {
  const response = await api.put(`/projects/${projectId}/submissions/${submissionId}/grade`, gradeData);
  return response.data;
};

// ─── Real-World Projects Services (SLP-6) ──────────────────────────────────
export const enrollInProject = async (projectId) => {
  const response = await api.post(`/projects/${projectId}/enroll`);
  return response.data;
};

export const leaveProject = async (projectId) => {
  const response = await api.delete(`/projects/${projectId}/enroll`);
  return response.data;
};
export const fetchStudentQuizzes = async (params = {}) => {
  const response = await api.get('/quizzes/student', { params });
  return response.data;
};

export const fetchStudentQuizDetails = async (id) => {
  const response = await api.get(`/quizzes/${id}/details`);
  return response.data;
};

export const startQuizAttempt = async (id) => {
  const response = await api.post(`/quizzes/${id}/attempts/start`);
  return response.data;
};

export const submitQuizAttempt = async (attemptId, answers) => {
  const response = await api.post(`/attempts/${attemptId}/submit`, { answers });
  return response.data;
};

export const fetchAttemptResult = async (attemptId) => {
  const response = await api.get(`/attempts/${attemptId}`);
  return response.data;
};

export const fetchQuizAttempts = async (quizId) => {
  const response = await api.get(`/quizzes/${quizId}/attempts`);
  return response.data;
};

// ─── Internship Project Services (SLP-15) ────────────────────────────────────
export const fetchInternshipProjects = async (params = {}) => {
  const response = await api.get('/internship-projects', { params });
  return response.data;
};

export const fetchRecommendedProjects = async () => {
  const response = await api.get('/internship-projects/recommended');
  return response.data;
};

export const fetchProjectDetails = async (projectId) => {
  const response = await api.get(`/internship-projects/${projectId}`);
  return response.data;
};

export const startProject = async (projectId) => {
  const response = await api.post(`/internship-projects/${projectId}/start`);
  return response.data;
};

export const updateProjectProgress = async (projectId, progressData) => {
  const response = await api.put(`/internship-projects/${projectId}/progress`, progressData);
  return response.data;
};

export const fetchMyProjects = async () => {
  const response = await api.get('/projects/my');
  return response.data;
};

export const fetchProjectMilestones = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/milestones`);
  return response.data;
};

export const createProjectMilestone = async (projectId, milestoneData) => {
  const response = await api.post(`/projects/${projectId}/milestones`, milestoneData);
  return response.data;
};

export const updateProjectMilestone = async (projectId, milestoneId, milestoneData) => {
  const response = await api.put(`/projects/${projectId}/milestones/${milestoneId}`, milestoneData);
  return response.data;
};

export const deleteProjectMilestone = async (projectId, milestoneId) => {
  const response = await api.delete(`/projects/${projectId}/milestones/${milestoneId}`);
  return response.data;
};

export const updateMilestoneProgress = async (enrollmentId, milestoneId, status) => {
  const response = await api.put(`/project-enrollments/${enrollmentId}/milestones/${milestoneId}`, { status });
  return response.data;
};

export const submitProjectDeliverables = async (enrollmentId, data, onUploadProgress) => {
  const isForm = data instanceof FormData;
  const config = isForm
    ? {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      }
    : {};
  const response = await api.post(`/project-enrollments/${enrollmentId}/submissions`, data, config);
  return response.data;
};

export const fetchProjectEnrollmentSubmissions = async (enrollmentId) => {
  const response = await api.get(`/project-enrollments/${enrollmentId}/submissions`);
  return response.data;
};

export const reviewProjectSubmission = async (submissionId, reviewData) => {
  const response = await api.patch(`/project-submissions/${submissionId}/review`, reviewData);
  return response.data;
};

export const fetchProjectParticipants = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/participants`);
  return response.data;
};

export const getProjectSubmissionDownloadUrl = (submissionId) => {
  const baseURL = api.defaults.baseURL || 'http://localhost:5000/api';
  return `${baseURL}/project-submissions/${submissionId}/download`;
};

// ─── Practical Exercises Services (Sprint 2) ───────────────────────────────
export const fetchExercises = async (params = {}) => {
  const response = await api.get('/exercises', { params });
  return response.data;
};

export const fetchExerciseById = async (exerciseId) => {
  const response = await api.get(`/exercises/${exerciseId}`);
  return response.data;
};

export const fetchCourseExercises = async (courseId) => {
  const response = await api.get(`/exercises`, { params: { courseId } });
  return response.data;
};

export const fetchLessonExercises = async (lessonId) => {
  const response = await api.get(`/exercises`, { params: { lessonId } });
  return response.data;
};

export const createExercise = async (courseId, exerciseData) => {
  const response = await api.post(`/courses/${courseId}/exercises`, exerciseData);
  return response.data;
};

export const updateExercise = async (exerciseId, exerciseData) => {
  const response = await api.put(`/exercises/${exerciseId}`, exerciseData);
  return response.data;
};

export const deleteExercise = async (exerciseId) => {
  const response = await api.delete(`/exercises/${exerciseId}`);
  return response.data;
};

export const submitExercise = async (exerciseId, data, onUploadProgress) => {
  const isForm = data instanceof FormData;
  const config = isForm
    ? {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      }
    : {};
  const response = await api.post(`/exercises/${exerciseId}/submissions`, data, config);
  return response.data;
};

export const fetchMyExerciseSubmission = async (exerciseId) => {
  const response = await api.get(`/exercises/${exerciseId}/submissions/me`);
  return response.data;
};

export const fetchExerciseSubmissions = async (exerciseId) => {
  const response = await api.get(`/exercises/${exerciseId}/submissions`);
  return response.data;
};

export const reviewExerciseSubmission = async (submissionId, reviewData) => {
  const response = await api.patch(`/submissions/${submissionId}/review`, reviewData);
  return response.data;
};

export const getExerciseSubmissionFileUrl = (submissionId) => {
  const baseURL = api.defaults.baseURL || 'http://localhost:5000/api';
  return `${baseURL}/submissions/${submissionId}/file`;
};

export const getExerciseAttachmentUrl = (exerciseId) => {
  const baseURL = api.defaults.baseURL || 'http://localhost:5000/api';
  return `${baseURL}/exercises/${exerciseId}/attachment`;
};

export const fetchProjectCategories = async () => {
  try {
    const response = await api.get('/internship-projects/meta/categories');
    return response.data;
  } catch (err) {
    return { categories: [], skills: [] };
  }
};

// ─── Coding Challenge Services (SLP-16) ───────────
export const fetchCodingChallenges = async (params = {}) => {
  const response = await api.get('/coding-challenges', { params });
  return response.data;
};

export const fetchRecommendedChallenges = async () => {
  const response = await api.get('/coding-challenges/recommended');
  return response.data;
};

export const fetchCodingStats = async () => {
  const response = await api.get('/coding-challenges/user-stats');
  return response.data;
};

export const fetchChallengeDetails = async (id) => {
  const response = await api.get(`/coding-challenges/${id}`);
  return response.data;
};

export const submitChallengeCode = async (id, data) => {
  const response = await api.post(`/coding-challenges/${id}/submit`, data);
  return response.data;
};

export const fetchChallengeSolution = async (id) => {
  const response = await api.get(`/coding-challenges/${id}/solution`);
  return response.data;
};

export const fetchMyChallengeAttempts = async (id) => {
  const response = await api.get(`/coding-challenges/${id}/my-attempts`);
  return response.data;
};

// ─── Skill-Level Learning Services (SLP-14) ────────
export const fetchSkillProfile = async () => {
  const response = await api.get('/skill-learning/profile');
  return response.data;
};

export const updateSkillProfile = async (profileData) => {
  const response = await api.put('/skill-learning/profile', profileData);
  return response.data;
};

export const fetchSkillAssessment = async () => {
  const response = await api.get('/skill-learning/assessment');
  return response.data;
};

export const submitSkillAssessment = async (assessmentData) => {
  const response = await api.post('/skill-learning/assessment/submit', assessmentData);
  return response.data;
};

export const fetchSkillActivities = async () => {
  const response = await api.get('/skill-learning/activities');
  return response.data;
};

// ─── Personalized Recommendations Services (SLP-13) ─
export const fetchPersonalizedRecommendations = async () => {
  const response = await api.get('/recommendations/personalized');
  return response.data;
};

// ─── Project-Based Activities Services (SLP-7) ──────
export const fetchActivities = async (params = {}) => {
  const response = await api.get('/activities', { params });
  return response.data;
};

export const fetchTrainerActivities = async () => {
  const response = await api.get('/activities/trainer');
  return response.data;
};

export const fetchActivityById = async (activityId) => {
  const response = await api.get(`/activities/${activityId}`);
  return response.data;
};

export const createActivity = async (courseId, activityData) => {
  const url = courseId ? `/courses/${courseId}/activities` : '/activities';
  const response = await api.post(url, activityData);
  return response.data;
};

export const updateActivity = async (activityId, activityData) => {
  const response = await api.put(`/activities/${activityId}`, activityData);
  return response.data;
};

export const deleteActivity = async (activityId) => {
  const response = await api.delete(`/activities/${activityId}`);
  return response.data;
};

export const updateActivityStatus = async (activityId, status) => {
  const response = await api.patch(`/activities/${activityId}/status`, { status });
  return response.data;
};

export const createActivityMilestone = async (activityId, milestoneData) => {
  const response = await api.post(`/activities/${activityId}/milestones`, milestoneData);
  return response.data;
};

export const updateActivityMilestone = async (activityId, milestoneId, milestoneData) => {
  const response = await api.put(`/activities/${activityId}/milestones/${milestoneId}`, milestoneData);
  return response.data;
};

export const deleteActivityMilestone = async (activityId, milestoneId) => {
  const response = await api.delete(`/activities/${activityId}/milestones/${milestoneId}`);
  return response.data;
};

export const fetchActivityAssignments = async (activityId) => {
  const response = await api.get(`/activities/${activityId}/assignments`);
  return response.data;
};

export const startActivity = async (activityId) => {
  const response = await api.post(`/activities/${activityId}/start`);
  return response.data;
};

export const fetchActivityAssignment = async (assignmentId) => {
  const response = await api.get(`/activity-assignments/${assignmentId}`);
  return response.data;
};

export const updateActivityProgress = async (assignmentId, progressData) => {
  const response = await api.patch(`/activity-assignments/${assignmentId}/progress`, progressData);
  return response.data;
};

export const submitActivityWork = async (assignmentId, formData) => {
  const isFormData = formData instanceof FormData;
  const response = await api.post(`/activity-assignments/${assignmentId}/submissions`, formData, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return response.data;
};

export const fetchActivitySubmissions = async (assignmentId) => {
  const response = await api.get(`/activity-assignments/${assignmentId}/submissions`);
  return response.data;
};

export const reviewActivitySubmission = async (submissionId, reviewData) => {
  const response = await api.patch(`/activity-submissions/${submissionId}/review`, reviewData);
  return response.data;
};

export const getActivitySubmissionDownloadUrl = (submissionId, fileIndex = 0) => {
  const baseURL = api.defaults.baseURL || 'http://localhost:5000/api';
  return `${baseURL}/activity-submissions/${submissionId}/download/${fileIndex}`;
};

// ─── Admin Users & Audit Logs Services (Part 3) ─
export const updateUserStatusOrRole = async (userId, data) => {
  const response = await api.patch(`/admin/users/${userId}`, data);
  return response.data;
};

export const fetchAdminAuditLogs = async (params = {}) => {
  const response = await api.get('/admin/audit-logs', { params });
  return response.data;
};

// ─── Tasks Services (Part 6) ─
export const fetchTasks = async (params = {}) => {
  const response = await api.get('/tasks', { params });
  return response.data;
};

export const fetchTaskById = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}`);
  return response.data;
};

export const createTask = async (taskData) => {
  const response = await api.post('/tasks', taskData);
  return response.data;
};

export const updateTask = async (taskId, taskData) => {
  const response = await api.put(`/tasks/${taskId}`, taskData);
  return response.data;
};

export const deleteTask = async (taskId) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

export const submitTask = async (taskId, submissionData) => {
  const response = await api.post(`/tasks/${taskId}/submit`, submissionData);
  return response.data;
};

export const fetchTaskSubmissions = async (taskId, params = {}) => {
  const response = await api.get(`/tasks/${taskId}/submissions`, { params });
  return response.data;
};

export const gradeTaskSubmission = async (submissionId, gradeData) => {
  const response = await api.post(`/tasks/submissions/${submissionId}/grade`, gradeData);
  return response.data;
};

// ─── Achievements & Summary Services (Part 4 & 7) ─
export const fetchStudentProgressSummary = async () => {
  const response = await api.get('/progress/summary');
  return response.data;
};

export const fetchStudentAchievements = async () => {
  const response = await api.get('/progress/achievements');
  return response.data;
};

export default api;



