import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchStudentProgressSummary, fetchPersonalizedRecommendations } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CourseCard from '../components/CourseCard';
import ChallengeCard from '../components/ChallengeCard';
import StudentLearningCalendar from '../components/StudentLearningCalendar';
import {
  BookOpen,
  TrendingUp,
  Award,
  CheckCircle2,
  ArrowRight,
  Play,
  HelpCircle,
  Clock,
  Target,
  Star,
  Zap,
  Activity,
  BarChart2,
  RefreshCw,
  AlertTriangle,
  Code2,
  Sparkles,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = useCallback(async () => {
    if (user?.role !== 'student') {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const [summaryRes, recRes] = await Promise.allSettled([
        fetchStudentProgressSummary(),
        fetchPersonalizedRecommendations(),
      ]);

      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value);
      } else {
        setError(summaryRes.reason?.response?.data?.message || 'Failed to load progress summary.');
      }

      if (recRes.status === 'fulfilled') {
        setRecommendations(recRes.value);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load progress summary.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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

  const nextAction = recommendations?.immediateNextAction;

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
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium transition shadow-xs"
          >
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

        {/* ─── SLP-13: Next Best Step (What to Learn Next) ─── */}
        {nextAction && (
          <div className="bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-blue-900/10 border border-indigo-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Recommended Next Step For You</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {nextAction.title}
                </h2>
                <p className="text-xs text-slate-500">
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

            {/* Student Learning Calendar: Daily study time heatmap & consistency */}
            <StudentLearningCalendar />

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
                          Start Learning <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── SLP-13: Recommended Next Courses ─── */}
            {recommendations?.nextCourses?.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <h2 className="text-lg font-bold text-slate-900">Recommended Next For You</h2>
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {recommendations.nextCourses.map((course) => (
                    <div key={course._id} className="flex flex-col justify-between">
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
              <div className="space-y-4 pt-4">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
