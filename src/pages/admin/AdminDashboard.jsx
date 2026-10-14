import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminStats } from '../../services/api';
import {
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  FileText,
  BarChart3,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Plus,
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchAdminStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      setError(err.response?.data?.message || 'Failed to load platform statistics.');
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
          <p className="text-sm font-medium text-slate-500">Loading admin metrics...</p>
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
      title: 'Total Students',
      value: stats?.totalStudents ?? 0,
      icon: GraduationCap,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      link: '/admin/users?role=student',
    },
    {
      title: 'Total Instructors',
      value: stats?.totalInstructors ?? 0,
      icon: Users,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      link: '/admin/instructors',
    },
    {
      title: 'Total Courses',
      value: stats?.totalCourses ?? 0,
      icon: BookOpen,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      link: '/manage/courses',
    },
    {
      title: 'Modules & Lessons',
      value: `${stats?.totalModules ?? 0} / ${stats?.totalLessons ?? 0}`,
      subtitle: 'Structured Curriculum',
      icon: Layers,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
      link: '/admin/curriculum',
    },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* ─── Hero Banner ─── */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-8 md:p-10 text-white overflow-hidden shadow-xl shadow-blue-600/10">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
              <span>Platform Administration</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Platform Overview & Control
            </h1>
            <p className="text-blue-100 text-sm md:text-base leading-relaxed">
              Monitor active users, course creation, curriculum expansion, and security events across LearnHub.
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
              to="/admin/users"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs border border-white/25 transition-colors"
            >
              <Users className="w-4 h-4" /> User Management
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
                {card.subtitle && (
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{card.subtitle}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* ─── Quick Operations & Activity Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Quick Action Panels */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Administrative Portals
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/manage/courses"
                className="p-4 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/30 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="p-2 rounded-lg bg-blue-50 w-fit text-blue-600 mb-2">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                    All Courses Management
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Inspect, create, edit, draft, or delete any instructor course platform-wide.
                  </p>
                </div>
                <span className="mt-3 text-xs font-semibold text-blue-600 flex items-center gap-1">
                  Manage Courses <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>

              <Link
                to="/admin/users"
                className="p-4 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/30 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="p-2 rounded-lg bg-indigo-50 w-fit text-indigo-600 mb-2">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                    User & Role Management
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Assign instructor privileges, manage students, view account sessions and statuses.
                  </p>
                </div>
                <span className="mt-3 text-xs font-semibold text-indigo-600 flex items-center gap-1">
                  Manage Users <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>

              <Link
                to="/admin/curriculum"
                className="p-4 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/30 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="p-2 rounded-lg bg-purple-50 w-fit text-purple-600 mb-2">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-purple-600 transition-colors">
                    Modules & Lessons Directory
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Cross-course curriculum browser for auditing modules, lessons, and video content.
                  </p>
                </div>
                <span className="mt-3 text-xs font-semibold text-purple-600 flex items-center gap-1">
                  View Curriculum <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>

              <Link
                to="/admin/reports"
                className="p-4 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/30 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="p-2 rounded-lg bg-emerald-50 w-fit text-emerald-600 mb-2">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
                    Reports & Analytics
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    View enrollment counts, difficulty distributions, and category engagement metrics.
                  </p>
                </div>
                <span className="mt-3 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  View Analytics <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Recent Platform Activity */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-600" />
                Recent Platform Activity
              </h2>
              <button
                onClick={loadStats}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {(!stats?.recentActivity || stats.recentActivity.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center">No platform events recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 truncate">{act.title}</span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(act.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">{act.subtitle}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
