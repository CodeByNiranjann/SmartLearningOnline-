import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchStudentProgress,
  fetchCourses,
  fetchPersonalizedRecommendations,
} from '../services/api';
import ProgressBar from '../components/ProgressBar';
import CourseCard from '../components/CourseCard';
import StudentLearningCalendar from '../components/StudentLearningCalendar';

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
  Zap,
  Target,
  Code2,
  Briefcase,
  Layers,
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
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [progressData, coursesData, recData] = await Promise.allSettled([
          fetchStudentProgress(),
          fetchCourses(),
          fetchPersonalizedRecommendations(),
        ]);

        if (progressData.status === 'fulfilled' && progressData.value) {
          setProgressSummary(progressData.value.summary || {});
          setEnrolledCourses(progressData.value.progressList || []);
        }
        if (coursesData.status === 'fulfilled' && coursesData.value) {
          setFeaturedCourses(coursesData.value.slice(0, 3));
        }
        if (recData.status === 'fulfilled' && recData.value) {
          setRecommendations(recData.value);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const nextAction = recommendations?.immediateNextAction;

  return (
    <div className="space-y-10 font-sans">
      {/* Welcome Hero Banner */}
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

      {/* ─── SLP-13: Next Best Step (What to Learn Next) ─── */}
      {nextAction && (
        <div className="bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-blue-900/10 border border-indigo-200/80 dark:border-indigo-500/20 rounded-2xl p-6 backdrop-blur-md shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Recommended Next Step For You</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {nextAction.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {nextAction.reason} · {nextAction.subtitle}
              </p>
            </div>

            <Link
              to={nextAction.link}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all shrink-0"
            >
              <span>{nextAction.type === 'continue_course' ? 'Resume Now' : 'Start Next Activity'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

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

      {/* Student Learning Calendar: Daily study time heatmap & consistency */}
      <StudentLearningCalendar />

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
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center bg-slate-50/50 space-y-3">
            <Compass className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Active Enrollments</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
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

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      to={`/courses/${course._id}`}
                      className="py-2.5 px-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Learning Path</span>
                    </Link>
                    <Link
                      to={nextLessonId ? `/learning/${course._id}/${nextLessonId}` : `/courses/${course._id}`}
                      className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Continue</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── SLP-13: Personalized Recommended Courses & Drills ─── */}
      {recommendations?.nextCourses?.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xl font-bold text-slate-900">Recommended Next For You</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Curated based on your enrolled topics, skill tier, and learning velocity
              </p>
            </div>
            <Link
              to="/skill-learning"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View Full Skill Path <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.nextCourses.map((course) => (
              <div key={course._id} className="relative group flex flex-col justify-between">
                <CourseCard course={course} />
                {course.recommendationReason && (
                  <div className="mt-2 text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span className="truncate">{course.recommendationReason}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── SLP-13: Next Practice Problems ─── */}
      {recommendations?.nextChallenges?.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-600" />
                Recommended Coding Practice
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Solve these questions to validate your understanding
              </p>
            </div>
            <Link
              to="/coding-challenges"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Coding Arena <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.nextChallenges.map((ch) => (
              <ChallengeCard
                key={ch._id}
                challenge={ch}
                matchReason={ch.recommendationReason}
              />
            ))}
          </div>
        </div>
      )}

      {/* Available Courses Showcase */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Explore All Courses</h2>
            <p className="text-xs text-slate-500 mt-0.5">Explore our wide range of technical skill curricula</p>
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
