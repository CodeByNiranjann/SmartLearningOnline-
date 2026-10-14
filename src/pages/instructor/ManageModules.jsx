import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchCourseDetails, fetchCourseModules, createModule, updateModule, deleteModule,
} from '../../services/api';
import {
  ArrowLeft, Plus, Edit2, Trash2, BookOpen, Layers, GripVertical, AlertCircle,
  CheckCircle, RefreshCw, Save, X, ChevronRight,
} from 'lucide-react';

const EMPTY_MODULE_FORM = { title: '', description: '', order: '' };

const ManageModules = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Inline create/edit modal state
  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState(null);  // null = creating new
  const [form, setForm] = useState(EMPTY_MODULE_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [courseData, modulesData] = await Promise.all([
        fetchCourseDetails(courseId),
        fetchCourseModules(courseId),
      ]);
      setCourse(courseData);
      setModules(modulesData);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load course data.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditingModule(null);
    setForm({ ...EMPTY_MODULE_FORM, order: (modules.length + 1).toString() });
    setShowForm(true);
    setError('');
  };

  const openEdit = (mod) => {
    setEditingModule(mod);
    setForm({ title: mod.title, description: mod.description || '', order: mod.order.toString() });
    setShowForm(true);
    setError('');
  };

  const closeForm = () => { setShowForm(false); setEditingModule(null); setForm(EMPTY_MODULE_FORM); };

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) return setError('Module title is required.');

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      order: form.order ? parseInt(form.order, 10) : undefined,
    };

    try {
      setSubmitting(true);
      if (editingModule) {
        await updateModule(editingModule._id, payload);
        setSuccess('Module updated successfully.');
      } else {
        await createModule(courseId, payload);
        setSuccess('Module created successfully.');
      }
      closeForm();
      loadData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save module.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await deleteModule(deleteTarget._id);
      setSuccess(`Module "${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
      loadData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete module.';
      setError(msg);
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">

      {/* Back Navigation */}
      <Link
        to="/manage/courses"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Courses
      </Link>

      {/* Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 text-white shadow-xl shadow-purple-600/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>Module Manager</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight line-clamp-1">
              {course?.title || 'Course'}
            </h1>
            <p className="text-purple-100 text-sm">
              {modules.length} module{modules.length !== 1 ? 's' : ''} · {course?.lessonCount || 0} total lessons
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-purple-700 font-bold text-sm shadow-lg hover:bg-purple-50 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add Module
          </button>
        </div>
      </div>

      {/* Toast Messages */}
      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-sm font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-rose-500 hover:text-rose-700 text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Create / Edit Form Panel */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-blue-200 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              {editingModule ? 'Edit Module' : 'New Module'}
            </h2>
            <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Module Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="e.g. Introduction to React"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Order</label>
                <input
                  type="number"
                  name="order"
                  value={form.order}
                  onChange={handleFormChange}
                  min="1"
                  placeholder="Auto"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleFormChange}
                rows={2}
                placeholder="Brief description of this module..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button type="button" onClick={closeForm} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors disabled:opacity-60"
              >
                {submitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> {editingModule ? 'Save Changes' : 'Create Module'}</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Module List */}
      {modules.length === 0 && !showForm ? (
        <div className="bg-white border border-slate-200 p-12 rounded-2xl text-center space-y-4">
          <Layers className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No modules yet</h3>
          <p className="text-sm text-slate-500">Click "Add Module" to structure your course content.</p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add First Module
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((mod, idx) => (
            <div
              key={mod._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-purple-200 transition-all"
            >
              {/* Drag handle + order */}
              <div className="flex items-center gap-3 shrink-0">
                <GripVertical className="w-4 h-4 text-slate-300" />
                <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold flex items-center justify-center border border-purple-100">
                  {mod.order}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">{mod.title}</h3>
                {mod.description && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">{mod.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{mod.lessons?.length || 0} lessons</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/manage/courses/${courseId}/modules/${mod._id}/lessons`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lessons</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => openEdit(mod)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  onClick={() => setDeleteTarget(mod)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-semibold transition-colors"
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
                <h3 className="text-base font-bold text-slate-900">Delete Module</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Are you sure you want to delete{' '}
                  <strong className="text-slate-800">"{deleteTarget.title}"</strong>?
                  All lessons inside this module will also be permanently deleted.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {deleteLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Module
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageModules;
