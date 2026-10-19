import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchExerciseById, createExercise, updateExercise, fetchCourses, fetchCourseModules
} from '../../services/api';
import api from '../../services/api';
import {
  ArrowLeft, Save, Eye, Edit3, Plus, Trash2, CheckCircle, AlertCircle,
  RefreshCw, BookOpen, Layers, Code2, UploadCloud, FileText, FolderGit2,
  Clock, Award, ExternalLink, HelpCircle
} from 'lucide-react';

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
const EXERCISE_TYPES = ['Coding Exercise', 'File Upload', 'Text Answer', 'Project Task'];
const STATUSES = ['Draft', 'Published'];

const INITIAL_FORM = {
  title: '',
  description: '',
  instructions: '',
  courseId: '',
  moduleId: '',
  lessonId: '',
  difficulty: 'Beginner',
  estimatedMinutes: 30,
  exerciseType: 'Coding Exercise',
  maximumMarks: 100,
  passingMarks: 60,
  dueDate: '',
  referenceMaterials: [],
  status: 'Draft',
  starterCode: '// Write your solution below\nfunction solution() {\n  // TODO: implement\n}\n',
};

const EditExercise = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = Boolean(exerciseId) && exerciseId !== 'new';
  const isAdmin = user?.role === 'admin';

  const [form, setForm] = useState(INITIAL_FORM);
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  
  const [loading, setLoading] = useState(isEditing);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'

  // New reference material inputs
  const [newRefTitle, setNewRefTitle] = useState('');
  const [newRefUrl, setNewRefUrl] = useState('');

  // 1. Load instructor courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        const params = {};
        if (!isAdmin && user?._id) {
          params.instructor_id = user._id;
        }
        const data = await fetchCourses(params);
        const courseList = Array.isArray(data) ? data : (data.courses || []);
        setCourses(courseList);
        
        // If creating new and only 1 course exists, pre-select it
        if (!isEditing && courseList.length === 1 && !form.courseId) {
          setForm(prev => ({ ...prev, courseId: courseList[0]._id }));
        }
      } catch (err) {
        console.error('Failed to load courses:', err);
        setError('Failed to load your courses. Please refresh.');
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
  }, [isAdmin, user?._id, isEditing]);

  // 2. Load existing exercise details when editing
  useEffect(() => {
    if (!isEditing) return;
    const loadExisting = async () => {
      try {
        setLoading(true);
        const data = await fetchExerciseById(exerciseId);
        const ex = data.exercise;

        setForm({
          title: ex.title || '',
          description: ex.description || '',
          instructions: ex.instructions || '',
          courseId: ex.courseId?._id || ex.courseId || '',
          moduleId: ex.moduleId?._id || ex.moduleId || '',
          lessonId: ex.lessonId?._id || ex.lessonId || '',
          difficulty: ex.difficulty || 'Beginner',
          estimatedMinutes: ex.estimatedMinutes || 30,
          exerciseType: ex.exerciseType || 'Coding Exercise',
          maximumMarks: ex.maximumMarks ?? 100,
          passingMarks: ex.passingMarks ?? 60,
          dueDate: ex.dueDate ? new Date(ex.dueDate).toISOString().slice(0, 10) : '',
          referenceMaterials: Array.isArray(ex.referenceMaterials) ? ex.referenceMaterials : [],
          status: ex.status || 'Draft',
          starterCode: ex.starterCode || '',
        });
      } catch (err) {
        console.error('Failed to load exercise:', err);
        setError(err.response?.data?.message || 'Failed to load exercise details.');
      } finally {
        setLoading(false);
      }
    };
    loadExisting();
  }, [exerciseId, isEditing]);

  // 3. Cascading: When courseId changes, load modules
  useEffect(() => {
    if (!form.courseId) {
      setModules([]);
      setLessons([]);
      return;
    }
    const loadModules = async () => {
      try {
        setLoadingModules(true);
        const moduleList = await fetchCourseModules(form.courseId);
        setModules(Array.isArray(moduleList) ? moduleList : []);
      } catch (err) {
        console.error('Failed to fetch modules for course:', err);
        setModules([]);
      } finally {
        setLoadingModules(false);
      }
    };
    loadModules();
  }, [form.courseId]);

  // 4. Cascading: When moduleId changes, load lessons
  useEffect(() => {
    if (!form.moduleId) {
      setLessons([]);
      return;
    }
    const loadLessons = async () => {
      try {
        setLoadingLessons(true);
        const res = await api.get(`/modules/${form.moduleId}/lessons`);
        setLessons(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to fetch lessons for module:', err);
        setLessons([]);
      } finally {
        setLoadingLessons(false);
      }
    };
    loadLessons();
  }, [form.moduleId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      // Reset module and lesson if course changed
      if (name === 'courseId') {
        updated.moduleId = '';
        updated.lessonId = '';
      }
      // Reset lesson if module changed
      if (name === 'moduleId') {
        updated.lessonId = '';
      }
      return updated;
    });
    if (error) setError('');
  };

  const handleAddReference = (e) => {
    e.preventDefault();
    if (!newRefTitle.trim() || !newRefUrl.trim()) return;
    setForm(prev => ({
      ...prev,
      referenceMaterials: [
        ...prev.referenceMaterials,
        { title: newRefTitle.trim(), url: newRefUrl.trim() },
      ],
    }));
    setNewRefTitle('');
    setNewRefUrl('');
  };

  const handleRemoveReference = (index) => {
    setForm(prev => ({
      ...prev,
      referenceMaterials: prev.referenceMaterials.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (publishImmediate = null) => {
    setError('');
    setSuccess('');

    // Field validation
    if (!form.title.trim()) {
      setError('Please provide an exercise title.');
      return;
    }
    if (!form.courseId) {
      setError('Please select an associated course.');
      return;
    }
    if (!form.description.trim()) {
      setError('Please provide a brief description / learning objectives.');
      return;
    }
    if (!form.instructions.trim()) {
      setError('Please provide step-by-step instructions for learners.');
      return;
    }
    if (Number(form.maximumMarks) < 0) {
      setError('Maximum marks cannot be negative.');
      return;
    }
    if (Number(form.passingMarks) > Number(form.maximumMarks)) {
      setError('Passing marks cannot exceed maximum marks.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        instructions: form.instructions.trim(),
        courseId: form.courseId,
        moduleId: form.moduleId || null,
        lessonId: form.lessonId || null,
        difficulty: form.difficulty,
        estimatedMinutes: Number(form.estimatedMinutes) || 30,
        exerciseType: form.exerciseType,
        maximumMarks: Number(form.maximumMarks) || 100,
        passingMarks: Number(form.passingMarks) || 60,
        dueDate: form.dueDate ? new Date(form.dueDate) : null,
        referenceMaterials: form.referenceMaterials,
        status: publishImmediate !== null ? publishImmediate : form.status,
        starterCode: form.starterCode,
      };

      if (isEditing) {
        await updateExercise(exerciseId, payload);
        setSuccess('Exercise updated successfully!');
      } else {
        await createExercise(form.courseId, payload);
        setSuccess('Exercise created successfully!');
      }

      setTimeout(() => {
        navigate('/manage/exercises');
      }, 1200);
    } catch (err) {
      console.error('Submit exercise error:', err);
      setError(err.response?.data?.message || 'Failed to save exercise. Please check all fields.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Loading exercise data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* ─── Breadcrumb & Top Controls ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/manage/exercises"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isEditing ? 'Edit Practical Exercise' : 'Create Practical Exercise'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure exercise settings, step-by-step instructions, and grading criteria.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Editor / Preview Tab switcher */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl mr-2">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Live Preview
            </button>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('Draft')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('Published')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {form.status === 'Published' || activeTab === 'preview' ? 'Save & Publish' : 'Publish Exercise'}
          </button>
        </div>
      </div>

      {/* ─── Feedback Alerts ─── */}
      {success && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── PREVIEW TAB ─── */}
      {activeTab === 'preview' ? (
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-blue-900 text-sm">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <span><strong>Learner Preview Mode:</strong> This is how students enrolled in this course will view the exercise.</span>
            </div>
            <button
              onClick={() => setActiveTab('editor')}
              className="text-xs font-semibold bg-white px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 text-blue-700"
            >
              Return to Editor
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {form.exerciseType}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                {form.difficulty}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                ~{form.estimatedMinutes} mins
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                {form.maximumMarks} Points (Pass: {form.passingMarks})
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900">{form.title || 'Untitled Exercise'}</h1>
            <p className="text-slate-600 text-sm">{form.description || 'No description provided.'}</p>

            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-2">Instructions & Tasks</h3>
              <div className="prose prose-slate max-w-none text-sm whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-200">
                {form.instructions || 'No instructions specified yet.'}
              </div>
            </div>

            {form.exerciseType === 'Coding Exercise' && form.starterCode && (
              <div className="border-t border-slate-100 pt-5">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-2">Starter Code</h3>
                <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto">
                  {form.starterCode}
                </pre>
              </div>
            )}

            {form.referenceMaterials.length > 0 && (
              <div className="border-t border-slate-100 pt-5">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-2">Reference Resources</h3>
                <div className="space-y-1.5">
                  {form.referenceMaterials.map((ref, i) => (
                    <a
                      key={i}
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline mr-4"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {ref.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─── EDITOR TAB ─── */
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          {/* Card 1: Core Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Basic Information & Association
            </h2>

            {/* Course, Module, Lesson Cascading Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Course */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course <span className="text-rose-500">*</span>
                </label>
                <select
                  name="courseId"
                  value={form.courseId}
                  onChange={handleChange}
                  disabled={loadingCourses}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  required
                >
                  <option value="">Select a Course</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Exercises belong to a course you own.</p>
              </div>

              {/* Module */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Module (Optional)
                </label>
                <select
                  name="moduleId"
                  value={form.moduleId}
                  onChange={handleChange}
                  disabled={!form.courseId || loadingModules}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white disabled:bg-slate-50"
                >
                  <option value="">None (Entire Course)</option>
                  {modules.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.title}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Attach to a specific module.</p>
              </div>

              {/* Lesson */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lesson (Optional)
                </label>
                <select
                  name="lessonId"
                  value={form.lessonId}
                  onChange={handleChange}
                  disabled={!form.moduleId || loadingLessons}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white disabled:bg-slate-50"
                >
                  <option value="">None (Module-level)</option>
                  {lessons.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.title}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Shows up in the lesson workspace.</p>
              </div>
            </div>

            {/* Exercise Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Exercise Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Implement Binary Search in JavaScript"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            {/* Description & Objectives */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description & Learning Objectives <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="description"
                rows={2}
                value={form.description}
                onChange={handleChange}
                placeholder="Brief summary of what the learner will accomplish and key skills practiced..."
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            {/* Step-by-Step Instructions */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instructions & Tasks <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="instructions"
                rows={6}
                value={form.instructions}
                onChange={handleChange}
                placeholder="Provide detailed step-by-step instructions:&#10;1. Clone the repository...&#10;2. Implement the solve() function...&#10;3. Test edge cases..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Card 2: Configuration & Parameters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Format, Marks & Constraints
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Exercise Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Exercise Type</label>
                <select
                  name="exerciseType"
                  value={form.exerciseType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {EXERCISE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
                <select
                  name="difficulty"
                  value={form.difficulty}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estimated Minutes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Minutes</label>
                <input
                  type="number"
                  name="estimatedMinutes"
                  min="5"
                  max="1440"
                  value={form.estimatedMinutes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Publication Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Max Marks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Maximum Marks</label>
                <input
                  type="number"
                  name="maximumMarks"
                  min="0"
                  max="1000"
                  value={form.maximumMarks}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Passing Marks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Passing Marks</label>
                <input
                  type="number"
                  name="passingMarks"
                  min="0"
                  max={form.maximumMarks}
                  value={form.passingMarks}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date (Optional)</label>
                <input
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Optional Starter Code for Coding Exercise */}
            {form.exerciseType === 'Coding Exercise' && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Starter Template Code (Optional)
                </label>
                <textarea
                  name="starterCode"
                  rows={4}
                  value={form.starterCode}
                  onChange={handleChange}
                  placeholder="// Provide starter code or boilerplate for the student..."
                  className="w-full px-3.5 py-2 font-mono text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-900 text-emerald-400"
                />
              </div>
            )}
          </div>

          {/* Card 3: Reference Materials & Resources */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-blue-600" />
              Reference Materials & Documentation Links
            </h2>
            <p className="text-xs text-slate-500">
              Provide documentation links, articles, or reference manuals to aid learners.
            </p>

            {/* Existing reference links */}
            {form.referenceMaterials.length > 0 && (
              <div className="space-y-2">
                {form.referenceMaterials.map((ref, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{ref.title}</span>
                      <span className="text-slate-400 ml-2">({ref.url})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveReference(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new reference link */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                type="text"
                placeholder="Resource Title (e.g. MDN Array Methods)"
                value={newRefTitle}
                onChange={(e) => setNewRefTitle(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <input
                type="url"
                placeholder="URL (https://...)"
                value={newRefUrl}
                onChange={(e) => setNewRefUrl(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddReference}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Link
              </button>
            </div>
          </div>

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Link
              to="/manage/exercises"
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEditing ? 'Save Changes' : 'Create Exercise'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EditExercise;
