import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  fetchCourseDetails,
  fetchCourseModules,
  fetchCourseProgress,
  fetchEnrollmentStatus,
  enrollInCourse,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import LearningPath from '../components/LearningPath';
import ProgressBar from '../components/ProgressBar';
import {
  Clock,
  User,
  Layers,
  BookOpen,
  ArrowLeft,
  Play,
  AlertCircle,
  GraduationCap,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState('');
  const [enrollError, setEnrollError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCourseData = async () => {
      try {
        setLoading(true);
        setError('');

        const [courseData, modulesData] = await Promise.all([
          fetchCourseDetails(courseId),
          fetchCourseModules(courseId),
        ]);

        setCourse(courseData);
        setModules(modulesData);

        if (isAuthenticated) {
          try {
            const statusData = await fetchEnrollmentStatus(courseId);
            setIsEnrolled(Boolean(statusData.isEnrolled));
            if (statusData.progress) {
              setProgress(statusData.progress);
            } else {
              const progressData = await fetchCourseProgress(courseId);
              setProgress(progressData);
            }
          } catch (pErr) {
            console.warn('Could not fetch enrollment/progress status:', pErr);
          }
        }
      } catch (err) {
        console.error('Error loading course details:', err);
        setError('Failed to load course details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [courseId, isAuthenticated]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setEnrolling(true);
      setEnrollError('');
      setEnrollSuccess('');

      const res = await enrollInCourse(courseId);
      setIsEnrolled(true);
      if (res.progress) {
        setProgress(res.progress);
      }
      setEnrollSuccess(res.message || 'Successfully enrolled in course!');
      setTimeout(() => setEnrollSuccess(''), 5000);
    } catch (err) {
      console.error('Enroll error:', err);
      setEnrollError(err.response?.data?.message || 'Failed to enroll in this course. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Loading learning path...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="bg-rose-50 border border-rose-200 p-8 rounded-2xl text-center space-y-4 max-w-lg mx-auto my-12 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Course Not Found</h3>
        <p className="text-sm text-slate-600">{error || 'The requested course does not exist.'}</p>
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </Link>
      </div>
    );
  }

  // Find first lesson for "Start Learning" CTA
  const firstLessonId = modules.length > 0 && modules[0].lessons && modules[0].lessons.length > 0
    ? modules[0].lessons[0]._id
    : null;

  const currentLessonId = progress?.resumeLessonId || progress?.lastAccessedLesson?._id || progress?.currentLesson || firstLessonId;
  const completedLessons = progress?.completedLessons || [];
  const progressPercentage = progress?.progressPercentage || 0;

  return (
    <div className="space-y-8 font-sans">
      {/* Back Navigation */}
      <Link
        to="/courses"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to all courses
      </Link>

      {/* Notifications */}
      {enrollSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs shadow-xs">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{enrollSuccess}</span>
        </div>
      )}

      {enrollError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-xs shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span className="font-medium">{enrollError}</span>
        </div>
      )}

      {/* Course Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 overflow-hidden shadow-xl shadow-blue-600/10 grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 md:p-8 text-white">
        <div className="lg:col-span-2 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md text-white border border-white/20">
                {course.category}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md text-white border border-white/20">
                {course.difficulty}
              </span>
              {isEnrolled && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Enrolled
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">
              {course.title}
            </h1>

            <p className="text-blue-100 text-sm md:text-base leading-relaxed">
              {course.description}
            </p>
          </div>

          {/* Instructor & Meta */}
          <div className="pt-4 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-blue-100">
            <div>
              <span className="block text-blue-200 text-[10px] uppercase font-bold tracking-wider">Instructor</span>
              <span className="font-semibold text-white mt-0.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-200" /> {course.instructor}
              </span>
            </div>
            <div>
              <span className="block text-blue-200 text-[10px] uppercase font-bold tracking-wider">Duration</span>
              <span className="font-semibold text-white mt-0.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-200" /> {course.duration}
              </span>
            </div>
            <div>
              <span className="block text-blue-200 text-[10px] uppercase font-bold tracking-wider">Modules</span>
              <span className="font-semibold text-white mt-0.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-200" /> {course.moduleCount || modules.length} Modules
              </span>
            </div>
            <div>
              <span className="block text-blue-200 text-[10px] uppercase font-bold tracking-wider">Lessons</span>
              <span className="font-semibold text-white mt-0.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-200" /> {course.lessonCount || 12} Lessons
              </span>
            </div>
          </div>
        </div>

        {/* Thumbnail & Quick Action Card */}
        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 flex flex-col justify-between space-y-4 shadow-lg">
          <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-900/40">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src =
                  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80';
              }}
            />
          </div>

          {/* Progress or Enrollment CTAs */}
          {isEnrolled ? (
            <div className="space-y-3">
              {progressPercentage > 0 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-blue-100 font-semibold">
                    <span>Course Progress</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <ProgressBar percentage={progressPercentage} size="md" />
                </div>
              )}

              {firstLessonId ? (
                <Link
                  to={`/learning/${course._id}/${currentLessonId}`}
                  className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-blue-50 text-blue-700 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-black/10 transition-all duration-200 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{progressPercentage > 0 ? 'Continue Learning' : 'Start Course'}</span>
                </Link>
              ) : (
                <div className="text-center py-2 text-xs text-blue-200">
                  Lessons coming soon
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-blue-100 font-semibold px-1">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-300" /> Free Enrollment
                </span>
                <span>Self-Paced</span>
              </div>

              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-blue-50 text-blue-700 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-black/15 transition-all duration-200 cursor-pointer disabled:opacity-60"
              >
                <GraduationCap className="w-5 h-5" />
                <span>{enrolling ? 'Enrolling...' : 'Enroll in Course'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Structured Learning Path Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Structured Learning Path</h2>
            <p className="text-xs text-slate-500 mt-1">
              Step-by-step roadmap to master this course topic
            </p>
          </div>
        </div>

        <LearningPath
          modules={modules}
          courseId={course._id}
          completedLessons={completedLessons}
          currentLessonId={currentLessonId}
        />
      </div>
    </div>
  );
};

export default CourseDetails;
