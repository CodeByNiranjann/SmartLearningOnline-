import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  fetchCourseDetails, createLesson, updateLesson, deleteLesson,
} from '../../services/api';
import api from '../../services/api';
import {
  ArrowLeft, Plus, Edit2, Trash2, BookOpen, GripVertical,
  AlertCircle, CheckCircle, RefreshCw, Save, X, FileText, Paperclip,
} from 'lucide-react';
import LessonResourcesModal from '../../components/LessonResourcesModal';

const EMPTY_LESSON_FORM = { title: '', description: '', content: '', videoUrl: '', duration: '15 min', order: '' };

const ManageLessons = () => {
  const { courseId, moduleId } = useParams();

  const [course, setCourse] = useState(null);
  const [module, setModule] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [form, setForm] = useState(EMPTY_LESSON_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedLessonForResources, setSelectedLessonForResources] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [courseData, moduleData, lessonsData] = await Promise.all([
        fetchCourseDetails(courseId),
        api.get(`/modules/${moduleId}`).then((r) => r.data),
        api.get(`/modules/${moduleId}/lessons`).then((r) => r.data),
      ]);
      setCourse(courseData);
      setModule(moduleData);
      setLessons(lessonsData);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load lesson data.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [courseId, moduleId]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditingLesson(null);
    setForm({ ...EMPTY_LESSON_FORM, order: (lessons.length + 1).toString() });
    setShowForm(true);
    setError('');
  };

  const openEdit = (lesson) => {
    setEditingLesson(lesson);
    setForm({
      title: lesson.title,
      description: lesson.description || '',
      content: lesson.content || '',
      videoUrl: lesson.videoUrl || '',
      duration: lesson.duration || '15 min',
      order: lesson.order.toString(),
    });
    setShowForm(true);
    setError('');
  };

  const closeForm = () => { setShowForm(false); setEditingLesson(null); setForm(EMPTY_LESSON_FORM); };

  const handleFormChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) return setError('Lesson title is required.');
    if (!form.content.trim()) return setError('Lesson content is required.');

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      content: form.content.trim(),
      videoUrl: form.videoUrl.trim(),
      duration: form.duration.trim(),
      order: form.order ? parseInt(form.order, 10) : undefined,
    };

    try {
      setSubmitting(true);
      if (editingLesson) {
        await updateLesson(editingLesson._id, payload);
        setSuccess('Lesson updated successfully.');
      } else {
        await createLesson(moduleId, payload);
        setSuccess('Lesson created successfully.');
      }
      closeForm();
      loadData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save lesson.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await deleteLesson(deleteTarget._id);
      setSuccess(`Lesson "${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
      loadData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete lesson.';
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
          <p className="text-sm font-medium text-slate-500">Loading lessons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link to="/manage/courses" className="hover:text-slate-800 transition-colors">My Courses</Link>
        <span>›</span>
        <Link to={`/manage/courses/${courseId}/modules`} className="hover:text-slate-800 transition-colors truncate max-w-[180px]">
          {course?.title || 'Course'}
        </Link>
        <span>›</span>
        <span className="text-slate-800 font-semibold truncate max-w-[180px]">{module?.title || 'Module'}</span>
      </div>

      {/* Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-xl shadow-indigo-600/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold">
              <FileText className="w-3.5 h-3.5" />
              <span>Lesson Manager</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight line-clamp-1">
              {module?.title || 'Module'}
            </h1>
            <p className="text-indigo-100 text-sm">
              {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} in this module
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-bold text-sm shadow-lg hover:bg-indigo-50 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add Lesson
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

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              {editingLesson ? 'Edit Lesson' : 'New Lesson'}
            </h2>
            <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Lesson Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="e.g. What is React?"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
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
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Description</label>
              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleFormChange}
                placeholder="Brief overview of this lesson..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  YouTube Video URL
                </label>
                <input
                  type="url"
                  name="videoUrl"
                  value={form.videoUrl}
                  onChange={handleFormChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Duration
                </label>
                <input
                  type="text"
                  name="duration"
                  value={form.duration}
                  onChange={handleFormChange}
                  placeholder="e.g. 15 min"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Content <span className="text-rose-500">*</span>
                <span className="text-slate-400 font-normal normal-case ml-1">(Markdown / text / video URL)</span>
              </label>
              <textarea
                name="content"
                value={form.content}
                onChange={handleFormChange}
                rows={6}
                placeholder="Paste lesson content, embed video URL, or write markdown..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm resize-none font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button type="button" onClick={closeForm} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors disabled:opacity-60"
              >
                {submitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> {editingLesson ? 'Save Changes' : 'Create Lesson'}</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lesson List */}
      {lessons.length === 0 && !showForm ? (
        <div className="bg-white border border-slate-200 p-12 rounded-2xl text-center space-y-4">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No lessons yet</h3>
          <p className="text-sm text-slate-500">Click "Add Lesson" to add content to this module.</p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add First Lesson
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <div
              key={lesson._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-indigo-200 transition-all"
            >
              {/* Order badge */}
              <div className="flex items-center gap-3 shrink-0">
                <GripVertical className="w-4 h-4 text-slate-300" />
                <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center border border-indigo-100">
                  {lesson.order}
                </span>
              </div>

              {/* Lesson info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">{lesson.title}</h3>
                {lesson.description && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">{lesson.description}</p>
                )}
                <p className="text-xs text-slate-400 mt-1 truncate font-mono">
                  {lesson.content?.slice(0, 80)}{lesson.content?.length > 80 ? '…' : ''}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSelectedLessonForResources(lesson)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold transition-colors"
                  title="Manage Lesson Resources & Safe Uploads"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Resources</span>
                </button>
                <button
                  onClick={() => openEdit(lesson)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  onClick={() => setDeleteTarget(lesson)}
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

      {/* Lesson Resources Modal */}
      {selectedLessonForResources && (
        <LessonResourcesModal
          lesson={selectedLessonForResources}
          onClose={() => setSelectedLessonForResources(null)}
          onUpdated={loadData}
        />
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
                <h3 className="text-base font-bold text-slate-900">Delete Lesson</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Are you sure you want to permanently delete{' '}
                  <strong className="text-slate-800">"{deleteTarget.title}"</strong>?
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
                Delete Lesson
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLessons;
