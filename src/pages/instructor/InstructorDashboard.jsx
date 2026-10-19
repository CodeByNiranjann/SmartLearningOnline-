import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchInstructorStats } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  Layers,
  FileText,
  Users,
  Plus,
  ArrowRight,
  TrendingUp,
  CheckCircle,
  Clock,
  Sparkles,
  AlertCircle,
  RefreshCw,
  FolderGit2,
  Code2,
} from 'lucide-react';

const InstructorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchInstructorStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load instructor stats:', err);
      setError(err.response?.data?.message || 'Failed to load instructor statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading your instructor workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 p-8 rounded-2xl text-center space-y-4 max-w-lg mx-auto my-12 shadow-xs">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Failed to Load Dashboard</h3>
        <p className="text-sm text-slate-600">{error}</p>
        <button
          onClick={loadStats}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'My Courses',
      value: stats?.myCoursesCount ?? 0,
      icon: BookOpen,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      link: '/manage/courses',
    },
    {
      title: 'Course Modules',
      value: stats?.myModulesCount ?? 0,
      icon: Layers,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      link: '/instructor/modules',
    },
    {
      title: 'Project Activities',
      value: stats?.myProjectsCount ?? 0,
      icon: FolderGit2,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
      link: '/manage/projects',
    },
    {
      title: 'Enrolled Students',
      value: stats?.totalStudentsCount ?? 0,
      icon: Users,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      link: '/instructor/students',
    },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* ─── Hero Banner ─── */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-8 md:p-10 text-white overflow-hidden shadow-xl shadow-blue-600/10">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>Trainer & Instructor Portal</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Trainer'} 👋
            </h1>
            <p className="text-blue-100 text-sm md:text-base leading-relaxed">
              Design comprehensive courses, create project-based activities for practical skills, and evaluate student milestones.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/manage/courses/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-xs shadow-md hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Course
            </Link>
            <Link
              to="/manage/projects/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs shadow-md transition-colors"
            >
              <FolderGit2 className="w-4 h-4" /> Create Project Activity
            </Link>
            <Link
              to="/instructor/students"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs border border-white/25 transition-colors"
            >
              <Users className="w-4 h-4" /> My Students
            </Link>
          </div>
        </div>
      </div>

      {/* ─── KPI Metric Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.link}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] hover:border-blue-300 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl border ${card.color} group-hover:scale-105 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {card.value}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ─── Course Performance Breakdown & Activity ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Course Metrics Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              My Courses Breakdown
            </h2>
            <Link
              to="/manage/courses"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Manage All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {(!stats?.courseMetrics || stats.courseMetrics.length === 0) ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No courses authored yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Create your first curriculum to start teaching students and publishing lessons.
              </p>
              <Link
                to="/manage/courses/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" /> Create Course
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.courseMetrics.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-blue-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {c.category}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        c.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{c.modulesCount} modules</span>
                      <span>•</span>
                      <span>{c.lessonsCount} lessons</span>
                      <span>•</span>
                      <span>{c.enrolledCount} enrolled students</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Link
                      to={`/manage/courses/${c.id}/modules`}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700"
                    >
                      Curriculum
                    </Link>
                    <Link
                      to={`/manage/courses/${c.id}/edit`}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Recent Student Activity */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-600" />
            Recent Student Activity
          </h2>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
            {(!stats?.recentActivity || stats.recentActivity.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recent student progress yet.</p>
            ) : (
              stats.recentActivity.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 truncate">{act.studentName}</span>
                    <span className="text-[10px] text-blue-600 font-bold px-1.5 py-0.5 rounded bg-blue-50">
                      {act.progressPercentage}%
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] truncate">{act.courseTitle}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── Project-Based Practical Activities (SLP-7) ─── */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-1">
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Practical Skills Development (SLP-7)</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Project-Based Activities
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hands-on capstones with ordered milestones, deliverables, and rubric evaluations for student practical skills.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/manage/projects"
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
            >
              Manage All Projects
            </Link>
            <Link
              to="/manage/projects/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Project Activity
            </Link>
          </div>
        </div>

        {(!stats?.projectMetrics || stats.projectMetrics.length === 0) ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center space-y-3 bg-slate-50/50">
            <FolderGit2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No project-based activities created yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Create hands-on practical project activities so your students can develop real-world engineering skills.
            </p>
            <Link
              to="/manage/projects/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-md shadow-purple-500/20"
            >
              <Plus className="w-4 h-4" /> Create First Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.projectMetrics.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      {p.category}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      p.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {p.difficulty}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition-colors">
                    {p.title}
                  </h3>
                  {p.requiredSkills && p.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {p.requiredSkills.slice(0, 3).map((sk) => (
                        <span key={sk} className="text-[10px] font-medium px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 text-xs">
                  <Link
                    to={`/manage/projects/${p.id}/edit`}
                    className="font-semibold text-purple-600 hover:text-purple-700"
                  >
                    Configure Activity →
                  </Link>
                  <Link
                    to={`/manage/projects/${p.id}/submissions`}
                    className="text-slate-500 hover:text-slate-900 font-medium"
                  >
                    Submissions
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorDashboard;
