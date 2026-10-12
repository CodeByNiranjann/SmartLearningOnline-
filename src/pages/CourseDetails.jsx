import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchCourseDetails, fetchCourseModules, fetchCourseProgress } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LearningPath from '../components/LearningPath';
import ProgressBar from '../components/ProgressBar';
import { Clock, User, Layers, BookOpen, ArrowLeft, Play, AlertCircle } from 'lucide-react';

const CourseDetails = () => {
  const { courseId } = useParams();
  const { isAuthenticated } = useAuth();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState(null);
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
            const progressData = await fetchCourseProgress(courseId);
            setProgress(progressData);
          } catch (pErr) {
            console.warn('Could not fetch progress for guest/user:', pErr);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-400">Loading learning path...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 p-8 rounded-2xl text-center space-y-4 max-w-lg mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Course Not Found</h3>
        <p className="text-sm text-slate-400">{error || 'The requested course does not exist.'}</p>
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500"
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

  const currentLessonId = progress?.currentLesson || firstLessonId;
  const completedLessons = progress?.completedLessons || [];
  const progressPercentage = progress?.progressPercentage || 0;

  return (
    <div className="space-y-8">
      {/* Back Navigation */}
      <Link
        to="/courses"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to all courses
      </Link>

      {/* Course Hero Banner */}
      <div className="relative rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 md:p-8">
        <div className="lg:col-span-2 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {course.category}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {course.difficulty}
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {course.title}
            </h1>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              {course.description}
            </p>
          </div>

          {/* Instructor & Meta */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-400">
            <div>
              <span className="block text-slate-500 text-[10px] uppercase font-bold">Instructor</span>
              <span className="font-semibold text-slate-200 mt-0.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-indigo-400" /> {course.instructor}
              </span>
            </div>
            <div>
              <span className="block text-slate-500 text-[10px] uppercase font-bold">Duration</span>
              <span className="font-semibold text-slate-200 mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> {course.duration}
              </span>
            </div>
            <div>
              <span className="block text-slate-500 text-[10px] uppercase font-bold">Modules</span>
              <span className="font-semibold text-slate-200 mt-0.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-400" /> {course.moduleCount || modules.length} Modules
              </span>
            </div>
            <div>
              <span className="block text-slate-500 text-[10px] uppercase font-bold">Lessons</span>
              <span className="font-semibold text-slate-200 mt-0.5 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-pink-400" /> {course.lessonCount || 12} Lessons
              </span>
            </div>
          </div>
        </div>

        {/* Thumbnail & Quick Action Card */}
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-950">
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          </div>

          {isAuthenticated && progressPercentage > 0 && (
            <div className="space-y-2">
              <ProgressBar percentage={progressPercentage} size="md" />
            </div>
          )}

          {firstLessonId && (
            <Link
              to={`/learning/${course._id}/${currentLessonId}`}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all duration-200"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{progressPercentage > 0 ? 'Continue Learning' : 'Start Course'}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Structured Learning Path Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Structured Learning Path</h2>
            <p className="text-xs text-slate-400 mt-1">
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
