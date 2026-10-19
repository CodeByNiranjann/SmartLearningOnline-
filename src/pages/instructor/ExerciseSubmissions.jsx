import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  fetchExerciseById, fetchExerciseSubmissions, reviewExerciseSubmission, getExerciseSubmissionFileUrl
} from '../../services/api';
import {
  ArrowLeft, Users, RefreshCw, CheckCircle, AlertCircle, Clock, Award,
  Download, FileCode, CheckSquare, XCircle, Eye, History, MessageSquare,
  FileText, Code2, UploadCloud, ChevronRight, X
} from 'lucide-react';

const getStatusBadge = (status) => {
  switch (status) {
    case 'Accepted':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Needs Revision':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Submitted':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Under Review':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'In Progress':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

const ExerciseSubmissions = () => {
  const { exerciseId } = useParams();

  const [exercise, setExercise] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected submission for grading modal
  const [reviewModalSub, setReviewModalSub] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    marksAwarded: '',
    reviewerFeedback: '',
    submissionStatus: 'Accepted',
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [modalError, setModalError] = useState('');

  // Selected submission for viewing previous attempts history modal
  const [historyModalSub, setHistoryModalSub] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [exData, subsData] = await Promise.all([
        fetchExerciseById(exerciseId),
        fetchExerciseSubmissions(exerciseId),
      ]);
      setExercise(exData.exercise);
      setSubmissions(subsData.submissions || []);
    } catch (err) {
      console.error('Failed to load submissions:', err);
      setError(err.response?.data?.message || 'Failed to load submissions for this exercise.');
    } finally {
      setLoading(false);
    }
  }, [exerciseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openReviewModal = (sub) => {
    setReviewModalSub(sub);
    setReviewForm({
      marksAwarded: sub.marksAwarded !== null && sub.marksAwarded !== undefined ? sub.marksAwarded : '',
      reviewerFeedback: sub.reviewerFeedback || '',
      submissionStatus: sub.submissionStatus === 'Accepted' || sub.submissionStatus === 'Needs Revision'
        ? sub.submissionStatus
        : 'Accepted',
    });
    setModalError('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    const marksNum = Number(reviewForm.marksAwarded);
    if (isNaN(marksNum) || marksNum < 0) {
      setModalError('Please enter a valid marks value (0 or greater).');
      return;
    }
    if (marksNum > (exercise?.maximumMarks || 100)) {
      setModalError(`Marks awarded cannot exceed maximum marks (${exercise?.maximumMarks}).`);
      return;
    }

    try {
      setSubmittingReview(true);
      await reviewExerciseSubmission(reviewModalSub._id, {
        marksAwarded: marksNum,
        reviewerFeedback: reviewForm.reviewerFeedback.trim(),
        submissionStatus: reviewForm.submissionStatus,
      });

      setSuccess(`Submission for ${reviewModalSub.learnerId?.name || 'student'} has been reviewed.`);
      setReviewModalSub(null);
      loadData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Review submit error:', err);
      setModalError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Loading submissions...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* ─── Breadcrumb & Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/manage/exercises"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Learner Submissions</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                {submissions.length} Total
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Exercise: <strong className="text-slate-800">{exercise?.title}</strong> ({exercise?.courseId?.title})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/exercises/${exerciseId}`}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors inline-flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            View Exercise Page
          </Link>
        </div>
      </div>

      {/* ─── Success/Error Alerts ─── */}
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
          <button onClick={loadData} className="ml-auto underline font-medium">Retry</button>
        </div>
      )}

      {/* ─── Exercise Meta Summary ─── */}
      {exercise && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-sm">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Exercise Type</span>
            <span className="font-semibold text-slate-800">{exercise.exerciseType}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Difficulty & Time</span>
            <span className="font-semibold text-slate-800">{exercise.difficulty} · ~{exercise.estimatedMinutes}m</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Pass Criteria</span>
            <span className="font-semibold text-slate-800">
              {exercise.passingMarks} / {exercise.maximumMarks} Points
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Status</span>
            <span className="font-semibold text-slate-800">{exercise.status}</span>
          </div>
        </div>
      )}

      {/* ─── Submissions Table ─── */}
      {submissions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">No submissions yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Students enrolled in this course have not submitted work for this exercise yet.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Learner</th>
                  <th className="px-4 py-3.5">Status & Attempt</th>
                  <th className="px-4 py-3.5">Submission Artifact</th>
                  <th className="px-4 py-3.5">Marks Awarded</th>
                  <th className="px-4 py-3.5">Timestamps</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Learner */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                          {sub.learnerId?.name ? sub.learnerId.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">
                            {sub.learnerId?.name || 'Student'}
                          </div>
                          <div className="text-xs text-slate-400">
                            {sub.learnerId?.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status & Attempt */}
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(
                            sub.submissionStatus
                          )}`}
                        >
                          {sub.submissionStatus}
                        </span>
                        <div className="text-[11px] text-slate-500">
                          Attempt #{sub.attemptNumber}
                          {sub.history?.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setHistoryModalSub(sub)}
                              className="ml-1.5 text-blue-600 hover:underline font-medium inline-flex items-center gap-0.5"
                            >
                              <History className="w-3 h-3" />
                              View ({sub.history.length})
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Submission content / file */}
                    <td className="px-4 py-4">
                      <div className="space-y-1.5 text-xs">
                        {sub.textAnswer && (
                          <div className="max-w-xs">
                            <span className="font-semibold text-slate-700 block text-[11px]">Answer / Code:</span>
                            <pre className="p-2 rounded-lg bg-slate-100 text-slate-800 font-mono text-[11px] line-clamp-3 overflow-hidden">
                              {sub.textAnswer}
                            </pre>
                          </div>
                        )}
                        {sub.fileReference && (
                          <div>
                            <a
                              href={getExerciseSubmissionFileUrl(sub._id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-xs transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              {sub.fileReference.originalName || 'Download File'}
                              <span className="text-[10px] text-blue-500">
                                ({Math.round((sub.fileReference.fileSize || 0) / 1024)} KB)
                              </span>
                            </a>
                          </div>
                        )}
                        {!sub.textAnswer && !sub.fileReference && (
                          <span className="text-slate-400 italic">No artifact uploaded</span>
                        )}
                      </div>
                    </td>

                    {/* Marks */}
                    <td className="px-4 py-4">
                      <div className="text-xs space-y-1">
                        {sub.marksAwarded !== null && sub.marksAwarded !== undefined ? (
                          <div className="flex items-center gap-1 font-semibold text-slate-900">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            <span>{sub.marksAwarded} / {exercise?.maximumMarks || 100}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                sub.marksAwarded >= (exercise?.passingMarks || 60)
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {sub.marksAwarded >= (exercise?.passingMarks || 60) ? 'Pass' : 'Fail'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not graded</span>
                        )}
                        {sub.reviewerFeedback && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 max-w-xs italic">
                            "{sub.reviewerFeedback}"
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Timestamps */}
                    <td className="px-4 py-4 text-xs text-slate-500">
                      <div>
                        Submitted: {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'Draft'}
                      </div>
                      {sub.reviewedAt && (
                        <div className="text-slate-400 text-[11px]">
                          Reviewed: {new Date(sub.reviewedAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openReviewModal(sub)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        {sub.marksAwarded !== null && sub.marksAwarded !== undefined ? 'Re-grade' : 'Grade & Review'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Grade & Review Modal ─── */}
      {reviewModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Grade & Review Submission</h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalSub(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <div>
                <strong>Student:</strong> {reviewModalSub.learnerId?.name} ({reviewModalSub.learnerId?.email})
              </div>
              <div>
                <strong>Current Attempt:</strong> #{reviewModalSub.attemptNumber}
              </div>
              <div>
                <strong>Max Marks:</strong> {exercise?.maximumMarks} | <strong>Passing Marks:</strong> {exercise?.passingMarks}
              </div>
            </div>

            {modalError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* Status Outcome */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Evaluation Outcome
                </label>
                <select
                  value={reviewForm.submissionStatus}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, submissionStatus: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Accepted">Accepted (Passed)</option>
                  <option value="Needs Revision">Needs Revision (Request Resubmission)</option>
                  <option value="Under Review">Under Review</option>
                </select>
              </div>

              {/* Marks Awarded */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Marks Awarded (0 to {exercise?.maximumMarks || 100})
                </label>
                <input
                  type="number"
                  min="0"
                  max={exercise?.maximumMarks || 100}
                  value={reviewForm.marksAwarded}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, marksAwarded: e.target.value }))}
                  placeholder={`e.g. ${exercise?.passingMarks || 75}`}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              {/* Reviewer Feedback */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Feedback & Guidance for Learner
                </label>
                <textarea
                  rows={4}
                  value={reviewForm.reviewerFeedback}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, reviewerFeedback: e.target.value }))}
                  placeholder="Provide constructive feedback, notes on edge cases, or instructions for revision..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewModalSub(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingReview && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Submit Review & Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Previous Attempts History Modal ─── */}
      {historyModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Submission History — {historyModalSub.learnerId?.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalSub(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Complete audit trail of all previous submissions, timestamps, past grades, and reviewer comments.
            </p>

            <div className="space-y-4">
              {historyModalSub.history.map((hist, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Attempt #{hist.attemptNumber || idx + 1}
                    </span>
                    <span className="text-slate-400">
                      {hist.submittedAt ? new Date(hist.submittedAt).toLocaleString() : ''}
                    </span>
                  </div>

                  {hist.textAnswer && (
                    <div>
                      <span className="text-slate-500 font-semibold block mb-1">Answer / Code:</span>
                      <pre className="p-2.5 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-36">
                        {hist.textAnswer}
                      </pre>
                    </div>
                  )}

                  {hist.fileReference && (
                    <div>
                      <span className="text-slate-500 font-semibold">Attached File: </span>
                      <span className="font-mono text-slate-700">{hist.fileReference.originalName}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-slate-500">Past Marks: </span>
                      <strong className="text-slate-800">
                        {hist.marksAwarded !== null && hist.marksAwarded !== undefined
                          ? `${hist.marksAwarded} pts`
                          : 'Not graded'}
                      </strong>
                    </div>
                    {hist.reviewerFeedback && (
                      <div className="italic text-slate-600 max-w-sm text-right">
                        Feedback: "{hist.reviewerFeedback}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setHistoryModalSub(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseSubmissions;
