import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchStudentProgress, fetchCourses } from '../services/api';
import ProgressBar from '../components/ProgressBar';
import CourseCard from '../components/CourseCard';
import {
  BookOpen,
  CheckCircle,
  Trophy,
  TrendingUp,
  Play,
  ArrowRight,
  Compass,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

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
    <div className="space-y-10 font-sans">
      {/* Welcome Hero Banner (Matching LearnHub Figma Design) */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-8 md:p-10 text-white overflow-hidden shadow-xl shadow-blue-600/10">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Student Learning Workspace</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Good morning, {user?.name || 'Student'} 👋
          </h1>
          <p className="text-blue-100 text-sm md:text-base leading-relaxed">
            Continue where you left off. Build mastery across industry-standard engineering paths.
          </p>
        </div>

        {/* 2FA Status Notification Badge */}
        {!user?.isTwoFactorEnabled && (
          <div className="mt-4 pt-4 border-t border-white/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-blue-100">
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>Two-factor authentication is currently disabled on your account.</span>
            </div>
            <Link
              to="/profile"
              className="px-3 py-1.5 rounded-lg bg-white text-blue-600 font-bold hover:bg-blue-50 transition-colors shadow-sm"
            >
              Enable 2FA Protection
            </Link>
          </div>
        )}
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-2">
          <div className="p-2.5 rounded-xl bg-blue-50 w-fit text-blue-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Courses Started</p>
          <p className="text-2xl font-bold text-slate-900">{progressSummary.coursesStarted || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-2">
          <div className="p-2.5 rounded-xl bg-emerald-50 w-fit text-emerald-600">
            <Trophy className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Courses Completed</p>
          <p className="text-2xl font-bold text-slate-900">{progressSummary.coursesCompleted || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-2">
          <div className="p-2.5 rounded-xl bg-purple-50 w-fit text-purple-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lessons Completed</p>
          <p className="text-2xl font-bold text-slate-900">{progressSummary.lessonsCompleted || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-2">
          <div className="p-2.5 rounded-xl bg-amber-50 w-fit text-amber-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Progress</p>
          <p className="text-2xl font-bold text-slate-900">{progressSummary.overallProgress || 0}%</p>
        </div>
      </div>

      {/* Continue Learning Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Continue Learning</h2>
            <p className="text-xs text-slate-500 mt-0.5">Resume your recent lessons and active courses</p>
          </div>
          <Link
            to="/my-learning"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View all my courses <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-40 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            <div className="h-40 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          </div>
        ) : enrolledCourses.length === 0 ? (
          <div className="bg-white border border-slate-200/80 p-8 rounded-2xl text-center space-y-3">
            <Compass className="w-10 h-10 text-blue-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">You haven't started any courses yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Browse our course catalog to get enrolled and kick off your technical learning journey.
            </p>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
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
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                          {course.category}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 line-clamp-1">{course.title}</h3>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {course.difficulty}
                      </span>
                    </div>

                    <ProgressBar percentage={item.progressPercentage} size="md" />

                    {item.currentLesson && (
                      <p className="text-xs text-slate-500 truncate">
                        <span className="font-semibold text-slate-700">Next:</span> {item.currentLesson.title}
                      </p>
                    )}
                  </div>

                  <Link
                    to={nextLessonId ? `/learning/${course._id}/${nextLessonId}` : `/courses/${course._id}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
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
            <h2 className="text-xl font-bold text-slate-900">Popular Courses</h2>
            <p className="text-xs text-slate-500 mt-0.5">Recommended technical skill curricula</p>
          </div>
          <Link
            to="/courses"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
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
