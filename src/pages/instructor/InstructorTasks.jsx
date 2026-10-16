import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchTasks, createTask, updateTask, deleteTask, fetchTaskSubmissions, gradeTaskSubmission } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  ClipboardList, Plus, Edit2, Trash2, Eye, RefreshCw, Search, Filter,
  CheckCircle2, XCircle, Clock, AlertCircle, X, Users, Star, Send,
  FileText, ChevronLeft, ChevronRight, Award, Calendar,
} from 'lucide-react';

const InstructorTasks = () => {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Courses list
  const [myCourses, setMyCourses] = useState([]);

  // Modal: Create/Edit Task
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', instructions: '',
    courseId: '', maxPoints: 100, dueDate: '', taskType: 'mixed',
    status: 'published', allowLateSubmissions: true,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Modal: View Submissions
  const [submissionsTask, setSubmissionsTask] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [submissionsTotal, setSubmissionsTotal] = useState(0);

  // Modal: Grade Submission
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' });
  const [gradeLoading, setGradeLoading] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page, limit };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const data = await fetchTasks(params);
      setTasks(data.tasks || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, search]);

  const loadMyCourses = useCallback(async () => {
    try {
      const res = await api.get('/courses?instructor=me&limit=100');
      const courses = res.data.courses || res.data;
      setMyCourses(Array.isArray(courses) ? courses : []);
    } catch (e) {
      console.error('Failed to load courses:', e);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadTasks, 300);
    return () => clearTimeout(timer);
  }, [loadTasks]);

  useEffect(() => {
    loadMyCourses();
  }, [loadMyCourses]);

  const openCreate = () => {
    setEditingTask(null);
    setFormData({ title: '', description: '', instructions: '', courseId: '', maxPoints: 100, dueDate: '', taskType: 'mixed', status: 'published', allowLateSubmissions: true });
    setFormError('');
    setShowFormModal(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      instructions: task.instructions || '',
      courseId: task.course?._id || '',
      maxPoints: task.maxPoints || 100,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      taskType: task.taskType || 'mixed',
      status: task.status || 'published',
      allowLateSubmissions: task.allowLateSubmissions !== false,
    });
    setFormError('');
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return setFormError('Task title is required.');
    if (!formData.courseId) return setFormError('Please select a course.');
    if (!formData.maxPoints || Number(formData.maxPoints) < 1) return setFormError('Max points must be at least 1.');
    try {
      setFormLoading(true);
      setFormError('');
      const payload = { ...formData, courseId: formData.courseId, maxPoints: Number(formData.maxPoints) };
      if (editingTask) {
        await updateTask(editingTask._id, payload);
        setSuccess('Task updated successfully!');
      } else {
        await createTask(payload);
        setSuccess('Task created successfully!');
      }
      setShowFormModal(false);
      loadTasks();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save task.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await deleteTask(deleteTarget._id);
      setSuccess(`Task "${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
      loadTasks();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openSubmissions = async (task) => {
    setSubmissionsTask(task);
    setSubmissionsPage(1);
    loadSubmissions(task._id, 1);
  };

  const loadSubmissions = async (taskId, pg = submissionsPage) => {
    try {
      setSubmissionsLoading(true);
      const data = await fetchTaskSubmissions(taskId, { page: pg, limit: 15 });
      setSubmissions(data.submissions || []);
      setSubmissionsTotal(data.total || 0);
    } catch (err) {
      console.error('Load submissions error:', err);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const openGrade = (submission) => {
    setGradingSubmission(submission);
    setGradeForm({ score: submission.score ?? '', feedback: submission.feedback || '' });
  };

  const handleGrade = async (e) => {
    e.preventDefault();
    if (gradeForm.score === '' || isNaN(Number(gradeForm.score))) return;
    try {
      setGradeLoading(true);
      await gradeTaskSubmission(gradingSubmission._id, {
        score: Number(gradeForm.score),
        feedback: gradeForm.feedback,
      });
      setSuccess('Submission graded successfully!');
      setGradingSubmission(null);
      if (submissionsTask) loadSubmissions(submissionsTask._id, submissionsPage);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Grading failed.');
    } finally {
      setGradeLoading(false);
    }
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'published': return <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200">Published</span>;
      case 'draft': return <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 font-semibold border border-amber-200">Draft</span>;
      case 'archived': return <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 font-semibold border border-slate-200">Archived</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-amber-600" /> Tasks & Assignments
          </h1>
          <p className="text-xs text-slate-500 mt-1">Create practical tasks for students in your courses.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadTasks} className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={openCreate} className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" /> Create Task
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />{success}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500" />{error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-3 shadow-xs">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search tasks..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500">
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Tasks Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 font-semibold">Task</th>
              <th className="py-3 px-4 font-semibold">Course</th>
              <th className="py-3 px-4 font-semibold">Points</th>
              <th className="py-3 px-4 font-semibold">Due Date</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr><td colSpan="6" className="py-10 text-center text-slate-400 text-sm"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />Loading tasks...</td></tr>
            ) : tasks.length === 0 ? (
              <tr><td colSpan="6" className="py-10 text-center text-slate-400 text-sm">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No tasks yet. Create your first task!
              </td></tr>
            ) : tasks.map(task => (
              <tr key={task._id} className="hover:bg-slate-50 transition">
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900 text-sm">{task.title}</div>
                  <div className="text-xs text-slate-400 truncate max-w-xs">{task.description}</div>
                </td>
                <td className="py-3 px-4 text-xs text-slate-600">{task.course?.title || '—'}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-700">
                    <Star className="w-3.5 h-3.5" />{task.maxPoints} pts
                  </div>
                </td>
                <td className="py-3 px-4 text-xs text-slate-500">
                  {task.dueDate ? (
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(task.dueDate).toLocaleDateString()}</span>
                  ) : 'No due date'}
                </td>
                <td className="py-3 px-4">{statusBadge(task.status)}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openSubmissions(task)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition" title="View Submissions">
                      <Users className="w-4 h-4" />
                    </button>
                    <button onClick={() => openEdit(task)} className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 transition" title="Edit Task">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(task)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-500 transition" title="Delete Task">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {tasks.length} of {total} tasks</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition"><ChevronLeft className="w-4 h-4" /></button>
              <span className="font-semibold text-slate-700">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-lg">{editingTask ? 'Edit Task' : 'Create Task'}</h2>
              <button onClick={() => setShowFormModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {formError && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />{formError}</div>}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Task Title *</label>
                <input type="text" value={formData.title} onChange={e => setFormData(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Build a REST API with Express" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Course *</label>
                <select value={formData.courseId} onChange={e => setFormData(f => ({ ...f, courseId: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500" required>
                  <option value="">— Select a Course —</option>
                  {myCourses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Max Points *</label>
                  <input type="number" min="1" max="1000" value={formData.maxPoints} onChange={e => setFormData(f => ({ ...f, maxPoints: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date</label>
                  <input type="date" value={formData.dueDate} onChange={e => setFormData(f => ({ ...f, dueDate: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea rows={2} value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} placeholder="Brief task overview..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Instructions</label>
                <textarea rows={3} value={formData.instructions} onChange={e => setFormData(f => ({ ...f, instructions: e.target.value }))} placeholder="Detailed submission instructions..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData(f => ({ ...f, status: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500">
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Submission Type</label>
                  <select value={formData.taskType} onChange={e => setFormData(f => ({ ...f, taskType: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500">
                    <option value="mixed">Mixed (text + link)</option>
                    <option value="text_submission">Text Only</option>
                    <option value="link_submission">Link Only</option>
                    <option value="file_submission">File Upload</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={formData.allowLateSubmissions} onChange={e => setFormData(f => ({ ...f, allowLateSubmissions: e.target.checked }))} className="w-4 h-4 text-amber-600 rounded" />
                Allow late submissions after due date
              </label>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowFormModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition">Cancel</button>
                <button type="submit" disabled={formLoading} className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition disabled:opacity-60">
                  {formLoading ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {submissionsTask && !gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-lg">Submissions: {submissionsTask.title}</h2>
                <p className="text-xs text-slate-500">{submissionsTotal} total submissions · {submissionsTask.maxPoints} max points</p>
              </div>
              <button onClick={() => setSubmissionsTask(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              {submissionsLoading ? (
                <div className="py-10 text-center text-slate-400"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />Loading submissions...</div>
              ) : submissions.length === 0 ? (
                <div className="py-10 text-center text-slate-400">No submissions yet.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Student</th>
                      <th className="py-3 px-4 font-semibold">Submitted</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Score</th>
                      <th className="py-3 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissions.map(sub => (
                      <tr key={sub._id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{sub.student?.name}</div>
                          <div className="text-xs text-slate-400">{sub.student?.email}</div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          {sub.status === 'graded'
                            ? <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 font-semibold">Graded</span>
                            : <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-semibold">Submitted</span>}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {sub.status === 'graded' ? `${sub.score}/${submissionsTask.maxPoints}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => openGrade(sub)} className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold border border-amber-200 transition flex items-center gap-1 ml-auto">
                            <Award className="w-3.5 h-3.5" />{sub.status === 'graded' ? 'Re-grade' : 'Grade'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSubmissionsTask(null)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Grade Submission</h2>
              <button onClick={() => setGradingSubmission(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleGrade} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700">
                <div className="font-semibold">{gradingSubmission.student?.name}</div>
                <div className="text-xs text-slate-400">{gradingSubmission.student?.email}</div>
                {(gradingSubmission.textContent || gradingSubmission.submissionLink) && (
                  <div className="mt-2 text-xs text-slate-600">
                    {gradingSubmission.submissionLink && <div>🔗 <a href={gradingSubmission.submissionLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{gradingSubmission.submissionLink}</a></div>}
                    {gradingSubmission.textContent && <div className="mt-1 italic">"{gradingSubmission.textContent.slice(0, 200)}"</div>}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Score (0 – {submissionsTask?.maxPoints || 100}) *
                </label>
                <input type="number" min="0" max={submissionsTask?.maxPoints || 100} value={gradeForm.score} onChange={e => setGradeForm(f => ({ ...f, score: e.target.value }))} placeholder="Enter score" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Feedback</label>
                <textarea rows={3} value={gradeForm.feedback} onChange={e => setGradeForm(f => ({ ...f, feedback: e.target.value }))} placeholder="Written feedback for the student..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={() => setGradingSubmission(null)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition">Cancel</button>
                <button type="submit" disabled={gradeLoading} className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition disabled:opacity-60">
                  {gradeLoading ? 'Saving...' : 'Save Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Delete Task?</h3>
            <p className="text-sm text-slate-500 mb-6">This will permanently delete "<span className="font-semibold text-slate-700">{deleteTarget.title}</span>" and all its student submissions.</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition">Cancel</button>
              <button onClick={handleDelete} disabled={deleteLoading} className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition disabled:opacity-60">
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorTasks;
