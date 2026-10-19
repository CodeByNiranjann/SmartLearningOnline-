import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchTrainerActivities,
  deleteActivity,
  updateActivityStatus,
} from '../../services/api';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Layers,
  Users,
  AlertCircle,
  RefreshCw,
  Clock,
  Code2,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Award,
  Calendar,
  FileCheck,
  Check,
  X,
  Copy,
  BookOpen,
  Filter,
  LayoutGrid,
  List,
} from 'lucide-react';

const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

const ManageActivities = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Filters
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [pendingOnly, setPendingOnly] = useState(false);

  // Modal states
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchTrainerActivities();
      setActivities(data.activities || []);
    } catch (err) {
      console.error('Failed to load activities:', err);
      setError(err.response?.data?.message || 'Failed to load project-based activities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const handleStatusChange = async (activityId, newStatus) => {
    try {
      await updateActivityStatus(activityId, newStatus);
      setSuccessMsg(`Activity status changed to ${newStatus}`);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadActivities();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await deleteActivity(deleteTarget._id);
      setSuccessMsg(`Activity "${deleteTarget.title}" deleted successfully`);
      setDeleteTarget(null);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadActivities();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete activity');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCopyLink = (activityId) => {
    const origin = window.location.origin;
    const url = `${origin}/activities/${activityId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(activityId);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  const clearFilters = () => {
    setSearch('');
    setDifficultyFilter('All');
    setStatusFilter('all');
    setCourseFilter('all');
    setPendingOnly(false);
  };

  // Extract unique course titles
  const courseOptions = useMemo(() => {
    const titles = new Set();
    activities.forEach((act) => {
      if (act.course?.title) titles.add(act.course.title);
    });
    return Array.from(titles);
  }, [activities]);

  // Filtered activities with safe navigation
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (act.title && act.title.toLowerCase().includes(term)) ||
        (act.course?.title && act.course.title.toLowerCase().includes(term)) ||
        (act.category && act.category.toLowerCase().includes(term)) ||
        (Array.isArray(act.technologyStack) &&
          act.technologyStack.some((t) => t.toLowerCase().includes(term))) ||
        (Array.isArray(act.requiredSkills) &&
          act.requiredSkills.some((s) => s.toLowerCase().includes(term)));

      const matchesDifficulty =
        difficultyFilter === 'All' || act.difficulty === difficultyFilter;

      const matchesStatus =
        statusFilter === 'all' || act.status === statusFilter;

      const matchesCourse =
        courseFilter === 'all' || act.course?.title === courseFilter;

      const matchesPending = !pendingOnly || (act.pendingReviews && act.pendingReviews > 0);

      return matchesSearch && matchesDifficulty && matchesStatus && matchesCourse && matchesPending;
    });
  }, [activities, search, difficultyFilter, statusFilter, courseFilter, pendingOnly]);

  // Summary metrics
  const totalEnrolled = activities.reduce((acc, a) => acc + (a.enrolledCount || 0), 0);
  const totalPendingReviews = activities.reduce((acc, a) => acc + (a.pendingReviews || 0), 0);
  const totalPublished = activities.filter((a) => a.status === 'published').length;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No deadline';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'No deadline' : d.toLocaleDateString();
  };

  const hasActiveFilters =
    Boolean(search.trim()) ||
    difficultyFilter !== 'All' ||
    statusFilter !== 'all' ||
    courseFilter !== 'all' ||
    pendingOnly;

  return (
    <div className="space-y-6 font-sans">
      {/* ─── Top Banner ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>SLP-7: Project-Based Activities</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Manage Project Activities
          </h1>
          <p className="text-xs md:text-sm text-slate-500">
            Design hands-on activities, set structured milestones, monitor participant progress, and grade student deliverables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/manage/activities/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all hover:shadow-lg shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Activity</span>
          </Link>
        </div>
      </div>

      {/* ─── Notifications ─── */}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <p>{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="p-1 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <p>{successMsg}</p>
          </div>
          <button
            onClick={() => setSuccessMsg('')}
            className="p-1 text-emerald-500 hover:text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Interactive Metrics Row ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={clearFilters}
          className={`text-left bg-white p-5 rounded-2xl border transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md cursor-pointer ${
            !hasActiveFilters ? 'border-blue-400 ring-2 ring-blue-500/10' : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Activities</p>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{activities.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Click to view all</p>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('published');
            setPendingOnly(false);
          }}
          className={`text-left bg-white p-5 rounded-2xl border transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md cursor-pointer ${
            statusFilter === 'published' && !pendingOnly
              ? 'border-emerald-400 ring-2 ring-emerald-500/10'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Published</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{totalPublished}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Live for learners</p>
        </button>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Students</p>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">{totalEnrolled}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Participating in activities</p>
        </div>

        <button
          type="button"
          onClick={() => setPendingOnly(!pendingOnly)}
          className={`text-left bg-white p-5 rounded-2xl border transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md cursor-pointer ${
            pendingOnly ? 'border-amber-400 ring-2 ring-amber-500/20 bg-amber-50/20' : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending Reviews</p>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{totalPendingReviews}</p>
          <p className="text-[11px] text-amber-600/80 font-medium mt-0.5">
            {pendingOnly ? 'Showing pending only' : 'Click to filter pending'}
          </p>
        </button>
      </div>

      {/* ─── Filters Bar ─── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, course, skill, or tech stack..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap overflow-x-auto pb-1 lg:pb-0">
          {/* Course filter */}
          {courseOptions.length > 0 && (
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Courses</option>
              {courseOptions.map((c) => (
                <option key={c} value={c}>
                  Course: {c}
                </option>
              ))}
            </select>
          )}

          {/* Difficulty filter */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                Difficulty: {d}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Grid Cards View"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={loadActivities}
            title="Refresh"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Results Counter ─── */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <p>
          Showing <span className="font-semibold text-slate-800">{filteredActivities.length}</span> of{' '}
          <span className="font-semibold text-slate-800">{activities.length}</span> project activities
        </p>
        {pendingOnly && (
          <span className="inline-flex items-center gap-1 text-amber-600 font-semibold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            <Clock className="w-3 h-3" />
            Filtered by Pending Submissions
          </span>
        )}
      </div>

      {/* ─── Activities Content (Table or Grid) ─── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
            <p className="text-xs">Loading activities...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Layers className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              {hasActiveFilters ? 'No activities match your filters' : 'No project activities found'}
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Try adjusting your search keywords, difficulty, or status filters.'
                : 'Create your first project-based activity to help students build real-world practical skills.'}
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear All Filters</span>
                </button>
              ) : (
                <Link
                  to="/manage/activities/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-sm hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Activity</span>
                </Link>
              )}
            </div>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Activity & Course</th>
                  <th className="py-3.5 px-4">Level / Category</th>
                  <th className="py-3.5 px-4">Milestones & Marks</th>
                  <th className="py-3.5 px-4">Students / Reviews</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActivities.map((act) => (
                  <tr key={act._id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Title & Course & Tech */}
                    <td className="py-4 px-5">
                      <div className="space-y-1.5 max-w-md">
                        <Link
                          to={`/manage/activities/${act._id}/edit`}
                          className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 text-[13px]"
                        >
                          {act.title}
                        </Link>
                        <p className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>Course:</span>
                          <span className="font-medium text-slate-700">
                            {act.course?.title || 'Standalone Course'}
                          </span>
                          {act.module?.title && (
                            <span className="text-slate-400">· {act.module.title}</span>
                          )}
                        </p>
                        {Array.isArray(act.technologyStack) && act.technologyStack.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {act.technologyStack.slice(0, 3).map((t, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                              >
                                {t}
                              </span>
                            ))}
                            {act.technologyStack.length > 3 && (
                              <span className="text-[10px] text-slate-400">
                                +{act.technologyStack.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Level / Category */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            act.difficulty === 'Beginner'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : act.difficulty === 'Intermediate'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {act.difficulty}
                        </span>
                        <p className="text-[11px] text-slate-500">{act.category || 'General'}</p>
                      </div>
                    </td>

                    {/* Milestones & Marks */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-100">
                            <Layers className="w-2.5 h-2.5" />
                            {act.milestonesCount !== undefined ? act.milestonesCount : act.milestones?.length || 0} Milestones
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800 text-[11px]">
                          {act.maximumMarks} Marks{' '}
                          <span className="text-slate-400 text-[10px] font-normal">(Pass: {act.passingMarks})</span>
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>Due: {formatDate(act.dueDate)}</span>
                        </p>
                      </div>
                    </td>

                    {/* Enrolled & Reviews */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <p className="text-slate-700 font-medium flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>{act.enrolledCount || 0} enrolled</span>
                        </p>
                        {act.pendingReviews > 0 ? (
                          <Link
                            to={`/manage/activities/${act._id}/submissions`}
                            title="Click to review pending submissions"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                          >
                            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                            <span>{act.pendingReviews} need review</span>
                          </Link>
                        ) : (
                          <span className="text-[11px] text-slate-400">All caught up</span>
                        )}
                      </div>
                    </td>

                    {/* Status dropdown */}
                    <td className="py-4 px-4">
                      <select
                        value={act.status}
                        onChange={(e) => handleStatusChange(act._id, e.target.value)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none transition-colors ${
                          act.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : act.status === 'draft'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/manage/activities/${act._id}/submissions`}
                          title="Review Submissions & Progress"
                          className="relative p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <FileCheck className="w-4 h-4" />
                          {act.pendingReviews > 0 && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white" />
                          )}
                        </Link>
                        <Link
                          to={`/activities/${act._id}`}
                          title="Preview Student View"
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleCopyLink(act._id)}
                          title="Copy student link"
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          {copiedId === act._id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <Link
                          to={`/manage/activities/${act._id}/edit`}
                          title="Edit Activity"
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(act)}
                          title="Delete Activity"
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid Card View */
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredActivities.map((act) => (
              <div
                key={act._id}
                className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4 transition-all hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        act.difficulty === 'Beginner'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : act.difficulty === 'Intermediate'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {act.difficulty}
                    </span>
                    <select
                      value={act.status}
                      onChange={(e) => handleStatusChange(act._id, e.target.value)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer ${
                        act.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : act.status === 'draft'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <Link
                    to={`/manage/activities/${act._id}/edit`}
                    className="block font-bold text-slate-900 hover:text-blue-600 text-sm line-clamp-2"
                  >
                    {act.title}
                  </Link>

                  <p className="text-xs text-slate-500 line-clamp-2">{act.description}</p>

                  <div className="space-y-1.5 pt-1 text-[11px] text-slate-600">
                    <p className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span className="line-clamp-1">{act.course?.title || 'Standalone'}</span>
                    </p>
                    <div className="flex items-center justify-between text-slate-500 pt-1">
                      <span className="inline-flex items-center gap-1">
                        <Layers className="w-3 h-3 text-blue-500" />
                        {act.milestonesCount !== undefined ? act.milestonesCount : act.milestones?.length || 0} Milestones
                      </span>
                      <span className="font-semibold text-slate-700">
                        {act.maximumMarks} Marks
                      </span>
                    </div>
                  </div>

                  {Array.isArray(act.technologyStack) && act.technologyStack.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {act.technologyStack.slice(0, 3).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[10px] font-medium"
                        >
                          {t}
                        </span>
                      ))}
                      {act.technologyStack.length > 3 && (
                        <span className="text-[10px] text-slate-400">
                          +{act.technologyStack.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-medium">
                      {act.enrolledCount || 0} enrolled
                    </span>
                    {act.pendingReviews > 0 && (
                      <Link
                        to={`/manage/activities/${act._id}/submissions`}
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
                      >
                        {act.pendingReviews} pending
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Link
                      to={`/manage/activities/${act._id}/submissions`}
                      title="Submissions"
                      className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to={`/activities/${act._id}`}
                      title="Preview"
                      className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to={`/manage/activities/${act._id}/edit`}
                      title="Edit"
                      className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(act)}
                      title="Delete"
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Delete Confirmation Modal ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="p-3 bg-rose-50 rounded-2xl w-fit text-rose-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Delete Project Activity?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete <span className="font-semibold text-slate-800">"{deleteTarget.title}"</span>? All milestones, student assignments, and submissions will also be deleted permanently.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Activity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageActivities;
