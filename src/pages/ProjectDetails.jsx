import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  fetchProjectById,
  enrollInProject,
  leaveProject,
  fetchProjectMilestones,
  updateMilestoneProgress,
  submitProjectDeliverables,
  fetchProjectEnrollmentSubmissions,
  getProjectSubmissionDownloadUrl,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Clock,
  Code2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  GitBranch,
  Globe,
  FileText,
  Send,
  Trophy,
  Sparkles,
  Layers,
  BookOpen,
  ListChecks,
  Check,
  RotateCcw,
  User,
  Calendar,
  MessageSquare,
  Loader2,
  UploadCloud,
  FileCode,
  Download,
  ShieldCheck,
  CheckCircle,
  ChevronRight,
  LogOut,
} from 'lucide-react';

const DIFFICULTY_BADGES = {
  Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Intermediate: 'bg-blue-50 text-blue-700 border-blue-200',
  Advanced: 'bg-purple-50 text-purple-700 border-purple-200',
};

const STATUS_BADGES = {
  not_started: 'bg-slate-100 text-slate-700 border-slate-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  submitted: 'bg-amber-50 text-amber-700 border-amber-200',
  in_review: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  graded: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  needs_revision: 'bg-rose-50 text-rose-700 border-rose-200',
};

import { useAuth } from '../context/AuthContext';
import {
  fetchProjectDetails,
  startProject,
  updateProjectProgress,
} from '../services/api';
import {
  ArrowLeft,
  Briefcase,
  Clock,
  Layers,
  Building2,
  Star,
  Target,
  CheckCircle,
  Circle,
  Play,
  Rocket,
  ExternalLink,
  GitBranch,
  BookOpen,
  Zap,
  ChevronRight,
  Award,
  Users,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

  // Enrollment action loading
  const [enrollLoading, setEnrollLoading] = useState(false);

  // Deliverables Submission Form State
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'milestones', 'deliverables', 'history'

  useEffect(() => {
    loadProjectDetails();
  }, [projectId]);

  const loadProjectDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchProjectById(projectId);
      setProject(data.project);
      setMilestones(data.milestones || []);
      setEnrollment(data.myEnrollment || null);

      if (data.myEnrollment) {
        // Load submission history for this enrollment
        try {
          const subData = await fetchProjectEnrollmentSubmissions(data.myEnrollment._id);
          setSubmissions(subData.submissions || []);
        } catch (subErr) {
          console.error('Failed to load submissions:', subErr);
        }
      }
    } catch (err) {
      console.error('Failed to load project details:', err);
      setError('Could not retrieve project information. Please check your connection.');
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const data = await fetchProjectDetails(projectId);
      setProject(data);

      // If authenticated, try to load student progress
      if (isAuthenticated) {
        try {
          const { fetchMyProjects } = await import('../services/api');
          const myProjects = await fetchMyProjects();
          const myProgress = myProjects.find(
            (p) => p.projectId?._id === projectId || p.projectId === projectId
          );
          if (myProgress) {
            setProgress(myProgress);
            setRepoUrl(myProgress.repositoryUrl || '');
            setNotes(myProgress.notes || '');
          }
        } catch (err) {
          // No progress yet — that's fine
        }
      }
    } catch (err) {
      console.error('Error loading project:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
  const handleStartProject = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setEnrollLoading(true);
      setActionMsg({ type: '', text: '' });
      const res = await enrollInProject(projectId);
      setEnrollment(res.enrollment);
      setActionMsg({
        type: 'success',
        text: 'Successfully joined this real-world project! You can now track milestones and submit deliverables.',
      });
      // Refresh milestones to load initialized student progress
      const mData = await fetchProjectMilestones(projectId);
      setMilestones(mData.milestones || []);
    } catch (err) {
      console.error('Enrollment error:', err);
      setActionMsg({
        type: 'error',
        text: err.response?.data?.message || 'Unable to join project. Please verify prerequisites.',
      });
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleLeaveProject = async () => {
    if (!window.confirm('Are you sure you want to unenroll from this project? Your milestone progress will be reset.')) {
      return;
    }

    try {
      setEnrollLoading(true);
      await leaveProject(projectId);
      setEnrollment(null);
      setSubmissions([]);
      setActionMsg({ type: 'info', text: 'You have left this project.' });
      loadProjectDetails();
    } catch (err) {
      console.error('Leave project error:', err);
      setActionMsg({ type: 'error', text: err.response?.data?.message || 'Failed to unenroll.' });
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleMilestoneStatusToggle = async (milestoneId, currentStatus) => {
    if (!enrollment) return;

    const nextStatus =
      currentStatus === 'completed'
        ? 'in_progress'
        : currentStatus === 'in_progress'
        ? 'completed'
        : 'in_progress';

    try {
      const res = await updateMilestoneProgress(enrollment._id, milestoneId, nextStatus);
      // Update local milestones state
      setMilestones((prev) =>
        prev.map((m) =>
          m._id === milestoneId
            ? { ...m, progress: { ...m.progress, status: res.progress.status, completedAt: res.progress.completedAt } }
            : m
        )
      );
      if (res.enrollmentStatus) {
        setEnrollment((prev) => ({ ...prev, status: res.enrollmentStatus }));
      }
    } catch (err) {
      console.error('Failed to update milestone progress:', err);
    }
  };

  const handleSubmitDeliverable = async (e) => {
    e.preventDefault();
    if (!enrollment) return;

    if (!repositoryUrl.trim() && !demoUrl.trim() && !description.trim() && !selectedFile) {
      setSubmitError('Please provide at least a repository link, live demo URL, description, or attach a deliverable file.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError('');
      setSubmitSuccess('');

      const formData = new FormData();
      if (selectedMilestoneId) formData.append('milestoneId', selectedMilestoneId);
      if (repositoryUrl.trim()) formData.append('repositoryUrl', repositoryUrl.trim());
      if (demoUrl.trim()) formData.append('demoUrl', demoUrl.trim());
      if (description.trim()) formData.append('description', description.trim());
      if (selectedFile) formData.append('file', selectedFile);

      const res = await submitProjectDeliverables(enrollment._id, formData);
      setSubmitSuccess('Deliverable submitted successfully! Your submission is now in review.');
      setRepositoryUrl('');
      setDemoUrl('');
      setDescription('');
      setSelectedFile(null);

      // Reload submissions history & milestones
      const subData = await fetchProjectEnrollmentSubmissions(enrollment._id);
      setSubmissions(subData.submissions || []);
      const mData = await fetchProjectMilestones(projectId);
      setMilestones(mData.milestones || []);
      setActiveTab('history');
    } catch (err) {
      console.error('Deliverable submission failed:', err);
      setSubmitError(
        err.response?.data?.message || 'Failed to submit deliverables. Please check file format and URL validity.'
      );
    } finally {
      setIsSubmitting(false);
    setStarting(true);
    try {
      const result = await startProject(projectId);
      setProgress(result.progress);
    } catch (err) {
      console.error('Error starting project:', err);
    } finally {
      setStarting(false);
    }
  };

  const handleToggleMilestone = async (milestoneIndex) => {
    if (!progress) return;
    setSaving(true);
    try {
      const current = progress.completedMilestones || [];
      let updated;
      if (current.includes(milestoneIndex)) {
        updated = current.filter((i) => i !== milestoneIndex);
      } else {
        updated = [...current, milestoneIndex];
      }

      const result = await updateProjectProgress(projectId, {
        completedMilestones: updated,
        notes,
        repositoryUrl: repoUrl,
      });
      setProgress(result.progress);
    } catch (err) {
      console.error('Error updating milestone:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!progress) return;
    setSaving(true);
    try {
      const result = await updateProjectProgress(projectId, {
        completedMilestones: progress.completedMilestones || [],
        notes,
        repositoryUrl: repoUrl,
      });
      setProgress(result.progress);
    } catch (err) {
      console.error('Error saving notes:', err);
    } finally {
      setSaving(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Intermediate':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Advanced':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-slate-600 font-medium text-sm">Loading project specifications...</p>
      <div className="space-y-6 animate-pulse">
        <div className="h-64 bg-slate-100 rounded-3xl" />
        <div className="h-8 bg-slate-100 rounded-xl w-1/2" />
        <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-100 rounded-2xl" />
          <div className="h-96 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen py-16 px-4 bg-slate-50">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 border border-slate-200 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Project Not Found</h2>
          <p className="text-slate-600 text-sm mb-6">{error || 'This project may have been removed or unpublished.'}</p>
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Real-World Projects
          </Link>
        </div>
  if (!project) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4">
        <Briefcase className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Project Not Found</h2>
        <Link
          to="/internship-projects"
          className="inline-flex items-center gap-2 text-violet-600 font-semibold text-sm hover:text-violet-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>
      </div>
    );
  }

  // Calculate milestone completion stats
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.progress?.status === 'completed').length;
  const progressPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50/70 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Real-World Projects
          </Link>

          {enrollment && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                STATUS_BADGES[enrollment.status] || 'bg-slate-100 text-slate-700'
              }`}
            >
              Project Status: {enrollment.status.replace('_', ' ').toUpperCase()}
            </span>
          )}
        </div>

        {/* Global Action Banner */}
        {actionMsg.text && (
          <div
            className={`mb-6 p-4 rounded-2xl border text-sm flex items-center justify-between ${
              actionMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : actionMsg.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {actionMsg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{actionMsg.text}</span>
            </div>
            <button
              onClick={() => setActionMsg({ type: '', text: '' })}
              className="text-xs font-semibold underline hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ─── Hero Header & Enrollment Banner ─── */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm mb-8 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                    DIFFICULTY_BADGES[project.difficulty] || 'bg-slate-50 text-slate-700'
                  }`}
                >
                  {project.difficulty} Level
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  {project.category}
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  ~{project.estimatedHours} Hours
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" />
                  {project.totalPoints} Rubric Pts
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4 leading-snug">
                {project.title}
              </h1>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                {project.description}
              </p>

              {/* Technologies Badges */}
              {project.technologies && project.technologies.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-xs font-semibold text-slate-400 mr-1">Tech Stack:</span>
                  {project.technologies.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              {/* Required Skills */}
              {project.requiredSkills && project.requiredSkills.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 mr-1">Required Skills:</span>
                  {project.requiredSkills.map((sk, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Right Card: Enrollment CTA & Progress */}
            <div className="w-full lg:w-84 bg-slate-50 rounded-2xl p-6 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Project Enrollment
                </span>

                {enrollment ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 font-medium">Enrollment Active</span>
                        <h4 className="text-sm font-bold text-slate-900 capitalize">
                          {enrollment.status.replace('_', ' ')}
                        </h4>
                      </div>
                    </div>

                    {/* Milestone Progress Bar */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">Milestones Completed</span>
                        <span className="font-bold text-blue-600">
                          {completedMilestones} / {totalMilestones} ({progressPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <button
                        onClick={() => setActiveTab('deliverables')}
                        className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors text-center mr-2 shadow-sm"
                      >
                        Submit Deliverable
                      </button>
                      <button
                        onClick={handleLeaveProject}
                        disabled={enrollLoading || enrollment.status === 'completed'}
                        title={enrollment.status === 'completed' ? 'Completed projects cannot be unenrolled' : 'Leave project'}
                        className="py-2 px-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-medium transition-colors border border-transparent hover:border-rose-200"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Join this real-world project to start completing ordered milestones, submitting deliverables, and receiving personalized instructor feedback.
                    </p>

                    {project.prerequisites && project.prerequisites.length > 0 && (
                      <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3">
                        <span className="text-[11px] font-bold text-amber-900 block mb-1">Prerequisites:</span>
                        <ul className="text-xs text-amber-800 list-disc list-inside space-y-0.5">
                          {project.prerequisites.map((req, i) => (
                            <li key={i}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      onClick={handleEnroll}
                      disabled={enrollLoading}
                      className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {enrollLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Joining Project...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Join This Project
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Associated Curriculum */}
              {project.courseId && (
                <div className="pt-4 border-t border-slate-200 mt-4 text-xs">
                  <span className="text-slate-400 font-medium block mb-1">Associated Course:</span>
                  <Link
                    to={`/courses/${project.courseId._id}`}
                    className="font-bold text-slate-800 hover:text-blue-600 transition-colors line-clamp-1"
                  >
                    {project.courseId.title}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Navigation Tabs ─── */}
        <div className="flex border-b border-slate-200 mb-8 gap-6 text-sm font-semibold text-slate-500">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 transition-colors relative cursor-pointer ${
              activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600 font-bold' : 'hover:text-slate-800'
            }`}
          >
            Overview & Rubrics
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`pb-3 transition-colors relative cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'milestones' ? 'text-blue-600 border-b-2 border-blue-600 font-bold' : 'hover:text-slate-800'
            }`}
          >
            Milestones Tracker
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
              {milestones.length}
            </span>
          </button>
          {enrollment && (
            <>
              <button
                onClick={() => setActiveTab('deliverables')}
                className={`pb-3 transition-colors relative cursor-pointer ${
                  activeTab === 'deliverables' ? 'text-blue-600 border-b-2 border-blue-600 font-bold' : 'hover:text-slate-800'
                }`}
              >
                Submit Deliverables
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`pb-3 transition-colors relative cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600 font-bold' : 'hover:text-slate-800'
                }`}
              >
                Submission History & Feedback
                {submissions.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700">
                    {submissions.length}
                  </span>
                )}
              </button>
            </>
          )}
        </div>

        {/* ─── TAB 1: OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Detailed Description */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Project Specifications & Objectives
                </h3>
                <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-line">
                  {project.fullDescription || project.description}
                </div>

                {project.learningObjectives && project.learningObjectives.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Learning Outcomes & Competencies
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {project.learningObjectives.map((obj, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{obj}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Expected Deliverables */}
              {project.deliverables && project.deliverables.length > 0 && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-indigo-600" />
                    Expected Project Deliverables
                  </h3>
                  <div className="space-y-2.5">
                    {project.deliverables.map((deliv, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-800"
                      >
                        <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px]">
                          {idx + 1}
                        </div>
                        <span>{deliv}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar: Evaluation Rubric */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Evaluation Rubric
                  </h3>
                  <span className="text-xs font-bold text-amber-600">{project.totalPoints} Points</span>
                </div>
                <div className="space-y-3">
                  {project.rubric?.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{item.criteria}</span>
                        <span className="text-xs font-bold text-blue-600">{item.maxPoints} pts</span>
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-slate-500 leading-relaxed">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Starter Resources */}
              {project.starterResources && project.starterResources.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    Starter Resources & Specs
                  </h3>
                  <div className="space-y-2">
                    {project.starterResources.map((res, i) => (
                      <a
                        key={i}
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 text-xs font-medium text-slate-700 hover:text-blue-700 transition-colors"
                      >
                        <span className="truncate pr-2">{res.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-60" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 2: MILESTONES TRACKER ─── */}
        {activeTab === 'milestones' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Ordered Project Milestones</h3>
                <p className="text-xs text-slate-500">
                  Complete each milestone sequentially to make continuous progress on your capstone system.
                </p>
              </div>
              {enrollment && (
                <div className="text-right">
                  <span className="text-xs font-bold text-blue-600">
                    {completedMilestones} of {totalMilestones} Completed
                  </span>
                  <div className="w-36 bg-slate-100 rounded-full h-2 mt-1 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {milestones.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
                <ListChecks className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800">No Milestones Defined Yet</h4>
                <p className="text-xs text-slate-500">The instructor will publish milestones for this project soon.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {milestones.map((milestone, idx) => {
                  const isDone = milestone.progress?.status === 'completed';
                  const isInProg = milestone.progress?.status === 'in_progress';

                  return (
                    <div
                      key={milestone._id}
                      className={`p-6 rounded-3xl border transition-all ${
                        isDone
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : isInProg
                          ? 'bg-blue-50/40 border-blue-200'
                          : 'bg-white border-slate-200/90 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                              isDone
                                ? 'bg-emerald-600 text-white'
                                : isInProg
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isDone ? <Check className="w-5 h-5" /> : milestone.sequenceOrder || idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-base font-bold text-slate-900">{milestone.title}</h4>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                  isDone
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isInProg
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {isDone ? 'Completed' : isInProg ? 'In Progress' : 'Not Started'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                              {milestone.description}
                            </p>

                            {/* Required deliverables for this milestone */}
                            {milestone.requiredDeliverables && milestone.requiredDeliverables.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                                <span className="text-[11px] font-semibold text-slate-400">Deliverables:</span>
                                {milestone.requiredDeliverables.map((deliv, dIdx) => (
                                  <span
                                    key={dIdx}
                                    className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-700 font-medium"
                                  >
                                    {deliv}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Interactive toggle actions if enrolled */}
                        {enrollment && (
                          <div className="flex items-center gap-2 sm:self-center shrink-0">
                            <button
                              onClick={() => handleMilestoneStatusToggle(milestone._id, milestone.progress?.status)}
                              className={`py-2 px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                isDone
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                              }`}
                            >
                              {isDone ? 'Mark In Progress' : 'Mark Completed'}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedMilestoneId(milestone._id);
                                setActiveTab('deliverables');
                              }}
                              className="py-2 px-3.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                            >
                              Submit For This
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: SUBMIT DELIVERABLES ─── */}
        {activeTab === 'deliverables' && enrollment && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Submit Project Deliverables</h3>
              <p className="text-xs text-slate-500">
                Provide your code repository, live deployed demo, notes, and attach files for instructor review.
              </p>
            </div>

            {submitError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitDeliverable} className="space-y-5">
              {/* Optional Milestone Association */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Milestone (Optional)
                </label>
                <select
                  value={selectedMilestoneId}
                  onChange={(e) => setSelectedMilestoneId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Full Project / General Deliverable</option>
                  {milestones.map((m) => (
                    <option key={m._id} value={m._id}>
                      Milestone {m.sequenceOrder}: {m.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* GitHub Repository URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                  Repository URL (GitHub, GitLab, Bitbucket)
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/username/real-world-capstone"
                  value={repositoryUrl}
                  onChange={(e) => setRepositoryUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Live Demo URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  Live Deployment / Demo URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-capstone-demo.vercel.app"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description / Implementation Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Deliverable Notes & Architectural Decisions
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your tech implementation, challenges solved, setup instructions, or test notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              {/* File Upload Deliverable */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
                  Deliverable File Attachment (ZIP, PDF, Source Code, max 15MB)
                </label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors bg-slate-50/50">
                  <input
                    type="file"
                    id="deliverable-file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label htmlFor="deliverable-file" className="cursor-pointer block">
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    {selectedFile ? (
                      <div>
                        <span className="text-xs font-bold text-blue-600 block">{selectedFile.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs font-semibold text-slate-700 block">
                          Click to select a file or drag & drop here
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Supported: .zip, .pdf, .tar.gz, .js, .py, .java, .md, images
                        </span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Deliverables...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit For Instructor Review
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ─── TAB 4: SUBMISSION HISTORY & FEEDBACK ─── */}
        {activeTab === 'history' && enrollment && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Submission History & Evaluation Reports</h3>
              <p className="text-xs text-slate-500">
                Track all submitted deliverables, instructor evaluations, awarded points, and feedback.
              </p>
            </div>

            {submissions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
                <RotateCcw className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800">No Submissions Recorded Yet</h4>
                <p className="text-xs text-slate-500 mb-4">You have not submitted deliverables for this project yet.</p>
                <button
                  onClick={() => setActiveTab('deliverables')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  Submit Your First Deliverable
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub, idx) => {
                  const isGraded = sub.status === 'graded';
                  const isRevision = sub.status === 'needs_revision';

                  return (
                    <div
                      key={sub._id}
                      className={`p-6 rounded-3xl border transition-all ${
                        isGraded
                          ? 'bg-emerald-50/30 border-emerald-200'
                          : isRevision
                          ? 'bg-rose-50/30 border-rose-200'
                          : 'bg-white border-slate-200/90 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-900">
                              Submission #{submissions.length - idx}
                            </span>
                            {sub.milestoneId && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {sub.milestoneId.title}
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                STATUS_BADGES[sub.status] || 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {sub.status.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Submitted {new Date(sub.submittedAt).toLocaleString()}
                          </span>
                        </div>

                        {/* Marks Awarded Badge */}
                        {isGraded && (
                          <div className="text-right">
                            <span className="text-2xl font-black text-emerald-600">{sub.marksAwarded ?? sub.grade}/100</span>
                            <span className="block text-[10px] font-bold text-emerald-700 uppercase">Awarded Score</span>
                          </div>
                        )}
                      </div>

                      {/* Deliverables details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
                        {sub.repositoryUrl && (
                          <div className="flex items-center gap-2">
                            <GitBranch className="w-4 h-4 text-slate-400 shrink-0" />
                            <a
                              href={sub.repositoryUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline truncate"
                            >
                              {sub.repositoryUrl}
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
                              className="text-blue-600 hover:underline truncate"
                            >
                              {sub.demoUrl}
                            </a>
                          </div>
                        )}
                        {sub.fileReference && (
                          <div className="flex items-center gap-2">
                            <Download className="w-4 h-4 text-slate-400 shrink-0" />
                            <a
                              href={getProjectSubmissionDownloadUrl(sub._id)}
                              className="text-blue-600 hover:underline font-semibold"
                            >
                              Download {sub.fileReference.originalName} (
                              {(sub.fileReference.size / 1024).toFixed(0)} KB)
                            </a>
                          </div>
                        )}
                      </div>

                      {sub.description && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl mb-4 italic leading-relaxed">
                          "{sub.description}"
                        </p>
                      )}

                      {/* Instructor Feedback Note */}
                      {sub.feedback && (
                        <div className="bg-white rounded-2xl p-4 border border-blue-200/80 shadow-sm space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                            <span className="flex items-center gap-1.5 text-blue-700">
                              <MessageSquare className="w-3.5 h-3.5" />
                              Instructor Evaluation Feedback
                            </span>
                            {sub.reviewedBy && (
                              <span className="text-[11px] text-slate-500 font-normal">
                                Evaluated by {sub.reviewedBy.name || 'Instructor'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                            {sub.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
  return (
    <div className="space-y-8 font-sans">
      {/* ─── Back Navigation ─── */}
      <Link
        to="/internship-projects"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-violet-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Internship Projects
      </Link>

      {/* ─── Hero Section ─── */}
      <div className="relative rounded-3xl overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={project.thumbnail}
            alt={project.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src =
                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-slate-900/20" />
        </div>

        <div className="relative z-10 p-8 md:p-10 space-y-5">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-slate-800 shadow-sm">
              {project.category}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(
                project.difficulty
              )} shadow-sm`}
            >
              {project.difficulty}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/40 backdrop-blur-md text-white flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {project.industry} • {project.companyType}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight max-w-2xl">
            {project.title}
          </h1>
          <p className="text-slate-200 text-sm md:text-base leading-relaxed max-w-2xl">
            {project.description}
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{project.estimatedDuration}</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>{project.milestones?.length || 0} Milestones</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{project.completionCount || 0} completions</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Popularity: {project.popularity || 0}</span>
            </div>
          </div>

          {/* CTA */}
          {!progress ? (
            <button
              onClick={handleStartProject}
              disabled={starting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-all shadow-lg shadow-violet-600/30 disabled:opacity-50 cursor-pointer"
            >
              {starting ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Rocket className="w-4 h-4" />
              )}
              {starting ? 'Starting...' : 'Start This Project'}
            </button>
          ) : progress.status === 'completed' ? (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/20 backdrop-blur-md text-emerald-300 font-bold text-sm border border-emerald-400/30">
              <Award className="w-4 h-4" />
              Project Completed!
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500/20 backdrop-blur-md text-violet-200 font-bold text-sm border border-violet-400/30">
              <Play className="w-4 h-4" />
              In Progress — {progress.progressPercentage}% complete
            </div>
          )}
        </div>
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          {project.detailedOverview && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-violet-600" />
                Project Overview
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {project.detailedOverview}
              </p>
            </div>
          )}

          {/* Milestones */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-violet-600" />
                Project Milestones
              </h2>
              {progress && (
                <span className="text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full">
                  {progress.completedMilestones?.length || 0}/{project.milestones?.length || 0} done
                </span>
              )}
            </div>

            {/* Progress bar */}
            {progress && (
              <div className="space-y-1">
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700 ease-out"
                    style={{ width: `${progress.progressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-3 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
              {project.milestones?.map((milestone, index) => {
                const isCompleted = progress?.completedMilestones?.includes(index);
                const canToggle = progress && progress.status === 'in_progress';

                return (
                  <div
                    key={index}
                    className={`relative pl-12 py-3 pr-4 rounded-xl border transition-all duration-200 ${
                      isCompleted
                        ? 'bg-violet-50/50 border-violet-200'
                        : 'bg-white border-slate-200/80 hover:border-violet-200'
                    }`}
                  >
                    {/* Node */}
                    <button
                      onClick={() => canToggle && handleToggleMilestone(index)}
                      disabled={!canToggle || saving}
                      className={`absolute left-2.5 top-4 w-6 h-6 rounded-full flex items-center justify-center transition-all z-10 ${
                        canToggle ? 'cursor-pointer' : 'cursor-default'
                      } ${
                        isCompleted
                          ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30'
                          : 'bg-white border-2 border-slate-300 text-slate-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <span className="text-[10px] font-bold">{index + 1}</span>
                      )}
                    </button>

                    <div>
                      <h4
                        className={`text-sm font-bold ${
                          isCompleted ? 'text-violet-800 line-through decoration-violet-300' : 'text-slate-800'
                        }`}
                      >
                        {milestone.title}
                      </h4>
                      {milestone.description && (
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Learning Outcomes */}
          {project.learningOutcomes?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                What You'll Learn
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {project.learningOutcomes.map((outcome, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl bg-violet-50/50 border border-violet-100"
                  >
                    <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                    <span className="text-xs text-slate-700 leading-relaxed font-medium">
                      {outcome}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student Notes & Repo (if started) */}
          {progress && progress.status !== 'not_started' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-violet-600" />
                Your Project Workspace
              </h2>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Repository URL
                  </label>
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/yourusername/project-repo"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Project Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Track your thoughts, challenges, and learnings here..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all resize-none"
                  />
                </div>

                <button
                  onClick={handleSaveNotes}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-all shadow-md shadow-violet-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6">
          {/* Skills & Tools Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-600" />
              Skills & Tools
            </h3>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Skills Required
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {project.skills?.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Tools & Technologies
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {project.tools?.map((tool, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Project Info Summary */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Project Details</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Duration</span>
                <span className="font-semibold text-slate-700">{project.estimatedDuration}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Difficulty</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getDifficultyColor(project.difficulty)}`}>
                  {project.difficulty}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Industry</span>
                <span className="font-semibold text-slate-700">{project.industry}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Company Type</span>
                <span className="font-semibold text-slate-700">{project.companyType}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Milestones</span>
                <span className="font-semibold text-slate-700">{project.milestones?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Completions</span>
                <span className="font-semibold text-slate-700">{project.completionCount || 0}</span>
              </div>
            </div>
          </div>

          {/* Related Courses */}
          {project.relatedCourses?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-600" />
                Related Courses
              </h3>
              <div className="space-y-2">
                {project.relatedCourses.map((course) => (
                  <Link
                    key={course._id}
                    to={`/courses/${course._id}`}
                    className="block p-3 rounded-xl bg-slate-50 hover:bg-violet-50 border border-slate-200 hover:border-violet-200 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                        {course.thumbnail && (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-violet-700 truncate">
                          {course.title}
                        </p>
                        <p className="text-[10px] text-slate-500">{course.category}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-600 flex-shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Repository link */}
          {project.repositoryUrl && (
            <a
              href={project.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white transition-all group"
            >
              <GitBranch className="w-5 h-5" />
              <div className="flex-1">
                <p className="text-xs font-bold">Starter Repository</p>
                <p className="text-[10px] text-slate-400">Clone and start building</p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
