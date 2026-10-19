import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchStudentProgressSummary } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  fetchStudentProgress,
  fetchCourses,
  fetchPersonalizedRecommendations,
} from '../services/api';
import ProgressBar from '../components/ProgressBar';
import CourseCard from '../components/CourseCard';
import ChallengeCard from '../components/ChallengeCard';
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
  Calendar,
  ChevronDown,
  ChevronUp,
  Flame,
  Award,
  BookOpen, TrendingUp, Award, CheckCircle2, ArrowRight,
  Play, HelpCircle, Clock, Target, Star, Zap, Activity,
  BarChart2, RefreshCw, AlertTriangle,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Layout states for perfect desktop fit
  const [discoveryTab, setDiscoveryTab] = useState('recommended'); // 'recommended' | 'practice' | 'explore'
  const [showFullCalendar, setShowFullCalendar] = useState(false);

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
  const loadSummary = useCallback(async () => {
    if (user?.role !== 'student') {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const data = await fetchStudentProgressSummary();
      setSummary(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load progress summary.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-10">
      {/* ─── Compact Hero & Next Step Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Welcome Greeting (Col Span 2) */}
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white shadow-md shadow-blue-600/10 flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-[11px] font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>Student Learning Workspace</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Good morning, {user?.name || 'Student'} 👋
            </h1>
            <p className="text-blue-100 text-xs md:text-sm leading-relaxed max-w-xl">
              Build mastery across full-stack curricula, real-world projects, and calibrated challenges.
            </p>
          </div>

          {!user?.isTwoFactorEnabled && (
            <div className="pt-3 border-t border-white/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-blue-100 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>Two-factor authentication is currently disabled.</span>
              </div>
              <Link
                to="/profile"
                className="px-2.5 py-1 rounded-lg bg-white/90 text-blue-700 font-bold text-[11px] hover:bg-white transition-colors"
              >
                Enable 2FA
              </Link>
            </div>
          )}
        </div>

        {/* Recommended Immediate Action (Col Span 1) */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
              <Zap className="w-3 h-3 fill-current" />
              <span>Recommended Next Step</span>
            </div>
            <h2 className="text-sm font-bold text-slate-900 line-clamp-2">
              {nextAction ? nextAction.title : 'Explore Course Offerings'}
            </h2>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              {nextAction ? `${nextAction.reason} · ${nextAction.subtitle}` : 'Get started with high-demand technology tracks.'}
            </p>
          </div>

          <Link
            to={nextAction?.link || '/courses'}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <span>{nextAction?.type === 'continue_course' ? 'Resume Lesson' : 'Start Next Activity'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ─── Compact Metrics Bar ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Courses Started</p>
            <p className="text-xl font-bold text-slate-900">{progressSummary.coursesStarted || 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Completed</p>
            <p className="text-xl font-bold text-slate-900">{progressSummary.coursesCompleted || 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Lessons Done</p>
            <p className="text-xl font-bold text-slate-900">{progressSummary.lessonsCompleted || 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Overall Progress</p>
            <p className="text-xl font-bold text-slate-900">{progressSummary.overallProgress || 0}%</p>
          </div>
  if (user?.role === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30">
            <BarChart2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Admin Console</h2>
          <p className="text-slate-500 mb-6">Manage users, courses, audit logs, and platform analytics.</p>
          <Link to="/admin/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition shadow-md">
            Open Admin Console <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (user?.role === 'instructor') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-3xl bg-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Instructor Hub</h2>
          <p className="text-slate-500 mb-6">Manage your courses, quizzes, tasks and track student progress.</p>
          <Link to="/instructor/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition shadow-md">
            Open Instructor Hub <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

      {/* ─── Continue Learning (Active In-Progress Courses) ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Continue Learning</h2>
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back, <span className="text-blue-600">{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-slate-500 mt-1">Here's your learning progress at a glance.</p>
          </div>
          <button
            onClick={loadSummary}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium transition shadow-xs"
          >
            <span>All Enrollments</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            <div className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          </div>
        ) : enrolledCourses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center bg-slate-50/50 space-y-2">
            <p className="text-xs font-semibold text-slate-700">No active course enrollments yet</p>
            <Link
              to="/courses"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
            >
              <span>Explore Course Catalog</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrolledCourses.slice(0, 2).map((item) => {
              const course = item.courseId;
              if (!course) return null;
              const nextLessonId = item.currentLesson?._id;

              return (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                          {course.category}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{course.title}</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 shrink-0">
                        {course.difficulty}
                      </span>
                    </div>

                    <ProgressBar percentage={item.progressPercentage} size="sm" />

                    {item.currentLesson && (
                      <p className="text-[11px] text-slate-500 truncate">
                        <span className="font-semibold text-slate-700">Next:</span> {item.currentLesson.title}
                      </p>
                    )}
                  </div>

                  <Link
                    to={nextLessonId ? `/learning/${course._id}/${nextLessonId}` : `/courses/${course._id}`}
                    className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Resume Course</span>
                  </Link>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-800 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : summary ? (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrolled Courses</span>
                  <BookOpen className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-slate-900">{summary.totalEnrolled}</div>
                <div className="text-xs text-slate-400 mt-1">{summary.completedCourses} completed</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Progress</span>
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-3xl font-bold text-slate-900">{summary.overallPercent}%</div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2">
                  <div
                    className="h-1.5 bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${summary.overallPercent}%` }}
                    role="progressbar"
                    aria-valuenow={summary.overallPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quiz Score</span>
                  <Target className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-3xl font-bold text-slate-900">
                  {summary.quizStats.avgScore !== null ? `${summary.quizStats.avgScore}%` : '—'}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {summary.quizStats.passed} / {summary.quizStats.total} passed
                </div>
              </div>

      {/* ─── Compact Tabbed Discovery Section ─── */}
      <div className="space-y-4">
        {/* Tab Headers */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDiscoveryTab('recommended')}
              className={`pb-1 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                discoveryTab === 'recommended'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-2'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended Next</span>
            </button>

            <button
              onClick={() => setDiscoveryTab('practice')}
              className={`pb-1 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                discoveryTab === 'practice'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-2'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Coding Practice</span>
            </button>

            <button
              onClick={() => setDiscoveryTab('explore')}
              className={`pb-1 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                discoveryTab === 'explore'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-2'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Featured Courses</span>
            </button>
          </div>

          <Link
            to={
              discoveryTab === 'practice'
                ? '/coding-challenges'
                : discoveryTab === 'recommended'
                ? '/skill-learning'
                : '/courses'
            }
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Tab 1: Recommended Courses */}
        {discoveryTab === 'recommended' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(recommendations?.nextCourses?.length ? recommendations.nextCourses.slice(0, 3) : featuredCourses).map(
              (course) => (
                <div key={course._id} className="relative group flex flex-col justify-between">
                  <CourseCard course={course} />
                </div>
              )
            )}
          </div>
        )}

        {/* Tab 2: Coding Practice */}
        {discoveryTab === 'practice' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations?.nextChallenges?.length ? (
              recommendations.nextChallenges.slice(0, 3).map((ch) => (
                <ChallengeCard
                  key={ch._id}
                  challenge={ch}
                  matchReason={ch.recommendationReason}
                />
              ))
            ) : (
              <div className="col-span-3 p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                Check out the Coding Arena for interactive programming drills.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Featured Courses */}
        {discoveryTab === 'explore' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </div>

      {/* ─── Collapsible Study Calendar & Heatmap ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900">Study Calendar & Consistency Tracker</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowFullCalendar(!showFullCalendar)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>{showFullCalendar ? 'Collapse Heatmap' : 'Open Heatmap'}</span>
            {showFullCalendar ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showFullCalendar && (
          <div className="pt-2">
            <StudentLearningCalendar />
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Certificates</span>
                  <Award className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-3xl font-bold text-slate-900">{summary.completedCourses}</div>
                <div className="text-xs text-slate-400 mt-1">
                  <Link to="/student/achievements" className="text-amber-600 hover:underline font-medium">View achievements →</Link>
                </div>
              </div>
            </div>

            {/* Next Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/student/quizzes"
                className="group flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition"
              >
                <div className="p-3 rounded-xl bg-white/20">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold">Take a Quiz</div>
                  <div className="text-xs text-indigo-200">{summary.quizStats.total === 0 ? 'Start your first quiz' : `${summary.quizStats.total} attempts so far`}</div>
                </div>
                <ArrowRight className="w-5 h-5 ml-auto opacity-70 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/student/tasks"
                className="group flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition"
              >
                <div className="p-3 rounded-xl bg-white/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold">Practical Tasks</div>
                  <div className="text-xs text-amber-100">Submit your assignments</div>
                </div>
                <ArrowRight className="w-5 h-5 ml-auto opacity-70 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/student/achievements"
                className="group flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition"
              >
                <div className="p-3 rounded-xl bg-white/20">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold">Achievements</div>
                  <div className="text-xs text-emerald-100">View your progress record</div>
                </div>
                <ArrowRight className="w-5 h-5 ml-auto opacity-70 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* My Courses Progress */}
            {summary.enrolledCourses.length === 0 ? (
              <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-700 mb-1">No Enrolled Courses Yet</h3>
                <p className="text-slate-500 text-sm mb-5">Browse our course catalog and start learning today!</p>
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
                >
                  Browse Courses <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">My Courses</h2>
                  <Link to="/my-learning" className="text-sm text-blue-600 hover:underline font-medium">View all →</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {summary.enrolledCourses.slice(0, 6).map((course) => (
                    <div key={course.courseId} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm leading-snug truncate">{course.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400">{course.category}</span>
                            {course.isCompleted && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Completed
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold text-blue-600">{course.percentComplete}%</div>
                          <div className="text-xs text-slate-400">{course.completedLessons}/{course.totalLessons} lessons</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${course.isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            style={{ width: `${course.percentComplete}%` }}
                            role="progressbar"
                            aria-valuenow={course.percentComplete}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${course.title} progress: ${course.percentComplete}%`}
                          />
                        </div>
                      </div>

                      {course.nextLesson && !course.isCompleted ? (
                        <Link
                          to={`/learning/${course.courseId}/${course.nextLesson._id}`}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Continue: {course.nextLesson.title.length > 30 ? course.nextLesson.title.slice(0, 30) + '…' : course.nextLesson.title}
                        </Link>
                      ) : course.isCompleted ? (
                        <div className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                          <Award className="w-3.5 h-3.5" />
                          Course Complete!
                        </div>
                      ) : (
                        <Link
                          to={`/courses/${course.courseId}`}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                        >
                          Start Learning <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center">
            <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700 mb-1">No Progress Data Yet</h3>
            <p className="text-slate-500 text-sm mb-5">Enroll in a course to start tracking your learning journey.</p>
            <Link to="/courses" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition">
              Browse Courses <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
