import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  fetchActivityById,
  startActivity,
  fetchActivityAssignment,
  updateActivityProgress,
  submitActivityWork,
  fetchActivitySubmissions,
  getActivitySubmissionDownloadUrl,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Clock,
  Code2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Award,
  BookOpen,
  Send,
  RotateCcw,
  Check,
  Calendar,
  Layers,
  ListChecks,
  FileCheck,
  Download,
  GitBranch,
  Globe,
  FileText,
  UploadCloud,
  X,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  in_progress: { label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  submitted: { label: 'Submitted (Under Review)', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  under_review: { label: 'Under Review', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  needs_revision: { label: 'Needs Revision', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  completed: { label: 'Completed & Evaluated', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  overdue: { label: 'Overdue', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const ActivityWorkspace = () => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [activity, setActivity] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Submission Form State
  const [textResponse, setTextResponse] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState('milestones'); // 'milestones' | 'submit' | 'history'

  const loadWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      // Start or retrieve assignment
      const startRes = await startActivity(activityId);
      const asg = startRes.assignment;
      setAssignment(asg);

      // Fetch activity details
      const actRes = await fetchActivityById(activityId);
      setActivity(actRes.activity);
      setMilestones(actRes.milestones || []);

      // Fetch submission history
      if (asg?._id) {
        const subRes = await fetchActivitySubmissions(asg._id);
        setSubmissions(subRes.submissions || []);
      }
    } catch (err) {
      console.error('Failed to load workspace:', err);
      setError(err.response?.data?.message || 'Failed to initialize activity workspace');
    } finally {
      setLoading(false);
    }
  }, [activityId, isAuthenticated, navigate]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  // Toggle milestone completion
  const handleToggleMilestone = async (milestoneId, currentCompleted) => {
    if (!assignment) return;
    try {
      const res = await updateActivityProgress(assignment._id, {
        milestoneId,
        completed: !currentCompleted,
      });
      setAssignment(res.assignment);
      setSuccessMsg('Milestone progress updated!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update milestone');
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  // Submit deliverables
  const handleSubmitDeliverables = async (e) => {
    e.preventDefault();
    if (!assignment) return;

    try {
      setSubmitting(true);
      setError('');

      const formData = new FormData();
      if (textResponse.trim()) formData.append('textResponse', textResponse.trim());
      if (repositoryUrl.trim()) formData.append('repositoryUrl', repositoryUrl.trim());
      if (demoUrl.trim()) formData.append('demoUrl', demoUrl.trim());

      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const res = await submitActivityWork(assignment._id, formData);
      setSuccessMsg(res.message || 'Work submitted successfully!');
      setTextResponse('');
      setRepositoryUrl('');
      setDemoUrl('');
      setSelectedFiles([]);

      // Reload submissions and assignment
      const updatedSubs = await fetchActivitySubmissions(assignment._id);
      setSubmissions(updatedSubs.submissions || []);

      const updatedAsg = await fetchActivityAssignment(assignment._id);
      setAssignment(updatedAsg.assignment);

      setActiveTab('history');
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || 'Failed to submit work');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 space-y-3 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p className="text-sm">Loading activity workspace...</p>
      </div>
    );
  }

  const latestSubmission = submissions[0] || null;
  const statusInfo = STATUS_CONFIG[assignment?.status] || STATUS_CONFIG.in_progress;
  const canResubmit = activity?.allowResubmission ?? true;

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans pb-16">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 space-y-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to={`/activities/${activityId}`}
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                Student Workspace
              </span>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
                {activity?.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}
            >
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Overall Milestone Progress</span>
            <span className="font-bold text-blue-600">{assignment?.overallProgress || 0}% Complete</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${assignment?.overallProgress || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* Trainer Evaluation Feedback Alert Box (If evaluated or revision requested) */}
      {latestSubmission && (latestSubmission.status === 'completed' || latestSubmission.status === 'needs_revision') && (
        <div
          className={`p-6 rounded-3xl border space-y-3 ${
            latestSubmission.status === 'completed'
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/70 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm">
                {latestSubmission.status === 'completed'
                  ? 'Activity Evaluated by Trainer'
                  : 'Revisions Requested by Trainer'}
              </h3>
            </div>
            {latestSubmission.marksAwarded !== null && latestSubmission.marksAwarded !== undefined && (
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white shadow-xs border border-slate-200">
                Score: {latestSubmission.marksAwarded} / {activity?.maximumMarks || 100} Marks
              </span>
            )}
          </div>

          {latestSubmission.trainerFeedback && (
            <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/60 text-xs space-y-1">
              <span className="font-bold text-slate-700 block">Trainer Feedback:</span>
              <p className="whitespace-pre-wrap text-slate-600">{latestSubmission.trainerFeedback}</p>
            </div>
          )}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('milestones')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'milestones'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ListChecks className="w-4 h-4" />
          <span>Milestones & Roadmap ({milestones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('submit')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'submit'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Submit Deliverables</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'history'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Submission History ({submissions.length})</span>
        </button>
      </div>

      {/* TAB 1: MILESTONES CHECKLIST */}
      {activeTab === 'milestones' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Milestone Tasks Checklist</span>
            </h3>
            <span className="text-xs text-slate-500">
              Check off tasks as you complete them
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {milestones.map((m, idx) => {
              const progressItem = assignment?.milestoneProgress?.find(
                (mp) =>
                  mp.milestone === m._id ||
                  mp.milestone?._id === m._id ||
                  mp.milestone?.toString() === m._id.toString()
              );
              const isCompleted = Boolean(progressItem?.completed);

              return (
                <div
                  key={m._id || idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCompleted
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-slate-50/60 border-slate-200'
                  } flex items-start gap-4`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleMilestone(m._id, isCompleted)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-colors ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-slate-300 hover:border-blue-500 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-xs font-bold ${
                          isCompleted ? 'line-through text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        {m.sequenceOrder || idx + 1}. {m.title}
                      </h4>
                      {m.dueDate && (
                        <span className="text-[10px] font-semibold text-blue-600">
                          Due: {new Date(m.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {m.description && <p className="text-xs text-slate-600">{m.description}</p>}
                    {m.completionRequirements && (
                      <p className="text-[11px] text-slate-500 italic">
                        Criteria: {m.completionRequirements}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SUBMIT DELIVERABLES */}
      {activeTab === 'submit' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 space-y-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-blue-600" />
              <span>Submit Project Deliverables</span>
            </h3>
            <p className="text-xs text-slate-500">
              Provide your repository link, live application URL, written explanations, and any source code attachments.
            </p>
          </div>

          <form onSubmit={handleSubmitDeliverables} className="space-y-5">
            {/* Repository URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-slate-500" />
                <span>Source Code Repository URL (GitHub, GitLab, Bitbucket)</span>
              </label>
              <input
                type="url"
                placeholder="https://github.com/your-username/my-project"
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Live Demo URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>Live Deployment / Demo URL (Optional)</span>
              </label>
              <input
                type="url"
                placeholder="https://my-app.vercel.app"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Text Response / Solution Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Solution Notes & Written Answers</span>
              </label>
              <textarea
                rows={5}
                placeholder="Explain your architectural choices, database schema, difficulties faced, and testing approach..."
                value={textResponse}
                onChange={(e) => setTextResponse(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
              />
            </div>

            {/* File Attachments */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Upload Project Archive or Documents (.zip, .pdf, .txt, source files — max 15MB)
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {selectedFiles.map((f, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium"
                    >
                      {f.name} ({Math.round(f.size / 1024)} KB)
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:shadow-lg disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting Deliverables...' : 'Submit Deliverables'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: SUBMISSION ATTEMPT HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Submission Attempt History</span>
            </h3>
            <span className="text-xs text-slate-500">
              All attempts are permanently preserved
            </span>
          </div>

          {submissions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <FileCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs">No submissions made yet.</p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {submissions.map((sub) => (
                <div
                  key={sub._id}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold">
                        Attempt #{sub.attemptNumber}
                      </span>
                      <span className="text-xs text-slate-500">
                        Submitted {new Date(sub.submittedAt).toLocaleDateString()} at{' '}
                        {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
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
                          : 'Under Review'}
                      </span>
                      {sub.marksAwarded !== null && sub.marksAwarded !== undefined && (
                        <span className="text-xs font-bold text-slate-900">
                          {sub.marksAwarded} / {activity?.maximumMarks || 100} pts
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Links & Files */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {sub.repositoryUrl && (
                      <a
                        href={sub.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-600"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>Repository</span>
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                    )}
                    {sub.demoUrl && (
                      <a
                        href={sub.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-emerald-700 hover:text-emerald-800"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Live Demo</span>
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                    )}
                    {sub.fileReferences?.map((f, i) => (
                      <a
                        key={i}
                        href={getActivitySubmissionDownloadUrl(sub._id, i)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-blue-600 hover:text-blue-700"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{f.originalName}</span>
                      </a>
                    ))}
                  </div>

                  {/* Written notes */}
                  {sub.textResponse && (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700">
                      <p className="font-semibold text-slate-500 text-[11px] mb-1">Response:</p>
                      <p className="whitespace-pre-wrap">{sub.textResponse}</p>
                    </div>
                  )}

                  {/* Feedback */}
                  {sub.trainerFeedback && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950">
                      <p className="font-bold mb-1">Trainer Feedback:</p>
                      <p className="whitespace-pre-wrap">{sub.trainerFeedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityWorkspace;
