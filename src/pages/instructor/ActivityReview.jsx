import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  fetchActivityById,
  fetchActivityAssignments,
  reviewActivitySubmission,
  getActivitySubmissionDownloadUrl,
} from '../../services/api';
import {
  ArrowLeft,
  Users,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Clock,
  Download,
  MessageSquare,
  Award,
  RefreshCw,
  X,
  Send,
  GitBranch,
  Globe,
  FileText,
  Layers,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

const ActivityReview = () => {
  const { activityId } = useParams();

  const [activity, setActivity] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('submissions'); // 'submissions' or 'progress'

  // Review Modal State
  const [selectedSub, setSelectedSub] = useState(null);
  const [marksAwarded, setMarksAwarded] = useState(85);
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('completed');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [actData, asgData] = await Promise.all([
        fetchActivityById(activityId),
        fetchActivityAssignments(activityId),
      ]);

      setActivity(actData.activity);
      setAssignments(asgData.assignments || []);
    } catch (err) {
      console.error('Error loading review data:', err);
      setError('Failed to load activity submissions');
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Flatten submissions across all assignments
  const allSubmissions = [];
  assignments.forEach((asg) => {
    if (asg.submissions?.length) {
      asg.submissions.forEach((sub) => {
        allSubmissions.push({
          ...sub,
          studentName: asg.student?.name || 'Student',
          studentEmail: asg.student?.email || '',
          studentAvatar: asg.student?.avatar,
          assignmentId: asg._id,
        });
      });
    }
  });

  // Sort submissions by submitted date desc
  allSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  const openReviewModal = (sub) => {
    setSelectedSub(sub);
    setMarksAwarded(sub.marksAwarded ?? 80);
    setFeedback(sub.trainerFeedback || '');
    setStatus(sub.status === 'needs_revision' ? 'needs_revision' : 'completed');
    setReviewSuccess('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSub) return;

    try {
      setSubmittingReview(true);
      await reviewActivitySubmission(selectedSub._id, {
        marksAwarded: Number(marksAwarded),
        trainerFeedback: feedback,
        status,
      });

      setReviewSuccess('Submission reviewed and feedback saved successfully!');
      setTimeout(() => {
        setSelectedSub(null);
        loadData();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit evaluation');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 space-y-3 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p className="text-sm">Loading activity submissions and student progress...</p>
      </div>
    );
  }

  const pendingCount = allSubmissions.filter((s) => s.status === 'submitted').length;
  const gradedCount = allSubmissions.filter((s) => s.status === 'completed').length;

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3">
          <Link
            to="/manage/activities"
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
              Submissions & Evaluation
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              {activity?.title || 'Project Activity Submissions'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/manage/activities/${activityId}/edit`}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            Edit Activity
          </Link>
          <button
            onClick={loadData}
            title="Refresh"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrolled Students</p>
          <p className="text-2xl font-bold text-slate-900">{assignments.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Submissions</p>
          <p className="text-2xl font-bold text-blue-600">{allSubmissions.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Evaluation</p>
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Graded & Completed</p>
          <p className="text-2xl font-bold text-emerald-600">{gradedCount}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('submissions')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'submissions'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Submissions ({allSubmissions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('progress')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'progress'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Progress ({assignments.length})</span>
        </button>
      </div>

      {/* TAB 1: SUBMISSIONS LIST */}
      {activeTab === 'submissions' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
          {allSubmissions.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FileCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No submissions yet</p>
              <p className="text-xs text-slate-400">
                Submissions from enrolled students will appear here for grading and review.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-5">Student</th>
                    <th className="py-3.5 px-4">Attempt</th>
                    <th className="py-3.5 px-4">Deliverables</th>
                    <th className="py-3.5 px-4">Status & Marks</th>
                    <th className="py-3.5 px-4">Submitted At</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allSubmissions.map((sub) => (
                    <tr key={sub._id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Student */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                            {sub.studentName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{sub.studentName}</p>
                            <p className="text-[11px] text-slate-400">{sub.studentEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* Attempt */}
                      <td className="py-4 px-4 font-semibold text-slate-700">
                        Attempt #{sub.attemptNumber}
                      </td>

                      {/* Deliverables summary */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {sub.repositoryUrl && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
                              <GitBranch className="w-3 h-3" /> Repo
                            </span>
                          )}
                          {sub.demoUrl && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-medium">
                              <Globe className="w-3 h-3" /> Demo
                            </span>
                          )}
                          {sub.fileReferences?.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-medium">
                              <FileText className="w-3 h-3" /> {sub.fileReferences.length} files
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status & Marks */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              sub.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : sub.status === 'needs_revision'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {sub.status === 'completed'
                              ? 'Evaluated'
                              : sub.status === 'needs_revision'
                              ? 'Needs Revision'
                              : 'Pending Review'}
                          </span>
                          {sub.marksAwarded !== null && sub.marksAwarded !== undefined && (
                            <p className="text-[11px] font-bold text-slate-800">
                              {sub.marksAwarded} / {activity?.maximumMarks || 100} pts
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Submitted Date */}
                      <td className="py-4 px-4 text-slate-500 text-[11px]">
                        {new Date(sub.submittedAt).toLocaleDateString()} at{' '}
                        {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => openReviewModal(sub)}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          Evaluate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STUDENT PROGRESS LIST */}
      {activeTab === 'progress' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
          {assignments.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No students enrolled in this activity yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-5">Student</th>
                    <th className="py-3.5 px-4">Milestone Progress</th>
                    <th className="py-3.5 px-4">Overall Completion</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Started At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map((asg) => {
                    const completedMilestones =
                      asg.milestoneProgress?.filter((m) => m.completed).length || 0;
                    const totalMilestones = asg.milestoneProgress?.length || 0;

                    return (
                      <tr key={asg._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">
                              {asg.student?.name ? asg.student.name.charAt(0) : 'S'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{asg.student?.name || 'Student'}</p>
                              <p className="text-[11px] text-slate-400">{asg.student?.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-semibold text-slate-700">
                            {completedMilestones} of {totalMilestones} milestones
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 max-w-[140px]">
                            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                style={{ width: `${asg.overallProgress || 0}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700">
                              {asg.overallProgress || 0}%
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              asg.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : asg.status === 'submitted'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {asg.status}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-slate-500 text-[11px]">
                          {asg.startedAt ? new Date(asg.startedAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Evaluation & Review Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  Submission Evaluation
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedSub.studentName} — Attempt #{selectedSub.attemptNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reviewSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <p>{reviewSuccess}</p>
              </div>
            )}

            {/* Deliverables Section */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Submitted Deliverables
              </h4>

              {/* Links */}
              <div className="flex flex-wrap gap-2.5">
                {selectedSub.repositoryUrl && (
                  <a
                    href={selectedSub.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    <GitBranch className="w-4 h-4" />
                    <span>View Repository</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                  </a>
                )}

                {selectedSub.demoUrl && (
                  <a
                    href={selectedSub.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    <span>View Live Demo</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                  </a>
                )}
              </div>

              {/* Text Response */}
              {selectedSub.textResponse && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500">Student Text Response:</p>
                  <p className="text-xs text-slate-800 whitespace-pre-wrap">{selectedSub.textResponse}</p>
                </div>
              )}

              {/* Uploaded Files */}
              {selectedSub.fileReferences?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-slate-500">Uploaded File Attachments:</p>
                  <div className="space-y-1.5">
                    {selectedSub.fileReferences.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-slate-800">{file.originalName}</span>
                          <span className="text-[10px] text-slate-400">
                            ({Math.round((file.size || 0) / 1024)} KB)
                          </span>
                        </div>
                        <a
                          href={getActivitySubmissionDownloadUrl(selectedSub._id, idx)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Evaluation Form */}
            <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Trainer Grading & Feedback
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Marks Awarded (Max: {activity?.maximumMarks || 100})
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={activity?.maximumMarks || 100}
                    value={marksAwarded}
                    onChange={(e) => setMarksAwarded(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Evaluation Verdict
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="completed">Accept & Mark Completed</option>
                    <option value="needs_revision">Request Revisions</option>
                    <option value="under_review">Under Review</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Written Feedback for Learner
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide constructive feedback, strengths, and areas to improve..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingReview ? 'Saving Evaluation...' : 'Save Evaluation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityReview;
