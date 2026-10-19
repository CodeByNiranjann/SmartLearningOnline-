import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  fetchProjectById,
  fetchProjectSubmissions,
  fetchProjectParticipants,
  reviewProjectSubmission,
  getProjectSubmissionDownloadUrl,
} from '../../services/api';
import {
  ArrowLeft,
  Users,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  GitBranch,
  Globe,
  Clock,
  Download,
  MessageSquare,
  Trophy,
  RefreshCw,
  FolderGit2,
  X,
  Send,
} from 'lucide-react';

const ProjectReview = () => {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('submissions'); // 'submissions' or 'participants'

  // Review Modal State
  const [selectedSub, setSelectedSub] = useState(null);
  const [marksAwarded, setMarksAwarded] = useState(85);
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('graded');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [projData, subData, partData] = await Promise.all([
        fetchProjectById(projectId),
        fetchProjectSubmissions(projectId),
        fetchProjectParticipants(projectId),
      ]);

      setProject(projData.project);
      setSubmissions(subData.submissions || []);
      setParticipants(partData.participants || []);
    } catch (err) {
      console.error('Failed to load project reviews:', err);
      setError('Failed to load review data. Please verify your instructor permissions.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openReviewModal = (sub) => {
    setSelectedSub(sub);
    setMarksAwarded(sub.marksAwarded ?? sub.grade ?? 85);
    setFeedback(sub.feedback || '');
    setStatus(sub.status === 'graded' ? 'graded' : sub.status === 'needs_revision' ? 'needs_revision' : 'graded');
    setReviewSuccess('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSub) return;

    try {
      setSubmittingReview(true);
      await reviewProjectSubmission(selectedSub._id, {
        marksAwarded: Number(marksAwarded),
        grade: Number(marksAwarded),
        feedback: feedback.trim(),
        status,
      });

      setReviewSuccess('Submission reviewed and graded successfully!');
      setSelectedSub(null);
      loadData();
    } catch (err) {
      console.error('Review submission failed:', err);
      alert(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
        <p className="text-xs font-semibold">Loading submissions and participants...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-sans">
      {/* ─── Breadcrumb ─── */}
      <div className="flex items-center justify-between">
        <Link
          to="/manage/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects List
        </Link>

        {project && (
          <Link
            to={`/projects/${project._id}`}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            View Student Project Page
          </Link>
        )}
      </div>

      {/* ─── Header ─── */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Capstone Review Portal</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {project?.title || 'Project Submissions'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review code repositories, evaluate live deployments, grade rubrics, and track student milestone progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'submissions'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Submissions ({submissions.length})
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'participants'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Participants ({participants.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── SUBMISSIONS TAB ─── */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
              <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">No Submissions Yet</h3>
              <p className="text-xs text-slate-500">
                When enrolled students submit deliverables, they will appear here for your review and evaluation.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => {
                const isGraded = sub.status === 'graded';
                const isRevision = sub.status === 'needs_revision';

                return (
                  <div
                    key={sub._id}
                    className={`p-6 rounded-3xl border transition-all ${
                      isGraded
                        ? 'bg-white border-emerald-200/80 shadow-sm'
                        : isRevision
                        ? 'bg-white border-rose-200/80 shadow-sm'
                        : 'bg-white border-slate-200/90 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                          {sub.studentId?.name?.[0] || 'S'}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{sub.studentId?.name || 'Student'}</h4>
                          <span className="text-xs text-slate-400 block">{sub.studentId?.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                            isGraded
                              ? 'bg-emerald-100 text-emerald-800'
                              : isRevision
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sub.status.replace('_', ' ')}
                        </span>

                        {isGraded && (
                          <span className="text-sm font-black text-emerald-600">
                            {sub.marksAwarded ?? sub.grade}/100 Pts
                          </span>
                        )}

                        <button
                          onClick={() => openReviewModal(sub)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                        >
                          {isGraded ? 'Update Evaluation' : 'Review & Grade'}
                        </button>
                      </div>
                    </div>

                    {/* Milestone details */}
                    {sub.milestoneId && (
                      <div className="mb-3">
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md">
                          Milestone {sub.milestoneId.sequenceOrder}: {sub.milestoneId.title}
                        </span>
                      </div>
                    )}

                    {/* Links & Attachments */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
                      {sub.repositoryUrl && (
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-slate-400 shrink-0" />
                          <a
                            href={sub.repositoryUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline truncate font-semibold"
                          >
                            Repository: {sub.repositoryUrl}
                          </a>
                        </div>
                      )}

                      {sub.demoUrl && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                          <a
                            href={sub.demoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline truncate font-semibold"
                          >
                            Demo: {sub.demoUrl}
                          </a>
                        </div>
                      )}

                      {sub.fileReference && (
                        <div className="flex items-center gap-2">
                          <Download className="w-4 h-4 text-slate-400 shrink-0" />
                          <a
                            href={getProjectSubmissionDownloadUrl(sub._id)}
                            className="text-blue-600 hover:underline font-bold"
                          >
                            Download {sub.fileReference.originalName}
                          </a>
                        </div>
                      )}
                    </div>

                    {sub.description && (
                      <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-700 mb-3 italic">
                        "{sub.description}"
                      </div>
                    )}

                    {sub.feedback && (
                      <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 text-xs text-blue-950">
                        <span className="font-bold block mb-0.5 text-blue-800">Your Evaluation Feedback:</span>
                        <p className="whitespace-pre-line">{sub.feedback}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── PARTICIPANTS TAB ─── */}
      {activeTab === 'participants' && (
        <div className="space-y-4">
          {participants.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">No Participants Enrolled Yet</h3>
              <p className="text-xs text-slate-500">
                Students who enroll in this project will appear here along with their milestone progress.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Enrolled Date</th>
                      <th className="py-3 px-4">Milestone Progress</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {participants.map((p) => (
                      <tr key={p.enrollmentId} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{p.student?.name}</span>
                          <span className="text-[11px] text-slate-400">{p.student?.email}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(p.enrolledAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="w-48 space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                              <span>
                                {p.completedMilestones} of {p.totalMilestones} Completed
                              </span>
                              <span>{p.progressPercentage}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{ width: `${p.progressPercentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                            {p.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Evaluation Modal ─── */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Evaluate Deliverable — {selectedSub.studentId?.name}
              </h3>
              <button onClick={() => setSelectedSub(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Marks Awarded (0 - 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={marksAwarded}
                  onChange={(e) => setMarksAwarded(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Review Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50"
                >
                  <option value="graded">Graded / Accepted</option>
                  <option value="needs_revision">Needs Revision</option>
                  <option value="under_review">Under Review</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Personalized Feedback & Recommendations
                </label>
                <textarea
                  rows={4}
                  required
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide detailed feedback on architecture, test coverage, code style, and UI responsiveness..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 flex items-center gap-1.5 shadow-sm"
                >
                  {submittingReview ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Submit Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectReview;
