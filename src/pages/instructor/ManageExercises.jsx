import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchExercises, fetchCourses, deleteExercise } from '../../services/api';
import {
  Plus, Search, Edit2, Trash2, Eye, BookOpen, Layers, Users,
  AlertCircle, RefreshCw, CheckCircle, Clock, Code2, UploadCloud,
  FileText, FolderGit2, ChevronRight, FileCode, CheckSquare, Award
} from 'lucide-react';

const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const EXERCISE_TYPES = ['All', 'Coding Exercise', 'File Upload', 'Text Answer', 'Project Task'];
const STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Published', label: 'Published' },
  { value: 'Draft', label: 'Draft' },
];

const getTypeIcon = (type) => {
  switch (type) {
    case 'Coding Exercise':
      return <Code2 className="w-4 h-4 text-emerald-600" />;
    case 'File Upload':
      return <UploadCloud className="w-4 h-4 text-blue-600" />;
    case 'Text Answer':
      return <FileText className="w-4 h-4 text-violet-600" />;
    case 'Project Task':
      return <FolderGit2 className="w-4 h-4 text-amber-600" />;
    default:
      return <FileCode className="w-4 h-4 text-slate-500" />;
  }
};

const getDifficultyBadge = (difficulty) => {
  switch (difficulty) {
    case 'Beginner':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Intermediate':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Advanced':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

const ManageExercises = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [exercises, setExercises] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load instructor's courses for the course filter
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const params = {};
        if (!isAdmin && user?._id) {
          params.instructor_id = user._id;
        }
        const data = await fetchCourses(params);
        setCourses(Array.isArray(data) ? data : (data.courses || []));
      } catch (err) {
        console.error('Failed to load courses for filter:', err);
      }
    };
    loadCourses();
  }, [isAdmin, user?._id]);

  // Load exercises based on filters
  const loadExercises = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (courseFilter !== 'All') params.courseId = courseFilter;
      if (difficultyFilter !== 'All') params.difficulty = difficultyFilter;
      if (typeFilter !== 'All') params.exerciseType = typeFilter;
      params.status = statusFilter;

      const data = await fetchExercises(params);
      setExercises(data.exercises || []);
    } catch (err) {
      console.error('Load exercises error:', err);
      setError(err.response?.data?.message || 'Failed to load exercises. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, courseFilter, difficultyFilter, typeFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(loadExercises, 300);
    return () => clearTimeout(timer);
  }, [loadExercises]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await deleteExercise(deleteTarget._id);
      setSuccessMsg(`"${deleteTarget.title}" was successfully deleted.`);
      setDeleteTarget(null);
      loadExercises();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete exercise.');
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* ─── Header & Primary CTA ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Practical Exercises</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              Sprint 2
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin
              ? 'Manage practical exercises and review student submissions across all courses.'
              : 'Create hands-on coding exercises, file-upload tasks, and assignments for your courses.'}
          </p>
        </div>

        <Link
          to="/manage/exercises/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New Exercise
        </Link>
      </div>

      {/* ─── Feedback Alerts ─── */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
          <button
            onClick={loadExercises}
            className="ml-auto underline hover:no-underline font-medium cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── Search & Filters Bar ─── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-1 sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Course filter */}
          <div>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
            >
              <option value="All">All Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty filter */}
          <div>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  Difficulty: {d}
                </option>
              ))}
            </select>
          </div>

          {/* Exercise Type filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
            >
              {EXERCISE_TYPES.map((t) => (
                <option key={t} value={t}>
                  Type: {t}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─── Exercise List ─── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="mt-3 text-sm text-slate-500 font-medium">Loading exercises...</p>
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Code2 className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-semibold text-slate-900">No exercises found</h3>
            <p className="text-sm text-slate-500 mt-1">
              {search || courseFilter !== 'All' || difficultyFilter !== 'All' || typeFilter !== 'All' || statusFilter !== 'all'
                ? 'Try adjusting your search filters to find what you are looking for.'
                : 'Get started by creating your first practical coding task or hands-on exercise.'}
            </p>
          </div>
          <Link
            to="/manage/exercises/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Exercise
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Exercise</th>
                  <th className="px-4 py-3.5">Course & Context</th>
                  <th className="px-4 py-3.5">Type & Level</th>
                  <th className="px-4 py-3.5">Marks & Due</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exercises.map((ex) => (
                  <tr key={ex._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Exercise Info */}
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                          {getTypeIcon(ex.exerciseType)}
                        </div>
                        <div>
                          <Link
                            to={`/exercises/${ex._id}`}
                            className="font-semibold text-slate-900 hover:text-blue-600 line-clamp-1"
                          >
                            {ex.title}
                          </Link>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 max-w-sm">
                            {ex.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Course / Module / Lesson */}
                    <td className="px-4 py-4">
                      <div className="space-y-0.5 text-xs">
                        <span className="font-medium text-slate-800 line-clamp-1">
                          {ex.courseId?.title || 'Course'}
                        </span>
                        {ex.moduleId && (
                          <div className="text-slate-500 flex items-center gap-1 line-clamp-1">
                            <Layers className="w-3 h-3 text-slate-400" />
                            <span>{ex.moduleId.title}</span>
                          </div>
                        )}
                        {ex.lessonId && (
                          <div className="text-slate-400 flex items-center gap-1 line-clamp-1">
                            <BookOpen className="w-3 h-3" />
                            <span>{ex.lessonId.title}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Type & Difficulty */}
                    <td className="px-4 py-4">
                      <div className="space-y-1.5">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                          {ex.exerciseType}
                        </span>
                        <div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getDifficultyBadge(
                              ex.difficulty
                            )}`}
                          >
                            {ex.difficulty}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Marks & Time */}
                    <td className="px-4 py-4">
                      <div className="text-xs space-y-0.5">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span>{ex.maximumMarks} pts</span>
                          <span className="text-slate-400 font-normal">
                            (Pass: {ex.passingMarks})
                          </span>
                        </div>
                        <div className="text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{ex.estimatedMinutes} mins</span>
                        </div>
                        {ex.dueDate && (
                          <div className="text-slate-400 text-[11px]">
                            Due: {new Date(ex.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          ex.status === 'Published'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {ex.status === 'Published' ? (
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-600" />
                        )}
                        {ex.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          to={`/manage/exercises/${ex._id}/submissions`}
                          title="View Learner Submissions"
                          className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Users className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/exercises/${ex._id}`}
                          title="Preview Exercise"
                          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/manage/exercises/${ex._id}/edit`}
                          title="Edit Exercise"
                          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(ex)}
                          title="Delete Exercise"
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-base">Delete Exercise?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900">"{deleteTarget.title}"</strong>? All associated
              student submissions, grades, and uploaded files will also be removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                {deleteLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageExercises;
