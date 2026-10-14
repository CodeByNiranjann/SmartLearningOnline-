import React, { useState, useEffect } from 'react';
import { fetchAdminReports } from '../../services/api';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  CheckCircle2,
  BookOpen,
  Award,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

const AdminReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchAdminReports();
      setData(res);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError('Failed to fetch platform analytics reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Generating analytics report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 p-8 rounded-2xl text-center space-y-4 max-w-lg mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Report Generation Failed</h3>
        <p className="text-sm text-slate-600">{error}</p>
        <button
          onClick={loadReports}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  const {
    categoryBreakdown = [],
    difficultyBreakdown = [],
    completionBreakdown = [],
    totalEnrollments = 0,
    averageCompletionRate = 0,
  } = data || {};

  return (
    <div className="space-y-8 font-sans">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Auditing course distributions, completion metrics, and student learning trends across the platform.
          </p>
        </div>

        <button
          onClick={loadReports}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* ─── Metric Highlights ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Enrollments Tracked</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalEnrollments}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Average Course Progress</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{averageCompletionRate}%</p>
          </div>
        </div>
      </div>

      {/* ─── Analytics Grids ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
          <h2 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-600" />
            Courses by Category
          </h2>
          {categoryBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No courses published yet.</p>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.name}</span>
                    <span className="font-bold text-slate-900">{item.count} courses</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{
                        width: `${Math.min(100, (item.count / Math.max(1, totalEnrollments)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Difficulty Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
          <h2 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Course Difficulty Levels
          </h2>
          <div className="space-y-3">
            {difficultyBreakdown.map((item) => (
              <div key={item.name} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">{item.name}</span>
                <span className="font-bold text-blue-600 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200">
                  {item.count} Courses
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Engagement Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
          <h2 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
            Completion Funnel
          </h2>
          <div className="space-y-3">
            {completionBreakdown.map((item) => (
              <div key={item.status} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">{item.status}</span>
                <span className="font-bold text-purple-700 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
