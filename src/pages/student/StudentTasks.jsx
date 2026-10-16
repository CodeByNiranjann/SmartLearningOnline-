import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchTasks, submitTask } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  ClipboardList, Search, CheckCircle2, Clock, Award, ArrowRight,
  Send, RefreshCw, AlertCircle, X, FileText, Link2, Star,
  Calendar, ChevronLeft, ChevronRight,
} from 'lucide-react';

const StudentTasks = () => {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  // Submit modal
  const [submittingTask, setSubmittingTask] = useState(null);
  const [submitForm, setSubmitForm] = useState({ textContent: '', submissionLink: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page, limit };
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
  }, [page, limit, search]);

  useEffect(() => {
    const timer = setTimeout(loadTasks, 300);
    return () => clearTimeout(timer);
  }, [loadTasks]);

  const openSubmit = (task) => {
    setSubmittingTask(task);
    const existing = task.mySubmission;
    setSubmitForm({
      textContent: existing?.textContent || '',
      submissionLink: existing?.submissionLink || '',
    });
    setSubmitError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submitForm.textContent.trim() && !submitForm.submissionLink.trim()) {
      return setSubmitError('Please provide your submission: written response or a link.');
    }
    try {
      setSubmitLoading(true);
      setSubmitError('');
      await submitTask(submittingTask._id, submitForm);
      setSuccess(`"${submittingTask.title}" submitted successfully!`);
      setSubmittingTask(null);
      loadTasks();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      if (err.response?.data?.alreadyGraded) {
        setSubmitError('This task has been graded and cannot be resubmitted.');
      } else {
        setSubmitError(err.response?.data?.message || 'Submission failed. Please try again.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const getTaskStatus = (task) => {
    const sub = task.mySubmission;
    if (!sub) return { label: 'Not Submitted', color: 'slate', icon: Clock };
    if (sub.status === 'graded') return { label: 'Graded', color: 'emerald', icon: CheckCircle2 };
    return { label: 'Under Review', color: 'blue', icon: Clock };
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-amber-600" /> Practical Tasks
            </h1>
            <p className="text-sm text-slate-500 mt-1">Submit your course assignments and track your grades.</p>
          </div>
          <button onClick={loadTasks} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium transition shadow-xs">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh
          </button>
        </div>

        {/* Notifications */}
        {success && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />{success}
          </div>
        )}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />{error}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search tasks..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs" />
        </div>

        {/* Tasks Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-48 rounded-2xl bg-slate-200 animate-pulse" />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="font-semibold text-slate-700 mb-1">No Tasks Available</h3>
            <p className="text-sm text-slate-500 mb-5">Enroll in courses to see practical task assignments here.</p>
            <Link to="/courses" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition">
              Browse Courses <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => {
              const { label, color, icon: StatusIcon } = getTaskStatus(task);
              const sub = task.mySubmission;
              const isGraded = sub?.status === 'graded';

              return (
                <div key={task._id} className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition overflow-hidden flex flex-col">
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">{task.title}</h3>
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold bg-${color}-100 text-${color}-700 border border-${color}-200`}>
                        {label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description || 'No description provided.'}</p>

                    <div className="space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700">{task.course?.title || 'Course'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-400" />
                        <span>{task.maxPoints} points</span>
                      </div>
                      {task.dueDate && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                      {isGraded && (
                        <div className="flex items-center gap-1.5 mt-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                          <Award className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-700 font-bold text-sm">{sub.score}/{task.maxPoints} pts</span>
                          {sub.feedback && <span className="text-emerald-600 text-xs ml-1">— {sub.feedback.slice(0, 60)}{sub.feedback.length > 60 ? '…' : ''}</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-5 pb-4">
                    {isGraded ? (
                      <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4" /> Graded
                      </div>
                    ) : (
                      <button onClick={() => openSubmit(task)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition">
                        <Send className="w-3.5 h-3.5" />
                        {sub ? 'Update Submission' : 'Submit Work'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 text-sm">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition shadow-xs">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-slate-600">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition shadow-xs">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Submit Modal */}
        {submittingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900">Submit Task</h2>
                  <p className="text-xs text-slate-400">{submittingTask.title} · {submittingTask.maxPoints} pts</p>
                </div>
                <button onClick={() => setSubmittingTask(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {submitError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{submitError}
                  </div>
                )}
                {submittingTask.instructions && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    <div className="font-semibold mb-1">Instructions:</div>
                    {submittingTask.instructions}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-500" /> Written Response
                  </label>
                  <textarea rows={5} value={submitForm.textContent} onChange={e => setSubmitForm(f => ({ ...f, textContent: e.target.value }))} placeholder="Describe your solution, implementation, or findings..." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-slate-500" /> Submission Link <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <input type="url" value={submitForm.submissionLink} onChange={e => setSubmitForm(f => ({ ...f, submissionLink: e.target.value }))} placeholder="https://github.com/your-repo or https://your-demo.com" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setSubmittingTask(null)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition">Cancel</button>
                  <button type="submit" disabled={submitLoading} className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition disabled:opacity-60 flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    {submitLoading ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTasks;
