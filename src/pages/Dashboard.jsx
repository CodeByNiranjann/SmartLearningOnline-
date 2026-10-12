import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchStudentProgress, fetchCourses } from '../services/api';
import ProgressBar from '../components/ProgressBar';
import CourseCard from '../components/CourseCard';
import { BookOpen, CheckCircle, Trophy, TrendingUp, Play, ArrowRight, Compass, Sparkles } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  const [progressSummary, setProgressSummary] = useState({
    coursesStarted: 0,
    coursesCompleted: 0,
    lessonsCompleted: 0,
    overallProgress: 0,
  });
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [progressData, coursesData] = await Promise.all([
          fetchStudentProgress(),
          fetchCourses(),
        ]);

        if (progressData) {
          setProgressSummary(progressData.summary || {});
          setEnrolledCourses(progressData.progressList || []);
        }
        setFeaturedCourses(coursesData ? coursesData.slice(0, 3) : []);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-10">
      {/* Welcome Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/20 p-8 md:p-10 overflow-hidden shadow-2xl">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Student Dashboard</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name || 'Student'} 👋
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Ready to continue your learning journey? Track your course progress, explore new learning paths, and build job-ready technical skills.
          </p>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 w-fit text-indigo-400 border border-indigo-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Courses Started</p>
          <p className="text-2xl font-extrabold text-white">{progressSummary.coursesStarted || 0}</p>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 w-fit text-emerald-400 border border-emerald-500/20">
            <Trophy className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Courses Completed</p>
          <p className="text-2xl font-extrabold text-white">{progressSummary.coursesCompleted || 0}</p>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
          <div className="p-2.5 rounded-xl bg-purple-500/10 w-fit text-purple-400 border border-purple-500/20">
            <CheckCircle className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lessons Completed</p>
          <p className="text-2xl font-extrabold text-white">{progressSummary.lessonsCompleted || 0}</p>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
          <div className="p-2.5 rounded-xl bg-pink-500/10 w-fit text-pink-400 border border-pink-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Progress</p>
          <p className="text-2xl font-extrabold text-white">{progressSummary.overallProgress || 0}%</p>
        </div>
      </div>

      {/* My Learning Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">My Learning</h2>
            <p className="text-xs text-slate-400 mt-0.5">Resume your active course modules</p>
          </div>
          <Link
            to="/my-learning"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            View all my courses <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-44 bg-slate-900/60 rounded-2xl border border-slate-800 animate-pulse" />
            <div className="h-44 bg-slate-900/60 rounded-2xl border border-slate-800 animate-pulse" />
          </div>
        ) : enrolledCourses.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800/80 p-8 rounded-2xl text-center space-y-3">
            <Compass className="w-10 h-10 text-indigo-400 mx-auto" />
            <h3 className="text-base font-bold text-white">You haven't started any courses yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Explore our available courses catalog to pick your structured learning path.
            </p>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
            >
              Explore Courses <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrolledCourses.map((item) => {
              const course = item.courseId;
              if (!course) return null;
              const nextLessonId = item.currentLesson?._id;

              return (
                <div
                  key={item._id}
                  className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                          {course.category}
                        </span>
                        <h3 className="text-lg font-bold text-white line-clamp-1">{course.title}</h3>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {course.difficulty}
                      </span>
                    </div>

                    <ProgressBar percentage={item.progressPercentage} size="md" />

                    {item.currentLesson && (
                      <p className="text-xs text-slate-400 truncate">
                        <span className="font-semibold text-slate-300">Current Lesson:</span> {item.currentLesson.title}
                      </p>
                    )}
                  </div>

                  <Link
                    to={nextLessonId ? `/learning/${course._id}/${nextLessonId}` : `/courses/${course._id}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Continue Learning</span>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Courses Showcase */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Explore Available Courses</h2>
            <p className="text-xs text-slate-400 mt-0.5">Top structured learning paths for students</p>
          </div>
          <Link
            to="/courses"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            Explore all courses <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredCourses.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
