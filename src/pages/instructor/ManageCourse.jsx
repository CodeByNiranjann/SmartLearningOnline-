import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchCourseDetails, createCourse, updateCourse } from '../../services/api';
import {
  ArrowLeft, BookOpen, Save, AlertCircle, CheckCircle, RefreshCw, ImageIcon,
} from 'lucide-react';

const CATEGORIES = ['Web Development', 'Software Engineering', 'Computer Science', 'Data Science', 'Design', 'Other'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const STATUSES = ['draft', 'published', 'archived'];

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'Web Development',
  difficulty: 'Beginner',
  duration: '',
  thumbnail: '',
  price: 0,
  status: 'draft',
  tags: '',
};

const ManageCourse = () => {
  const { courseId } = useParams();           // present when editing
  const navigate = useNavigate();
  const isEditing = Boolean(courseId) && courseId !== 'new';

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEditing);   // load existing data when editing
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load course data when editing
  useEffect(() => {
    if (!isEditing) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchCourseDetails(courseId);
        setForm({
          title: data.title || '',
          description: data.description || '',
          category: data.category || 'Web Development',
          difficulty: data.difficulty || 'Beginner',
          duration: data.duration || '',
          thumbnail: data.thumbnail || '',
          price: data.price ?? 0,
          status: data.status || 'draft',
          tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
        });
      } catch (err) {
        setError('Failed to load course details. Please go back and try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.title.trim()) return setError('Course title is required.');
    if (!form.description.trim()) return setError('Description is required.');
    if (!form.duration.trim()) return setError('Duration is required.');
    if (!form.thumbnail.trim()) return setError('Thumbnail URL is required.');

    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      price: Number(form.price) || 0,
    };

    try {
      setSubmitting(true);
      if (isEditing) {
        await updateCourse(courseId, payload);
        setSuccess('Course updated successfully!');
      } else {
        const result = await createCourse(payload);
        setSuccess('Course created successfully!');
        // Redirect to modules management after creating
        setTimeout(() => navigate(`/manage/courses/${result.course._id}/modules`), 1500);
      }
    } catch (err) {
      const msg = err.response?.data?.message || (isEditing ? 'Failed to update course.' : 'Failed to create course.');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading course...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 font-sans">

      {/* Back Navigation */}
      <Link
        to="/manage/courses"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Courses
      </Link>

      {/* Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-8 text-white shadow-xl shadow-blue-600/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {isEditing ? 'Edit Course' : 'Create New Course'}
            </h1>
            <p className="text-blue-100 text-sm mt-0.5">
              {isEditing ? 'Update your course information below.' : 'Fill in the details to create a new course.'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-sm font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {success}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 md:p-8 space-y-6">

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Course Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Web Development with React"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
            maxLength={120}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe what students will learn..."
            rows={4}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm resize-none"
          />
        </div>

        {/* Category + Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Difficulty
            </label>
            <select
              name="difficulty"
              value={form.difficulty}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Duration + Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Duration <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="duration"
              value={form.duration}
              onChange={handleChange}
              placeholder="e.g. 12h 30m or 6 weeks"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Price (USD)
            </label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="0 = Free"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
            />
          </div>
        </div>

        {/* Thumbnail URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            Thumbnail URL <span className="text-rose-500">*</span>
          </label>
          <input
            type="url"
            name="thumbnail"
            value={form.thumbnail}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
          />
          {form.thumbnail && (
            <div className="mt-2 w-full h-36 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <img
                src={form.thumbnail}
                alt="Thumbnail preview"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Tags <span className="text-slate-400 font-normal normal-case">(comma separated)</span>
          </label>
          <input
            type="text"
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="React, JavaScript, Frontend"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
          />
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Status
          </label>
          <div className="flex gap-3 flex-wrap">
            {STATUSES.map((s) => (
              <label key={s} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="status"
                  value={s}
                  checked={form.status === s}
                  onChange={handleChange}
                  className="accent-blue-600"
                />
                <span className="text-sm font-medium text-slate-700 capitalize group-hover:text-blue-600 transition-colors">
                  {s}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            to="/manage/courses"
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all disabled:opacity-60"
          >
            {submitting
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
              : <><Save className="w-4 h-4" /> {isEditing ? 'Save Changes' : 'Create Course'}</>
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManageCourse;
