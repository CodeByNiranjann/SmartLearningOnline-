import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchMyCourses, deleteCourse, fetchCourses } from '../../services/api';
import {
  Plus, Search, Edit2, Trash2, Eye, BookOpen, Layers, Users,
  AlertCircle, RefreshCw, GraduationCap, MoreVertical, CheckCircle,
  Archive, Clock, TrendingUp,
} from 'lucide-react';

const CATEGORIES = ['All', 'Web Development', 'Software Engineering', 'Computer Science', 'Data Science', 'Design', 'Other'];
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];

const statusBadge = (status) => {
  if (status === 'published') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'draft')     return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'archived')  return 'bg-slate-100 text-slate-500 border-slate-200';
  return 'bg-slate-100 text-slate-500 border-slate-200';
};

const StatusIcon = ({ status }) => {
  if (status === 'published') return <CheckCircle className="w-3.5 h-3.5" />;
  if (status === 'archived')  return <Archive className="w-3.5 h-3.5" />;
  return <Clock className="w-3.5 h-3.5" />;
};

const MyCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);   // course to confirm deletion
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (search) params.search = search;
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (difficultyFilter !== 'All') params.difficulty = difficultyFilter;
      if (statusFilter) params.status = statusFilter;

      let data;
      if (isAdmin) {
        data = await fetchCourses(params);
      } else {
        // Instructor: only own courses filtered by instructorId
        params.instructor_id = user._id;
        data = await fetchCourses(params);
      }
      setCourses(data);
    } catch (err) {
      console.error('Load courses error:', err);
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, difficultyFilter, statusFilter, isAdmin, user?._id]);

  useEffect(() => {
    const timer = setTimeout(loadCourses, 300);
    return () => clearTimeout(timer);
  }, [loadCourses]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await deleteCourse(deleteTarget._id);
      setSuccessMsg(`"${deleteTarget.title}" has been deleted.`);
      setDeleteTarget(null);
      loadCourses();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete course.';
      setError(msg);
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">

      {/* Page Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-8 md:p-10 text-white overflow-hidden shadow-xl shadow-blue-600/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{isAdmin ? 'Admin Panel' : 'Instructor Dashboard'}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {isAdmin ? 'All Courses' : 'My Courses'}
            </h1>
            <p className="text-blue-100 text-sm md:text-base leading-relaxed">
              {isAdmin
                ? 'Manage all courses on the platform.'
                : 'Manage the courses you teach. Create, edit, and organize modules & lessons.'}
            </p>
          </div>
          <Link
            to="/manage/courses/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-blue-700 font-bold text-sm shadow-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Create Course
          </Link>
        </div>
      </div>

      {/* Toast Messages */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-sm font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-rose-500 hover:text-rose-700 text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto flex-wrap sm:flex-nowrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:w-36 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">Status: All</option>
            <option value="draft">Status: Draft</option>
            <option value="published">Status: Published</option>
            <option value="archived">Status: Archived</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex-1 md:w-44 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>Category: {c}</option>)}
          </select>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="flex-1 md:w-44 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {DIFFICULTIES.map((d) => <option key={d} value={d}>Difficulty: {d}</option>)}
          </select>
        </div>
      </div>

      {/* Course List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-slate-200 h-28 animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 rounded-2xl text-center space-y-4">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No courses found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {search || categoryFilter !== 'All' || difficultyFilter !== 'All'
              ? 'No courses match your filters.'
              : isAdmin
              ? 'No courses exist on the platform yet.'
              : "You haven't created any courses yet. Click \"Create Course\" to get started."}
          </p>
          {!search && categoryFilter === 'All' && difficultyFilter === 'All' && (
            <Link
              to="/manage/courses/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Your First Course
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-blue-200 transition-all"
            >
              {/* Thumbnail */}
              <div className="w-full sm:w-24 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=200&q=80';
                  }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadge(course.status)}`}>
                    <StatusIcon status={course.status} />
                    <span className="capitalize">{course.status}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">{course.category}</span>
                  <span className="text-[11px] text-slate-400 font-medium">·</span>
                  <span className="text-[11px] text-slate-400 font-medium">{course.difficulty}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 truncate">{course.title}</h3>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" />{course.moduleCount || 0} modules</span>
                  <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{course.lessonCount || 0} lessons</span>
                  {isAdmin && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />By {course.instructor}</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <Link
                  to={`/courses/${course._id}`}
                  title="View course"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">View</span>
                </Link>
                <Link
                  to={`/manage/courses/${course._id}/modules`}
                  title="Manage modules"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-semibold transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Modules</span>
                </Link>
                <Link
                  to={`/manage/courses/${course._id}/edit`}
                  title="Edit course"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </Link>
                <button
                  onClick={() => setDeleteTarget(course)}
                  title="Delete course"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-700 text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-5 border border-slate-200">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Course</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Are you sure you want to delete{' '}
                  <strong className="text-slate-800">"{deleteTarget.title}"</strong>?
                  This will permanently remove all its modules and lessons.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {deleteLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCourses;
